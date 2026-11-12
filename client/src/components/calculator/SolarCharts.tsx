import { useState } from 'react';
import { formatInr, type YearlyCashFlowRow } from '../../utils/solarRoiEngine';

interface SolarChartsProps {
  cashFlows: YearlyCashFlowRow[];
  netInvestmentInr: number;
}

export function SolarCharts({ cashFlows, netInvestmentInr }: SolarChartsProps) {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  if (cashFlows.length === 0) {
    return null;
  }

  const activeRow =
    cashFlows.find((row) => row.year === hoveredYear) ?? cashFlows[cashFlows.length - 1]!;

  // 1. Annual Net Savings Bar Chart geometry
  const width = 560;
  const height = 220;
  const padLeft = 56;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 30;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const maxNetSavings = Math.max(
    1,
    ...cashFlows.map((r) => Math.max(0, r.netCashFlowInr))
  );
  const barStep = chartW / cashFlows.length;
  const barWidth = Math.max(4, barStep * 0.65);

  // 2. Cumulative Cash-Flow Line Chart geometry
  const allCumValues = [-netInvestmentInr, ...cashFlows.map((r) => r.cumulativeCashFlowInr)];
  const minCum = Math.min(0, ...allCumValues);
  const maxCum = Math.max(1, ...allCumValues);
  const cumSpan = Math.max(1, maxCum - minCum);

  const toY = (val: number) => padTop + ((maxCum - val) / cumSpan) * chartH;
  const zeroY = toY(0);

  const linePoints = [
    { year: 0, val: -netInvestmentInr },
    ...cashFlows.map((r) => ({ year: r.year, val: r.cumulativeCashFlowInr })),
  ];
  const polylinePoints = linePoints
    .map((pt, idx) => {
      const x = padLeft + (idx / Math.max(1, linePoints.length - 1)) * chartW;
      const y = toY(pt.val);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#DCE6DF] bg-[#F5F8F5] px-3 py-2 text-xs text-[#17231F] flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong>Inspecting Year {activeRow.year}:</strong> Net Savings{' '}
          <span className="font-semibold text-[#16A36A]">
            {formatInr(activeRow.netCashFlowInr)}
          </span>{' '}
          · Cumulative Cash Flow{' '}
          <span
            className={
              activeRow.cumulativeCashFlowInr >= 0
                ? 'font-semibold text-[#16A36A]'
                : 'font-semibold text-[#B91C1C]'
            }
          >
            {formatInr(activeRow.cumulativeCashFlowInr)}
          </span>
        </span>
        <span className="text-[#64736B]">Hover or tap any year bar/point to inspect</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[#DCE6DF] bg-white p-4 space-y-2">
          <h3 className="text-sm font-semibold text-[#102A25]">
            Annual Net Savings Projection (INR)
          </h3>
          <p className="text-xs text-[#64736B]">
            Accounts for annual panel degradation and electricity tariff escalation.
          </p>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Annual net savings chart"
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
              {formatInr(maxNetSavings)}
            </text>
            <text x={4} y={padTop + chartH} fontSize="10" fill="#64736B">
              ₹0
            </text>

            {cashFlows.map((row, index) => {
              const barHeight = Math.max(
                0,
                (Math.max(0, row.netCashFlowInr) / maxNetSavings) * chartH
              );
              const x = padLeft + index * barStep + (barStep - barWidth) / 2;
              const y = padTop + chartH - barHeight;
              const isSelected = row.year === activeRow.year;
              return (
                <g
                  key={row.year}
                  onMouseEnter={() => setHoveredYear(row.year)}
                  onClick={() => setHoveredYear(row.year)}
                  className="cursor-pointer"
                >
                  <title>
                    {`Year ${row.year}: ${formatInr(row.netCashFlowInr)} net savings`}
                  </title>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={2}
                    fill={isSelected ? '#102A25' : '#16A36A'}
                  />
                </g>
              );
            })}

            <text x={padLeft} y={height - 8} fontSize="10" fill="#64736B">
              Yr 1
            </text>
            <text
              x={padLeft + chartW - 28}
              y={height - 8}
              fontSize="10"
              fill="#64736B"
            >
              Yr {cashFlows.length}
            </text>
          </svg>
        </div>

        <div className="rounded-xl border border-[#DCE6DF] bg-white p-4 space-y-2">
          <h3 className="text-sm font-semibold text-[#102A25]">
            Investment Recovery &amp; Cumulative Cash Flow (INR)
          </h3>
          <p className="text-xs text-[#64736B]">
            Starts at −{formatInr(netInvestmentInr)} net investment and crosses ₹0 at payback.
          </p>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Cumulative cash-flow chart"
            className="w-full h-auto"
          >
            <line
              x1={padLeft}
              y1={zeroY}
              x2={padLeft + chartW}
              y2={zeroY}
              stroke="#F4B942"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <line
              x1={padLeft}
              y1={padTop}
              x2={padLeft}
              y2={padTop + chartH}
              stroke="#DCE6DF"
            />
            <text x={4} y={padTop + 10} fontSize="10" fill="#64736B">
              {formatInr(maxCum)}
            </text>
            <text x={4} y={Math.min(padTop + chartH, Math.max(padTop + 20, zeroY + 3))} fontSize="10" fill="#B45309">
              ₹0
            </text>
            <text x={4} y={padTop + chartH} fontSize="10" fill="#64736B">
              {formatInr(minCum)}
            </text>

            <polyline
              fill="none"
              stroke="#16A36A"
              strokeWidth={2.5}
              points={polylinePoints}
            />

            {linePoints.map((pt, idx) => {
              const x = padLeft + (idx / Math.max(1, linePoints.length - 1)) * chartW;
              const y = toY(pt.val);
              const isSelected = pt.year === activeRow.year;
              return (
                <circle
                  key={pt.year}
                  cx={x}
                  cy={y}
                  r={isSelected ? 4.5 : 2.8}
                  fill={pt.val >= 0 ? '#16A36A' : '#102A25'}
                  className="cursor-pointer"
                  onMouseEnter={() => pt.year > 0 && setHoveredYear(pt.year)}
                  onClick={() => pt.year > 0 && setHoveredYear(pt.year)}
                >
                  <title>{`Year ${pt.year}: ${formatInr(pt.val)} cumulative`}</title>
                </circle>
              );
            })}

            <text x={padLeft} y={height - 8} fontSize="10" fill="#64736B">
              Yr 0
            </text>
            <text
              x={padLeft + chartW - 28}
              y={height - 8}
              fontSize="10"
              fill="#64736B"
            >
              Yr {cashFlows.length}
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}

