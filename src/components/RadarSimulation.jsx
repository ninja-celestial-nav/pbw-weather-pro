import { useEffect, useState, useRef } from 'react';

export default function RadarSimulation({ radar, weather }) {
  const [sweepAngle, setSweepAngle] = useState(0);
  const [clouds, setClouds] = useState([]);
  const animRef = useRef();

  // Generate cloud cells
  useEffect(() => {
    if (!weather || weather.radar_echo <= 5) {
      setClouds([]);
      return;
    }
    
    // Meteorological Wind Direction (0=N, 90=E) to SVG Angle (radians)
    // Upwind direction is the direction the wind is blowing FROM.
    // SVG 0rad = 3 o'clock (East), -Math.PI/2 = 12 o'clock (North)
    const windDir = weather?.wind_direction ?? 0;
    const upwindRad = (windDir - 90) * (Math.PI / 180);
    
    const newClouds = [];
    const count = weather.radar_echo > 30 ? 6 : weather.radar_echo > 15 ? 4 : 2;
    
    for (let i = 0; i < count; i++) {
      // Position clouds on the outer ring in the upwind direction
      const dist = 70 + Math.random() * 30;
      const spread = (Math.random() - 0.5) * 1.0; // wider spread
      newClouds.push({
        x: 120 + dist * Math.cos(upwindRad + spread),
        y: 120 + dist * Math.sin(upwindRad + spread),
        r: 10 + Math.random() * 15,
        intensity: 0.15 + (weather.radar_echo / 70) * 0.5,
        id: i,
      });
    }
    setClouds(newClouds);
  }, [weather?.wind_direction, weather?.radar_echo]);

  // Sweep animation
  useEffect(() => {
    let running = true;
    function tick() {
      if (!running) return;
      setSweepAngle(prev => (prev + 1.5) % 360);
      animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, []);

  if (!radar || !weather) return null;

  const cx = 120, cy = 120, r = 100;
  const sweepRad = sweepAngle * Math.PI / 180;
  const sx = cx + r * Math.cos(sweepRad);
  const sy = cy + r * Math.sin(sweepRad);

  const threatColors = { none: '#22c55e', low: '#84cc16', medium: '#eab308', high: '#ef4444' };
  const threatColor = threatColors[radar.threat] || '#666';

  return (
    <div className="flex flex-col items-center">
      <svg width="240" height="240" viewBox="0 0 240 240">
        <defs>
          <radialGradient id="radarBg"><stop offset="0%" stopColor="rgba(16,185,129,0.05)"/><stop offset="100%" stopColor="transparent"/></radialGradient>
          <filter id="cloudBlur"><feGaussianBlur stdDeviation="4"/></filter>
          <linearGradient id="sweepGrad" gradientTransform={`rotate(${sweepAngle}, 0.5, 0.5)`}>
            <stop offset="0%" stopColor="rgba(16,185,129,0)" />
            <stop offset="85%" stopColor="rgba(16,185,129,0.15)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0.4)" />
          </linearGradient>
        </defs>

        {/* Background */}
        <circle cx={cx} cy={cy} r={r} fill="url(#radarBg)" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
        
        {/* Range rings */}
        {[0.33, 0.66, 1].map((f, i) => (
          <circle key={i} cx={cx} cy={cy} r={r * f} fill="none" stroke="rgba(16,185,129,0.08)" strokeWidth="0.5"/>
        ))}
        
        {/* Cross hairs */}
        <line x1={cx-r} y1={cy} x2={cx+r} y2={cy} stroke="rgba(16,185,129,0.06)" strokeWidth="0.5"/>
        <line x1={cx} y1={cy-r} x2={cx} y2={cy+r} stroke="rgba(16,185,129,0.06)" strokeWidth="0.5"/>

        {/* Cloud cells */}
        {clouds.map(c => (
          <circle key={c.id} cx={c.x} cy={c.y} r={c.r} fill={threatColor} opacity={c.intensity} filter="url(#cloudBlur)"/>
        ))}

        {/* Sweep line */}
        <line x1={cx} y1={cy} x2={sx} y2={sy} stroke="rgba(16,185,129,0.6)" strokeWidth="1.5"/>
        
        {/* Sweep cone (trailing phosphor effect) */}
        <path
          d={`M ${cx} ${cy} L ${cx + r * Math.cos(sweepRad)} ${cy + r * Math.sin(sweepRad)} A ${r} ${r} 0 0 0 ${cx + r * Math.cos(sweepRad - 0.5)} ${cy + r * Math.sin(sweepRad - 0.5)} Z`}
          fill="rgba(16,185,129,0.06)"
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="3" fill="#10b981" opacity="0.8"/>
        <circle cx={cx} cy={cy} r="5" fill="none" stroke="#10b981" opacity="0.3" strokeWidth="1"/>

        {/* Range labels */}
        <text x={cx+r*0.33+2} y={cy-3} fill="rgba(16,185,129,0.3)" fontSize="7">7km</text>
        <text x={cx+r*0.66+2} y={cy-3} fill="rgba(16,185,129,0.3)" fontSize="7">13km</text>
        <text x={cx+r-3} y={cy-3} fill="rgba(16,185,129,0.3)" fontSize="7">20km</text>

        {/* Upwind direction indicator */}
        {radar.upwindDirection !== undefined && (() => {
          const ua = (radar.upwindDirection - 90) * Math.PI / 180;
          return (
            <g>
              <text x={cx + (r+12)*Math.cos(ua)} y={cy + (r+12)*Math.sin(ua)} fill="rgba(16,185,129,0.5)" fontSize="8" textAnchor="middle" dominantBaseline="middle">▲</text>
              <text x={cx + (r+22)*Math.cos(ua)} y={cy + (r+22)*Math.sin(ua)} fill="rgba(16,185,129,0.35)" fontSize="7" textAnchor="middle" dominantBaseline="middle">上風</text>
            </g>
          );
        })()}
      </svg>

      {/* Radar info */}
      <div className="text-center mt-2 space-y-1">
        <div className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: threatColor}}/>
          <span className="text-xs font-medium" style={{color: threatColor}}>
            {radar.threat === 'none' ? '無威脅' : radar.threat === 'low' ? '低風險' : radar.threat === 'medium' ? '中風險' : '高風險'}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 max-w-[200px]">{radar.message}</p>
        {radar.arrivalTime && (
          <p className="text-[11px] text-amber-400/70">⏱ 預估到達: {radar.arrivalTime} 分鐘</p>
        )}
      </div>
    </div>
  );
}
