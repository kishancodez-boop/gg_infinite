import crypto from 'node:crypto';

export type RawParsedRow = Record<string, unknown>;

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

export function parseCsvRecords(csvText: string): RawParsedRow[] {
  const trimmed = csvText.replace(/^\uFEFF/, '').trim();
  if (!trimmed) {
    return [];
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return [];
  }

  const headerLine = lines[0] ?? '';
  const headers = splitCsvLine(headerLine).map((h) => h.trim());
  const rows: RawParsedRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = splitCsvLine(lines[i] ?? '');
    const row: RawParsedRow = {};
    headers.forEach((header, idx) => {
      if (header) {
        row[header] = values[idx] ?? '';
      }
    });
    rows.push(row);
  }

  return rows;
}

export function parseJsonRecords(jsonText: string): RawParsedRow[] {
  const parsed = JSON.parse(jsonText) as unknown;

  if (Array.isArray(parsed)) {
    return parsed.filter(
      (item): item is RawParsedRow => typeof item === 'object' && item !== null && !Array.isArray(item)
    );
  }

  if (typeof parsed === 'object' && parsed !== null) {
    const obj = parsed as Record<string, unknown>;
    const candidate = obj.records ?? obj.data ?? obj.items;
    if (Array.isArray(candidate)) {
      return candidate.filter(
        (item): item is RawParsedRow =>
          typeof item === 'object' && item !== null && !Array.isArray(item)
      );
    }
  }

  throw new Error('JSON payload must be an array or an object containing records/data/items array.');
}

export function parseSourcePayload(
  payload: string,
  format: 'csv' | 'json'
): RawParsedRow[] {
  if (format === 'csv') {
    return parseCsvRecords(payload);
  }
  return parseJsonRecords(payload);
}

export function computeSha256(value: unknown): string {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

