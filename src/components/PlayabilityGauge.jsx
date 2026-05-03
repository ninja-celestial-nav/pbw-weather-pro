import { useEffect, useState } from 'react';

export default function PlayabilityGauge({ score = 0, category = '', color = '#666' }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 800;
    const start = animatedScore;
    const diff = score - start;
    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, [score]);

  // SVG gauge parameters
  const cx = 150, cy = 140;
  const radius = 110;
  const startAngle = -210; // bottom-left
  const endAngle = 30;     // bottom-right
  const totalArc = endAngle - startAngle; // 240 degrees
  const scoreAngle = startAngle + (animatedScore / 100) * totalArc;

  const degToRad = (d) => (d * Math.PI) / 180;

  // Arc segment colors for accurate gauge coloring
  const segments = [
    { from: 0, to: 20, color: '#ef4444' },   // Red (Unplayable)
    { from: 20, to: 35, color: '#f97316' },   // Orange (Poor)
    { from: 35, to: 55, color: '#eab308' },   // Yellow (Fair)
    { from: 55, to: 75, color: '#84cc16' },   // Lime (Good)
    { from: 75, to: 90, color: '#22c55e' },   // Green (Great)
    { from: 90, to: 100, color: '#10b981' },  // Emerald (Excellent)
  ];

  function arcPath(r, startDeg, endDeg) {
    const s = degToRad(startDeg);
    const e = degToRad(endDeg);
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const large = (endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  // Needle
  const needleRad = degToRad(scoreAngle);
  const needleTipX = cx + (radius - 10) * Math.cos(needleRad);
  const needleTipY = cy + (radius - 10) * Math.sin(needleRad);
  // Needle base (triangle)
  const baseOffset = 5;
  const perpAngle = needleRad + Math.PI / 2;
  const bx1 = cx + baseOffset * Math.cos(perpAngle);
  const by1 = cy + baseOffset * Math.sin(perpAngle);
  const bx2 = cx - baseOffset * Math.cos(perpAngle);
  const by2 = cy - baseOffset * Math.sin(perpAngle);

  // Tick marks
  const ticks = [0, 20, 40, 60, 80, 100];

  // Glow color based on score
  const getGlowColor = (s) => {
    if (s >= 80) return '#10b981';
    if (s >= 60) return '#22c55e';
    if (s >= 40) return '#eab308';
    if (s >= 20) return '#f97316';
    return '#ef4444';
  };

  const glowColor = getGlowColor(animatedScore);

  return (
    <div className="flex flex-col items-center">
      <svg width="100%" viewBox="0 0 300 210" style={{ maxWidth: 320 }}>
        <defs>
          <filter id="arcGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="needleShadow">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={glowColor} floodOpacity="0.6" />
          </filter>
          <filter id="scoreGlow">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={glowColor} floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Background arc track */}
        <path
          d={arcPath(radius, startAngle, endAngle)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="22"
          strokeLinecap="round"
        />

        {/* Colored arc segments — each segment gets its own color */}
        {segments.map((seg, i) => {
          const segStart = startAngle + (seg.from / 100) * totalArc;
          const segEnd = startAngle + (Math.min(seg.to, animatedScore) / 100) * totalArc;
          if (animatedScore <= seg.from) return null;
          return (
            <path
              key={i}
              d={arcPath(radius, segStart, segEnd)}
              fill="none"
              stroke={seg.color}
              strokeWidth="22"
              strokeLinecap={i === 0 ? 'round' : 'butt'}
              filter="url(#arcGlow)"
              style={{ opacity: 0.9 }}
            />
          );
        })}

        {/* Round cap at the end of the filled arc */}
        {animatedScore > 0 && (() => {
          const endRad = degToRad(scoreAngle);
          const capX = cx + radius * Math.cos(endRad);
          const capY = cy + radius * Math.sin(endRad);
          return <circle cx={capX} cy={capY} r="11" fill={glowColor} opacity="0.9" filter="url(#arcGlow)" />;
        })()}

        {/* Tick marks and labels */}
        {ticks.map((tick) => {
          const angle = degToRad(startAngle + (tick / 100) * totalArc);
          const outerR = radius + 20;
          const innerR = radius + 14;
          const labelR = outerR + 11;
          const tickColor = tick <= animatedScore ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)';
          return (
            <g key={tick}>
              <line
                x1={cx + innerR * Math.cos(angle)}
                y1={cy + innerR * Math.sin(angle)}
                x2={cx + outerR * Math.cos(angle)}
                y2={cy + outerR * Math.sin(angle)}
                stroke={tickColor}
                strokeWidth="2"
              />
              <text
                x={cx + labelR * Math.cos(angle)}
                y={cy + labelR * Math.sin(angle)}
                fill="rgba(255,255,255,0.35)"
                fontSize="10"
                fontWeight="500"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="Inter, system-ui, sans-serif"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Needle — triangle shape */}
        <polygon
          points={`${needleTipX},${needleTipY} ${bx1},${by1} ${bx2},${by2}`}
          fill={color}
          filter="url(#needleShadow)"
          opacity="0.95"
        />

        {/* Needle pivot */}
        <circle cx={cx} cy={cy} r="8" fill={color} opacity="0.8" />
        <circle cx={cx} cy={cy} r="4" fill="white" opacity="0.95" />

        {/* Score number */}
        <text
          x={cx}
          y={cy + 42}
          textAnchor="middle"
          fill="white"
          fontSize="44"
          fontWeight="800"
          fontFamily="Inter, system-ui, sans-serif"
          filter="url(#scoreGlow)"
        >
          {animatedScore}
        </text>

        {/* Category label */}
        <text
          x={cx}
          y={cy + 62}
          textAnchor="middle"
          fill={color}
          fontSize="11"
          fontWeight="700"
          fontFamily="Inter, system-ui, sans-serif"
          letterSpacing="2"
          opacity="0.9"
        >
          {category.toUpperCase()}
        </text>
      </svg>

      {/* Label below */}
      <div className="text-[10px] text-slate-500 -mt-1 tracking-widest font-medium">
        PLAYABILITY INDEX
      </div>
    </div>
  );
}
