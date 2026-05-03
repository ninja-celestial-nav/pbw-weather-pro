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
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, [score]);

  // SVG gauge parameters
  const cx = 140, cy = 130;
  const radius = 100;
  const startAngle = -210;
  const endAngle = 30;
  const totalArc = endAngle - startAngle; // 240 degrees
  const scoreAngle = startAngle + (animatedScore / 100) * totalArc;

  const degToRad = (d) => (d * Math.PI) / 180;

  // Create arc path
  function arcPath(r, start, end) {
    const s = degToRad(start);
    const e = degToRad(end);
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  // Needle tip position
  const needleAngle = degToRad(scoreAngle);
  const needleX = cx + (radius - 8) * Math.cos(needleAngle);
  const needleY = cy + (radius - 8) * Math.sin(needleAngle);

  // Tick marks
  const ticks = [0, 20, 40, 60, 80, 100];
  const tickColors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981'];

  // Glow effect intensity
  const glowIntensity = animatedScore > 60 ? 0.6 : 0.3;

  return (
    <div className="flex flex-col items-center">
      <svg width="280" height="175" viewBox="0 0 280 175">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="25%" stopColor="#f97316" />
            <stop offset="45%" stopColor="#eab308" />
            <stop offset="65%" stopColor="#84cc16" />
            <stop offset="85%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="needleGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background arc */}
        <path
          d={arcPath(radius, startAngle, endAngle)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="20"
          strokeLinecap="round"
        />

        {/* Colored arc (filled portion) */}
        <path
          d={arcPath(radius, startAngle, scoreAngle)}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="20"
          strokeLinecap="round"
          filter="url(#glow)"
          style={{ opacity: 0.9 }}
        />

        {/* Tick marks */}
        {ticks.map((tick, i) => {
          const angle = degToRad(startAngle + (tick / 100) * totalArc);
          const outerR = radius + 18;
          const innerR = radius + 12;
          return (
            <g key={tick}>
              <line
                x1={cx + innerR * Math.cos(angle)}
                y1={cy + innerR * Math.sin(angle)}
                x2={cx + outerR * Math.cos(angle)}
                y2={cy + outerR * Math.sin(angle)}
                stroke={tickColors[i]}
                strokeWidth="2"
                opacity="0.6"
              />
              <text
                x={cx + (outerR + 10) * Math.cos(angle)}
                y={cy + (outerR + 10) * Math.sin(angle)}
                fill="rgba(255,255,255,0.35)"
                fontSize="9"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#needleGlow)"
        />
        <circle cx={cx} cy={cy} r="6" fill={color} opacity={glowIntensity + 0.3} />
        <circle cx={cx} cy={cy} r="3" fill="white" opacity="0.9" />

        {/* Score text */}
        <text
          x={cx}
          y={cy + 35}
          textAnchor="middle"
          fill="white"
          fontSize="36"
          fontWeight="700"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {animatedScore}
        </text>
        <text
          x={cx}
          y={cy + 52}
          textAnchor="middle"
          fill={color}
          fontSize="12"
          fontWeight="600"
          fontFamily="Inter, system-ui, sans-serif"
          letterSpacing="1.5"
        >
          {category.toUpperCase()}
        </text>
      </svg>

      {/* Score breakdown mini-bar */}
      <div className="text-[10px] text-slate-500 mt-1 tracking-wide">
        PLAYABILITY INDEX
      </div>
    </div>
  );
}
