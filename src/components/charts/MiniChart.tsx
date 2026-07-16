import { useState, useId, useMemo } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRupiah = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;

const FONT = "'Inter', system-ui, sans-serif";

// ─── 1. LineChart ─────────────────────────────────────────────────────────────

interface LineDataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineDataPoint[];
  width?: number;
  height?: number;
  color?: string;
  secondaryData?: LineDataPoint[];
  secondaryColor?: string;
  showGrid?: boolean;
  showLabels?: boolean;
  className?: string;
}

export function LineChart({
  data,
  width = 600,
  height = 300,
  color = '#e28743',
  secondaryData,
  secondaryColor = '#2563eb',
  showGrid = true,
  showLabels = true,
  className = '',
}: LineChartProps) {
  const uid = useId().replace(/:/g, '_');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [hoveredSec, setHoveredSec] = useState<number | null>(null);

  const pad = { top: 24, right: 24, bottom: showLabels ? 48 : 16, left: showLabels ? 64 : 16 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const allValues = useMemo(() => {
    const vals = data.map((d) => d.value);
    if (secondaryData) vals.push(...secondaryData.map((d) => d.value));
    return vals;
  }, [data, secondaryData]);

  const minV = Math.min(...allValues) * 0.9;
  const maxV = Math.max(...allValues) * 1.1;
  const range = maxV - minV || 1;

  const toX = (i: number, len: number) => pad.left + (i / Math.max(len - 1, 1)) * cw;
  const toY = (v: number) => pad.top + ch - ((v - minV) / range) * ch;

  // Build smooth path using quadratic bezier
  const smoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` Q ${prev.x + (cpx - prev.x) * 0.8} ${prev.y}, ${cpx} ${(prev.y + curr.y) / 2}`;
      d += ` Q ${curr.x - (curr.x - cpx) * 0.8} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  const pts1 = data.map((d, i) => ({ x: toX(i, data.length), y: toY(d.value) }));
  const path1 = smoothPath(pts1);
  const areaPath1 = pts1.length
    ? `${path1} L ${pts1[pts1.length - 1].x} ${pad.top + ch} L ${pts1[0].x} ${pad.top + ch} Z`
    : '';

  const pts2 = secondaryData?.map((d, i) => ({ x: toX(i, secondaryData.length), y: toY(d.value) }));
  const path2 = pts2 ? smoothPath(pts2) : '';
  const areaPath2 =
    pts2 && pts2.length
      ? `${path2} L ${pts2[pts2.length - 1].x} ${pad.top + ch} L ${pts2[0].x} ${pad.top + ch} Z`
      : '';

  // Grid lines (5 horizontal)
  const gridCount = 5;
  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
    const val = minV + (range * i) / gridCount;
    const y = toY(val);
    return { y, val };
  });

  return (
    <div className={`w-full ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`lg1_${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
          {secondaryData && (
            <linearGradient id={`lg2_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.2" />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.02" />
            </linearGradient>
          )}
        </defs>

        {/* Grid */}
        {showGrid &&
          gridLines.map((g, i) => (
            <g key={i}>
              <line
                x1={pad.left}
                y1={g.y}
                x2={pad.left + cw}
                y2={g.y}
                stroke="#e5e7eb"
                strokeWidth="0.8"
                strokeDasharray="4 3"
              />
              {showLabels && (
                <text
                  x={pad.left - 8}
                  y={g.y + 4}
                  textAnchor="end"
                  fill="#9ca3af"
                  fontSize="10"
                  fontFamily={FONT}
                >
                  {g.val >= 1000 ? `${(g.val / 1000).toFixed(0)}k` : g.val.toFixed(0)}
                </text>
              )}
            </g>
          ))}

        {/* Area fills */}
        {areaPath1 && <path d={areaPath1} fill={`url(#lg1_${uid})`} />}
        {areaPath2 && <path d={areaPath2} fill={`url(#lg2_${uid})`} />}

        {/* Secondary line */}
        {path2 && (
          <path d={path2} fill="none" stroke={secondaryColor} strokeWidth="2.5" strokeLinecap="round" />
        )}

        {/* Primary line */}
        {path1 && (
          <path
            d={path1}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              strokeDasharray: 2000,
              strokeDashoffset: 0,
              animation: `lineDrawIn_${uid} 1.2s ease-out`,
            }}
          />
        )}

        {/* Dots – primary */}
        {pts1.map((p, i) => (
          <g
            key={`p1_${i}`}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{ cursor: 'pointer' }}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === i ? 6 : 3.5}
              fill="#fff"
              stroke={color}
              strokeWidth="2.5"
              style={{ transition: 'r 0.2s ease, filter 0.2s ease', filter: hoveredIdx === i ? `drop-shadow(0 0 6px ${color}80)` : 'none' }}
            />
            {hoveredIdx === i && (
              <g>
                <rect
                  x={p.x - 48}
                  y={p.y - 36}
                  width="96"
                  height="24"
                  rx="6"
                  fill="#2d2218"
                  fillOpacity="0.92"
                />
                <text
                  x={p.x}
                  y={p.y - 20}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily={FONT}
                >
                  {formatRupiah(data[i].value)}
                </text>
              </g>
            )}
          </g>
        ))}

        {/* Dots – secondary */}
        {pts2?.map((p, i) => (
          <g
            key={`p2_${i}`}
            onMouseEnter={() => setHoveredSec(i)}
            onMouseLeave={() => setHoveredSec(null)}
            style={{ cursor: 'pointer' }}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredSec === i ? 6 : 3.5}
              fill="#fff"
              stroke={secondaryColor}
              strokeWidth="2.5"
              style={{ transition: 'r 0.2s ease' }}
            />
            {hoveredSec === i && secondaryData && (
              <g>
                <rect
                  x={p.x - 48}
                  y={p.y - 36}
                  width="96"
                  height="24"
                  rx="6"
                  fill="#2d2218"
                  fillOpacity="0.92"
                />
                <text
                  x={p.x}
                  y={p.y - 20}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily={FONT}
                >
                  {formatRupiah(secondaryData[i].value)}
                </text>
              </g>
            )}
          </g>
        ))}

        {/* X-axis labels */}
        {showLabels &&
          data.map((d, i) => {
            // Show subset of labels to avoid overlap
            const step = Math.ceil(data.length / 8);
            if (i % step !== 0 && i !== data.length - 1) return null;
            return (
              <text
                key={`xl_${i}`}
                x={toX(i, data.length)}
                y={pad.top + ch + 28}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize="10"
                fontFamily={FONT}
              >
                {d.label}
              </text>
            );
          })}

        {/* Inline keyframe via <style> */}
        <style>{`
          @keyframes lineDrawIn_${uid} {
            from { stroke-dashoffset: 2000; }
            to   { stroke-dashoffset: 0; }
          }
        `}</style>
      </svg>
    </div>
  );
}

// ─── 2. BarChart ──────────────────────────────────────────────────────────────

interface BarDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarDataPoint[];
  width?: number;
  height?: number;
  horizontal?: boolean;
  className?: string;
}

export function BarChart({
  data,
  width = 600,
  height = 300,
  horizontal = false,
  className = '',
}: BarChartProps) {
  const [mounted, setMounted] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Trigger mount animation
  useState(() => {
    // Use a microtask to flip mounted after first paint
    requestAnimationFrame(() => setMounted(true));
  });

  const pad = horizontal
    ? { top: 16, right: 64, bottom: 16, left: 100 }
    : { top: 32, right: 16, bottom: 48, left: 16 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;
  const maxV = Math.max(...data.map((d) => d.value)) * 1.15 || 1;

  if (horizontal) {
    const barH = Math.min(32, (ch - (data.length - 1) * 6) / data.length);
    const gap = 6;
    const totalH = data.length * (barH + gap) - gap;
    const startY = pad.top + (ch - totalH) / 2;

    return (
      <div className={`w-full ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {data.map((d, i) => {
            const barW = (d.value / maxV) * cw;
            const y = startY + i * (barH + gap);
            const fill = d.color || '#e28743';
            const isHov = hoveredIdx === i;
            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Label */}
                <text
                  x={pad.left - 8}
                  y={y + barH / 2 + 4}
                  textAnchor="end"
                  fill="#6b7280"
                  fontSize="11"
                  fontFamily={FONT}
                >
                  {d.label}
                </text>
                {/* Bar background */}
                <rect
                  x={pad.left}
                  y={y}
                  width={cw}
                  height={barH}
                  rx={barH / 2}
                  fill="#f3f4f6"
                />
                {/* Bar */}
                <rect
                  x={pad.left}
                  y={y}
                  width={mounted ? barW : 0}
                  height={barH}
                  rx={barH / 2}
                  fill={fill}
                  fillOpacity={isHov ? 1 : 0.85}
                  style={{
                    transition: `width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 80}ms, fill-opacity 0.2s ease`,
                  }}
                />
                {/* Value */}
                <text
                  x={pad.left + (mounted ? barW : 0) + 8}
                  y={y + barH / 2 + 4}
                  fill="#374151"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily={FONT}
                  style={{ transition: 'x 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  {formatRupiah(d.value)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // Vertical bars
  const barW = Math.min(48, (cw - (data.length - 1) * 8) / data.length);
  const gap = 8;
  const totalW = data.length * (barW + gap) - gap;
  const startX = pad.left + (cw - totalW) / 2;

  return (
    <div className={`w-full ${className}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Subtle grid */}
        {[0.25, 0.5, 0.75, 1].map((frac, i) => (
          <line
            key={i}
            x1={pad.left}
            y1={pad.top + ch - ch * frac}
            x2={pad.left + cw}
            y2={pad.top + ch - ch * frac}
            stroke="#f0f0f0"
            strokeWidth="0.8"
          />
        ))}

        {data.map((d, i) => {
          const barH = (d.value / maxV) * ch;
          const x = startX + i * (barW + gap);
          const y = pad.top + ch - barH;
          const fill = d.color || '#e28743';
          const isHov = hoveredIdx === i;
          const cornerR = Math.min(6, barW / 3);

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Bar with rounded top */}
              <path
                d={
                  mounted
                    ? `M ${x} ${pad.top + ch}
                       L ${x} ${y + cornerR}
                       Q ${x} ${y}, ${x + cornerR} ${y}
                       L ${x + barW - cornerR} ${y}
                       Q ${x + barW} ${y}, ${x + barW} ${y + cornerR}
                       L ${x + barW} ${pad.top + ch}
                       Z`
                    : `M ${x} ${pad.top + ch} L ${x} ${pad.top + ch} L ${x + barW} ${pad.top + ch} Z`
                }
                fill={fill}
                fillOpacity={isHov ? 1 : 0.82}
                style={{
                  transition: `d 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 60}ms, fill-opacity 0.2s ease`,
                  filter: isHov ? `drop-shadow(0 4px 8px ${fill}40)` : 'none',
                }}
              />

              {/* Value on top */}
              <text
                x={x + barW / 2}
                y={mounted ? y - 8 : pad.top + ch - 8}
                textAnchor="middle"
                fill="#374151"
                fontSize="10"
                fontWeight="600"
                fontFamily={FONT}
                style={{
                  transition: `y 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 60}ms`,
                  opacity: mounted ? 1 : 0,
                }}
              >
                {d.value >= 1000000
                  ? `${(d.value / 1000000).toFixed(1)}jt`
                  : d.value >= 1000
                    ? `${(d.value / 1000).toFixed(0)}k`
                    : d.value.toLocaleString('id-ID')}
              </text>

              {/* X label */}
              <text
                x={x + barW / 2}
                y={pad.top + ch + 20}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize="10"
                fontFamily={FONT}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── 3. DonutChart ────────────────────────────────────────────────────────────

interface DonutDataPoint {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDataPoint[];
  size?: number;
  thickness?: number;
  className?: string;
}

export function DonutChart({
  data,
  size = 220,
  thickness = 36,
  className = '',
}: DonutChartProps) {
  const uid = useId().replace(/:/g, '_');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - thickness) / 2 - 4;
  const circumference = 2 * Math.PI * radius;

  // Build arc segments
  let accOffset = 0;
  const segments = data.map((d, i) => {
    const pct = total > 0 ? d.value / total : 0;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const offset = -accOffset + circumference * 0.25; // start from top
    accOffset += dash;
    return { ...d, idx: i, dash, gap, offset, pct };
  });

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-auto"
        style={{ maxWidth: size, maxHeight: size }}
      >
        <style>{`
          @keyframes donutSpin_${uid} {
            from { stroke-dashoffset: ${circumference}; }
          }
        `}</style>

        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={thickness}
        />

        {/* Segments */}
        {segments.map((seg) => (
          <circle
            key={seg.idx}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={hoveredIdx === seg.idx ? thickness + 6 : thickness}
            strokeDasharray={`${seg.dash} ${seg.gap}`}
            strokeDashoffset={seg.offset}
            strokeLinecap="butt"
            style={{
              transition: 'stroke-width 0.25s ease',
              animation: `donutSpin_${uid} 1s ease-out`,
              cursor: 'pointer',
              filter: hoveredIdx === seg.idx ? `drop-shadow(0 0 8px ${seg.color}60)` : 'none',
            }}
            onMouseEnter={() => setHoveredIdx(seg.idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        ))}

        {/* Center text */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="11"
          fontFamily={FONT}
        >
          Total
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fill="#2d2218"
          fontSize={total >= 10_000_000 ? '14' : '16'}
          fontWeight="700"
          fontFamily={FONT}
        >
          {formatRupiah(total)}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 text-xs"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{ cursor: 'pointer' }}
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-gray-500">{d.label}</span>
            <span className="font-semibold text-gray-700">
              {formatRupiah(d.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 4. SparkLine ─────────────────────────────────────────────────────────────

interface SparkLineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function SparkLine({
  data,
  width = 120,
  height = 40,
  color = '#e28743',
  className = '',
}: SparkLineProps) {
  const uid = useId().replace(/:/g, '_');

  if (data.length === 0) return null;

  const padX = 2;
  const padY = 4;
  const cw = width - padX * 2;
  const ch = height - padY * 2;
  const minV = Math.min(...data);
  const maxV = Math.max(...data);
  const range = maxV - minV || 1;

  const pts = data.map((v, i) => ({
    x: padX + (i / Math.max(data.length - 1, 1)) * cw,
    y: padY + ch - ((v - minV) / range) * ch,
  }));

  // Smooth quadratic bezier
  let line = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;
    line += ` Q ${prev.x + (cpx - prev.x) * 0.8} ${prev.y}, ${cpx} ${(prev.y + curr.y) / 2}`;
    line += ` Q ${curr.x - (curr.x - cpx) * 0.8} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  const area = `${line} L ${pts[pts.length - 1].x} ${padY + ch} L ${pts[0].x} ${padY + ch} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`shrink-0 ${className}`}
      style={{ width, height }}
    >
      <defs>
        <linearGradient id={`spk_${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spk_${uid})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        style={{
          strokeDasharray: 1000,
          strokeDashoffset: 0,
          animation: `sparkDraw_${uid} 0.8s ease-out`,
        }}
      />
      {/* End dot */}
      <circle
        cx={pts[pts.length - 1].x}
        cy={pts[pts.length - 1].y}
        r="2.5"
        fill={color}
      />
      <style>{`
        @keyframes sparkDraw_${uid} {
          from { stroke-dashoffset: 1000; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  );
}
