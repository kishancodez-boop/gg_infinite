import { useState } from 'react';
import type { NationalDashboardSummary } from '../../types/dashboard';

const TECH_COLORS: Record<string, string> = {
  Solar: '#F4B942',
  Wind: '#16A36A',
  'Other Renewable': '#102A25',
};

interface DashboardChartsProps {
  energyMix: NationalDashboardSummary['energyMix'];
  trends: NationalDashboardSummary['trends'];
}

export function DashboardCharts({ energyMix, trends }: DashboardChartsProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 520;
  const height = 210;
  const padLeft = 52;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 30;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const capValues = trends.map((t) => t.capacityMw ?? 0);
  const maxCap = Math.max(1, ...capValues);
  const activePoint =
    hoveredIdx !== null && trends[hoveredIdx]
      ? trends[hoveredIdx]
      : trends[trends.length - 1];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Energy Mix Visualization */}
      <div className="rounded-xl border border-[#DCE6DF] bg-white p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[#102A25]">
            Renewable Energy Mix by Technology
          </h3>
          <p className="text-xs text-[#64736B]">
            Proportional capacity share computed strictly from stored EnergyMetric records.
          </p>
        </div>

        {energyMix.length === 0 ? (
          <p className="text-xs text-[#64736B] py-6">
            No capacity breakdown available for the current filter selection.
          </p>
        ) : (
          <div className="space-y-4">
            <div
              className="h-5 w-full rounded-full overflow-hidden flex bg-[#F5F8F5] border border-[#DCE6DF]"
              role="img"
              aria-label="Renewable energy mix bar"
            >
              {energyMix.map((item) => (
                <div
                  key={item.technology}
                  style={{
                    width: `${item.sharePercent}%`,
                    backgroundColor: TECH_COLORS[item.technology] ?? '#16A36A',
                  }}
                  title={`${item.technology}: ${item.capacityMw.toLocaleString('en-IN')} MW (${item.sharePercent}%)`}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {energyMix.map((item) => (
                <div
                  key={item.technology}
                  className="rounded-lg border border-[#DCE6DF] bg-[#F5F8F5] p-3 space-y-1"
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-[#17231F]">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: TECH_COLORS[item.technology] ?? '#16A36A',
                      }}
                    />
                    {item.technology}
                  </div>
                  <p className="text-sm font-bold text-[#102A25]">
                    {item.capacityMw.toLocaleString('en-IN')} MW
                  </p>
                  <p className="text-[11px] text-[#64736B]">{item.sharePercent}% share</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Capacity & Generation Trend Chart */}
      <div className="rounded-xl border border-[#DCE6DF] bg-white p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-[#102A25]">
              Capacity &amp; Generation Trend
            </h3>
            <p className="text-xs text-[#64736B]">
              Chronological observations across reporting dates.
            </p>
          </div>
          {activePoint ? (
            <span className="text-[11px] text-[#17231F] bg-[#F5F8F5] border border-[#DCE6DF] rounded px-2 py-1">
              {activePoint.date}:{' '}
              {activePoint.capacityMw !== null
                ? `${activePoint.capacityMw.toLocaleString('en-IN')} MW`
                : 'Capacity N/A'}
              {activePoint.generationValue !== null
                ? ` · ${activePoint.generationValue.toLocaleString('en-IN')} ${activePoint.generationUnit ?? ''}`
                : ''}
            </span>
          ) : null}
        </div>

        {trends.length === 0 ? (
          <p className="text-xs text-[#64736B] py-6">
            No time-series observations available for the current filter selection.
          </p>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Capacity and generation trend chart"
            className="w-full h-auto"
          >
            <line
              x1={padLeft}
              y1={padTop}
              x2={padLeft}
              y2={padTop + chartH}
              stroke="#DCE6DF"
            />
            <line
              x1={padLeft}
              y1={padTop + chartH}
              x2={padLeft + chartW}
              y2={padTop + chartH}
              stroke="#DCE6DF"
            />
            <text x={4} y={padTop + 10} fontSize="10" fill="#64736B">
              {maxCap.toLocaleString('en-IN')}
            </text>
            <text x={4} y={padTop + chartH} fontSize="10" fill="#64736B">
              0 MW
            </text>

            {trends.map((pt, idx) => {
              const step = chartW / Math.max(1, trends.length);
              const bw = Math.max(8, step * 0.55);
              const val = pt.capacityMw ?? 0;
              const bh = Math.max(2, (val / maxCap) * chartH);
              const x = padLeft + idx * step + (step - bw) / 2;
              const y = padTop + chartH - bh;
              return (
                <g
                  key={pt.date}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onClick={() => setHoveredIdx(idx)}
                  className="cursor-pointer"
                >
                  <title>{`${pt.date}: ${val.toLocaleString('en-IN')} MW`}</title>
                  <rect
                    x={x}
                    y={y}
                    width={bw}
                    height={bh}
                    rx={2}
                    fill={hoveredIdx === idx ? '#102A25' : '#16A36A'}
                  />
                </g>
              );
            })}

            <text x={padLeft} y={height - 8} fontSize="10" fill="#64736B">
              {trends[0]?.date}
            </text>
            {trends.length > 1 ? (
              <text
                x={padLeft + chartW - 64}
                y={height - 8}
                fontSize="10"
                fill="#64736B"
              >
                {trends[trends.length - 1]?.date}
              </text>
            ) : null}
          </svg>
        )}
      </div>
    </div>
  );
}

