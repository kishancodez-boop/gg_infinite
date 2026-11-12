import { z } from 'zod';
import { GEOGRAPHIC_SCOPES, type GeographicScope } from '../../types/domain.js';
import { computeSha256, type RawParsedRow } from './parsers.js';

export interface NormalizedMetricProposal {
  rowIndex: number;
  naturalKey: string;
  contentHash: string;
  proposedData: {
    metricName: string;
    value: number;
    unit: string;
    geographicScope: GeographicScope;
    stateOrRegion: string;
    observationDate: Date;
  };
  publishedAt: Date | null;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
}

export interface RowValidationError {
  rowIndex: number;
  field: string;
  message: string;
}

const normalizedRowSchema = z.object({
  metricName: z.string().trim().min(2, 'metricName is required').max(160),
  value: z.coerce
    .number({ invalid_type_error: 'value must be a valid number' })
    .finite('value must be finite')
    .min(0, 'value must be >= 0'),
  unit: z.string().trim().min(1, 'unit is required').max(40),
  geographicScope: z.enum(GEOGRAPHIC_SCOPES),
  stateOrRegion: z.string().trim().min(1, 'stateOrRegion is required').max(120),
  observationDate: z.coerce
    .date({ invalid_type_error: 'observationDate must be a valid ISO date' })
    .refine((d) => !Number.isNaN(d.getTime()), 'observationDate is invalid'),
});

function pickField(row: RawParsedRow, keys: string[]): unknown {
  for (const key of keys) {
    if (key in row && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return row[key];
    }
  }
  return undefined;
}

function inferScope(rawScope: unknown, stateOrRegion: string): string {
  if (typeof rawScope === 'string' && rawScope.trim()) {
    return rawScope.trim().toLowerCase();
  }
  const normalizedState = stateOrRegion.trim().toLowerCase();
  if (normalizedState === 'india' || normalizedState === 'all india' || normalizedState === 'national') {
    return 'national';
  }
  return 'state';
}

export function buildNaturalKey(
  sourceId: string,
  metricName: string,
  stateOrRegion: string,
  observationDate: Date
): string {
  const datePart = observationDate.toISOString().slice(0, 10);
  const slug = [sourceId, metricName, stateOrRegion, datePart]
    .map((part) => part.trim().toLowerCase().replace(/\s+/g, '_'))
    .join('::');
  return slug.slice(0, 240);
}

export function normalizeAndValidateRows(
  rows: RawParsedRow[],
  sourceId: string
): {
  accepted: NormalizedMetricProposal[];
  errors: RowValidationError[];
} {
  const accepted: NormalizedMetricProposal[] = [];
  const errors: RowValidationError[] = [];

  rows.forEach((row, index) => {
    const rowIndex = index + 1;
    const rawState = String(
      pickField(row, ['stateOrRegion', 'state', 'region', 'state_name']) ?? 'India'
    ).trim();
    const rawScope = pickField(row, ['geographicScope', 'geographic_scope', 'scope']);

    const candidate = {
      metricName: pickField(row, ['metricName', 'metric_name', 'indicator', 'metric']),
      value: pickField(row, ['value', 'installed_capacity_mw', 'capacity_mw', 'amount']),
      unit: pickField(row, ['unit', 'units']) ?? 'MW',
      geographicScope: inferScope(rawScope, rawState),
      stateOrRegion: rawState,
      observationDate: pickField(row, [
        'observationDate',
        'observation_date',
        'as_of_date',
        'date',
      ]),
    };

    const parsed = normalizedRowSchema.safeParse(candidate);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      errors.push({
        rowIndex,
        field: firstIssue?.path.join('.') || 'row',
        message: firstIssue?.message || 'Row failed schema validation',
      });
      return;
    }

    const rawPublishedAt = pickField(row, ['publishedAt', 'published_at']);
    let publishedAt: Date | null = null;
    if (rawPublishedAt !== undefined) {
      const parsedDate = new Date(String(rawPublishedAt));
      if (!Number.isNaN(parsedDate.getTime())) {
        publishedAt = parsedDate;
      }
    }

    const naturalKey = buildNaturalKey(
      sourceId,
      parsed.data.metricName,
      parsed.data.stateOrRegion,
      parsed.data.observationDate
    );

    const contentHash = computeSha256({
      metricName: parsed.data.metricName,
      value: parsed.data.value,
      unit: parsed.data.unit,
      geographicScope: parsed.data.geographicScope,
      stateOrRegion: parsed.data.stateOrRegion,
      observationDate: parsed.data.observationDate.toISOString(),
    });

    const notes = String(pickField(row, ['notes', 'remarks']) ?? '').trim().slice(0, 600);

    accepted.push({
      rowIndex,
      naturalKey,
      contentHash,
      proposedData: parsed.data,
      publishedAt,
      confidence: parsed.data.observationDate ? 'high' : 'medium',
      notes,
    });
  });

  return { accepted, errors };
}

