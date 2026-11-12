import { useState } from 'react';
import type { ComputedRpoRecord } from '../../types/rpo';

interface RpoComparisonChartProps {
  records: ComputedRpoRecord[];
}

export function RpoComparisonChart({ records }: RpoComparisonChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const items = records.slice(0, 10);

  if (items.length === 0) {
    return null;
  }

  const width = 560;
  const height = 220;
  const padLeft = 44;
  const padRight = 16;
  const padTop = 20;
  const padBottom = 34;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const maxPct = Math.max(
    10,
    ...items.map((r) => Math.max(r.targetPercentage, r.reportedPercentage ?? 0))
  );
  const groupStep = chartW / items.length;
  const barWidth = Math.max(6, Math.min(20, groupStep * 0.32));
  const active = hoveredIdx !== null && items[hoveredIdx] ? items[hoveredIdx] : items[0]!;

  return (
    <div className="rounded-xl border border-[#DCE6DF] bg-white p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[#102A25]">
            RPO Target vs. Reported Achievement (%)
          </h3>
          <p className="text-xs text-[#64736B]">
            Comparing official/stored target percentage against reported achievement (where available).
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#64736B]">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#102A25]" />
            Target %
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#16A36A]" />
            Reported %
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-[#DCE6DF] bg-[#F5F8F5] px-3 py-1.5 text-xs text-[#17231F]">
        <strong>{active.stateOrOrganization}</strong> ({active.compliancePeriod} · {active.category}):{' '}
        Target <strong>{active.targetPercentage}%</strong> · Reported{' '}
        <strong>
          {active.reportedPercentage !== null ? `${active.reportedPercentage}%` : 'Not available'}
        </strong>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="RPO target vs reported achievement chart"
        className="w-full h-auto"
      >
        <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + chartH} stroke="#DCE6DF" />
        <line
          x1={padLeft}
          y1={padTop + chartH}
          x2={padLeft + chartW}
          y2={padTop + chartH}
          stroke="#DCE6DF"
        />
        <text x={4} y={padTop + 10} fontSize="10" fill="#64736B">
          {maxPct}%
        </text>
        <text x={4} y={padTop + chartH} fontSize="10" fill="#64736B">
          0%
        </text>

        {items.map((item, idx) => {
          const groupX = padLeft + idx * groupStep + groupStep / 2;
          const targetH = (item.targetPercentage / maxPct) * chartH;
          const reportedH =
            item.reportedPercentage !== null
              ? (item.reportedPercentage / maxPct) * chartH
              : 0;

          return (
            <g
              key={item.id}
              onMouseEnter={() => setHoveredIdx(idx)}
              onClick={() => setHoveredIdx(idx)}
              className="cursor-pointer"
            >
              <title>
                {`${item.stateOrOrganization} (${item.category}): Target ${item.targetPercentage}%, Reported ${item.reportedPercentage !== null ? `${item.reportedPercentage}%` : 'Not available'}`}
              </title>
              <rect
                x={groupX - barWidth - 1}
                y={padTop + chartH - targetH}
                width={barWidth}
                height={targetH}
                rx={2}
                fill="#102A25"
              />
              {item.reportedPercentage !== null ? (
                <rect
                  x={groupX + 1}
                  y={padTop + chartH - reportedH}
                  width={barWidth}
                  height={reportedH}
                  rx={2}
                  fill="#16A36A"
                />
              ) : null}
              <text
                x={groupX}
                y={height - 10}
                textAnchor="middle"
                fontSize="9"
                fill="#64736B"
              >
                {item.stateOrOrganization.slice(0, 8)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

