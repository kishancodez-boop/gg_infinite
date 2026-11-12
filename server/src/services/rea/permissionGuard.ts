import net from 'node:net';
import type { DataSourceDocument } from '../../models/DataSource.js';
import type { AccessMethod, IngestionMode, VerificationStatus } from '../../types/domain.js';

const AUTOMATED_ACCESS_METHODS = new Set<AccessMethod>([
  'api',
  'csv',
  'xlsx',
  'rss',
  'html_public',
]);

const ALLOWED_CONTENT_TYPES = [
  'application/json',
  'text/csv',
  'application/csv',
  'text/plain',
];

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 2;

export interface SourcePermissionResult {
  allowed: boolean;
  reason: string;
  code:
    | 'ALLOWED_LIVE'
    | 'ALLOWED_DEMO_FIXTURE'
    | 'SOURCE_INACTIVE'
    | 'SOURCE_NOT_VERIFIED'
    | 'MANUAL_ONLY_BLOCKED'
    | 'URL_BLOCKED';
}

function isPrivateOrLoopbackIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    const a = parts[0] ?? -1;
    const b = parts[1] ?? -1;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    return false;
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (
      normalized === '::1' ||
      normalized === '::' ||
      normalized.startsWith('fe80:') ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd')
    ) {
      return true;
    }
    if (normalized.startsWith('::ffff:')) {
      return isPrivateOrLoopbackIp(normalized.slice(7));
    }
  }

  return false;
}

export function validateFetchUrl(
  rawUrl: string,
  allowedDomains: string[]
): { valid: boolean; reason?: string; parsedUrl?: URL } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, reason: 'Invalid URL format.' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, reason: 'Only HTTPS URLs are permitted for automated fetching.' };
  }

  if (parsed.username || parsed.password) {
    return { valid: false, reason: 'URLs with embedded credentials are blocked.' };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    isPrivateOrLoopbackIp(hostname)
  ) {
    return { valid: false, reason: 'Private, loopback, or internal network hosts are blocked (SSRF protection).' };
  }

  const normalizedAllowed = allowedDomains.map((d) => d.toLowerCase().trim()).filter(Boolean);
  const domainMatches = normalizedAllowed.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );

  if (!domainMatches) {
    return {
      valid: false,
      reason: `Host "${hostname}" is not in the registered source domain allowlist (${normalizedAllowed.join(', ')}).`,
    };
  }

  return { valid: true, parsedUrl: parsed };
}

export function evaluateSourcePermission(
  source: Pick<
    DataSourceDocument,
    'active' | 'verificationStatus' | 'accessMethod' | 'sourceUrl' | 'domain' | 'sourceName'
  >,
  mode: IngestionMode
): SourcePermissionResult {
  if (!source.active) {
    return {
      allowed: false,
      code: 'SOURCE_INACTIVE',
      reason: `Source "${source.sourceName}" is inactive and cannot be ingested.`,
    };
  }

  if (mode === 'fixture') {
    return {
      allowed: true,
      code: 'ALLOWED_DEMO_FIXTURE',
      reason:
        'Demo fixture mode uses local sample data only (no external network fetch); all outputs are labeled DEMO.',
    };
  }

  const status: VerificationStatus = source.verificationStatus;
  if (status !== 'verified') {
    return {
      allowed: false,
      code: 'SOURCE_NOT_VERIFIED',
      reason: `Source "${source.sourceName}" has verificationStatus="${status}". Only "verified" sources may run automated live ingestion.`,
    };
  }

  if (!AUTOMATED_ACCESS_METHODS.has(source.accessMethod)) {
    return {
      allowed: false,
      code: 'MANUAL_ONLY_BLOCKED',
      reason: `Source "${source.sourceName}" is marked accessMethod="${source.accessMethod}" (manual-only). Automated scraping is prohibited.`,
    };
  }

  const urlCheck = validateFetchUrl(source.sourceUrl, [source.domain]);
  if (!urlCheck.valid) {
    return {
      allowed: false,
      code: 'URL_BLOCKED',
      reason: urlCheck.reason ?? 'Source URL failed security validation.',
    };
  }

  return {
    allowed: true,
    code: 'ALLOWED_LIVE',
    reason: `Source "${source.sourceName}" is verified and permitted for automated "${source.accessMethod}" access.`,
  };
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  fetchImpl?: typeof fetch;
}

export interface SafeFetchResult {
  finalUrl: string;
  contentType: string;
  body: string;
  byteLength: number;
}

export async function safeFetchOfficialResource(
  targetUrl: string,
  allowedDomains: string[],
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const fetchFn = options.fetchImpl ?? fetch;

  let currentUrl = targetUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const check = validateFetchUrl(currentUrl, allowedDomains);
    if (!check.valid || !check.parsedUrl) {
      throw new Error(check.reason ?? 'Blocked fetch URL');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchFn(check.parsedUrl.toString(), {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Accept: 'application/json, text/csv, text/plain;q=0.9',
          'User-Agent': 'GreenGrid-India-REA/1.0 (+official-open-data-check)',
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) {
          throw new Error(`Redirect (${response.status}) missing Location header.`);
        }
        if (hop === MAX_REDIRECTS) {
          throw new Error(`Exceeded maximum redirect hops (${MAX_REDIRECTS}).`);
        }
        currentUrl = new URL(location, check.parsedUrl).toString();
        continue;
      }

      if (!response.ok) {
        throw new Error(`Upstream source responded with HTTP ${response.status}.`);
      }

      const rawContentType = (response.headers.get('content-type') ?? '').toLowerCase();
      const mimeType = rawContentType.split(';')[0]?.trim() ?? '';
      if (mimeType && !ALLOWED_CONTENT_TYPES.includes(mimeType)) {
        throw new Error(`Disallowed content-type "${mimeType}". Expected JSON or CSV.`);
      }

      const contentLengthHeader = response.headers.get('content-length');
      if (contentLengthHeader && Number(contentLengthHeader) > maxBytes) {
        throw new Error(`Response size exceeds max limit of ${maxBytes} bytes.`);
      }

      let text = '';
      let byteLength = 0;

      if (response.body) {
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            byteLength += value.byteLength;
            if (byteLength > maxBytes) {
              await reader.cancel();
              throw new Error(
                `Response body exceeds max limit of ${maxBytes} bytes.`
              );
            }
            chunks.push(value);
          }
        }
        text = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8');
      } else {
        text = await response.text();
        byteLength = Buffer.byteLength(text, 'utf8');
        if (byteLength > maxBytes) {
          throw new Error(
            `Response body (${byteLength} bytes) exceeds max limit of ${maxBytes} bytes.`
          );
        }
      }

      return {
        finalUrl: check.parsedUrl.toString(),
        contentType: mimeType || 'text/plain',
        body: text,
        byteLength,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error('Unexpected fetch termination.');
}

