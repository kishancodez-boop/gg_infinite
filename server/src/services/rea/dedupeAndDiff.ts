import type { ChangeType } from '../../types/domain.js';
import type { NormalizedMetricProposal } from './normalizerAndValidator.js';
import { computeSha256 } from './parsers.js';

export interface ExistingMetricSnapshot {
  metricName: string;
  value: number;
  unit: string;
  geographicScope: string;
  stateOrRegion: string;
  observationDate: Date;
}

export interface DiffResult {
  changeType: ChangeType;
  changeSummary: string;
}

export function computeProposalDiff(
  proposal: NormalizedMetricProposal,
  existingMetric: ExistingMetricSnapshot | null,
  existingPendingHash: string | null
): DiffResult {
  if (existingPendingHash && existingPendingHash === proposal.contentHash) {
    return {
      changeType: 'unchanged',
      changeSummary: 'Matches an existing staged record with identical content hash.',
    };
  }

  if (!existingMetric) {
    return {
      changeType: 'new',
      changeSummary: 'New record not yet published in EnergyMetric.',
    };
  }

  const existingHash = computeSha256({
    metricName: existingMetric.metricName,
    value: existingMetric.value,
    unit: existingMetric.unit,
    geographicScope: existingMetric.geographicScope,
    stateOrRegion: existingMetric.stateOrRegion,
    observationDate: new Date(existingMetric.observationDate).toISOString(),
  });

  if (existingHash === proposal.contentHash) {
    return {
      changeType: 'unchanged',
      changeSummary: 'Identical to currently published EnergyMetric record.',
    };
  }

  const diffs: string[] = [];
  if (existingMetric.value !== proposal.proposedData.value) {
    diffs.push(`value: ${existingMetric.value} -> ${proposal.proposedData.value}`);
  }
  if (existingMetric.unit !== proposal.proposedData.unit) {
    diffs.push(`unit: ${existingMetric.unit} -> ${proposal.proposedData.unit}`);
  }
  if (existingMetric.geographicScope !== proposal.proposedData.geographicScope) {
    diffs.push(
      `scope: ${existingMetric.geographicScope} -> ${proposal.proposedData.geographicScope}`
    );
  }

  return {
    changeType: 'updated',
    changeSummary:
      diffs.length > 0
        ? `Updated from published record (${diffs.join('; ')}).`
        : 'Updated metadata compared to published record.',
  };
}

