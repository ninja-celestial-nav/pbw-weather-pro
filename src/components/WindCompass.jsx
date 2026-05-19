import { useEffect, useState } from 'react';

export default function WindCompass({ windDirection = 0, windSpeed = 0, windGust = 0, courtOrientation = 0 }) {
  const [animDir, setAnimDir] = useState(windDirection);

  useEffect(() => {
    const dur = 600, start = animDir;
    let diff = windDirection - start;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const t0 = performance.now();
    function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      setAnimDir(((start + diff * (1 - Math.pow(1 - p, 3))) % 360 + 360) % 360);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- animDir is intentionally read as snapshot for animation start
  }, [windDirection]);

  const cx = 120, cy = 120, r = 85;
  const col = windSpeed <= 8 ? '#22c55e' : windSpeed <= 12 ? '#84cc16' : windSpeed <= 20 ? '#eab308' : windSpeed <= 25 ? '#f97316' : '#ef4444';
  const na = (animDir - 90) * Math.PI / 180;
  const nx = cx + (r - 15) * Math.cos(na), ny = cy + (r - 15) * Math.sin(na);
  const tx = cx - 20 * Math.cos(na), ty = cy - 20 * Math.sin(na);
  const ca = (courtOrientation - 90) * Math.PI / 180, cl = r - 25;
  const CARD = ['N','NE','E','SE','S','SW','W','NW'];
  const cardDir = CARD[Math.round(animDir / 45) % 8];

  return (
    <div className="flex flex-col items-center">
      <svg width="240" height="240" viewBox="0 0 240 240">
        <defs>
          <filter id="cg"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <radialGradient id="gr" cx="50%" cy="50%"><stop offset="70%" stopColor="transparent"/><stop offset="100%" stopColor={col} stopOpacity="0.15"/></radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r+10} fill="url(#gr)" className="animate-pulse" style={{animationDuration:'3s'}}/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2"/>
        <circle cx={cx} cy={cy} r={r*0.6} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
        {CARD.map((l, i) => {
          const a = (i * 45 - 90) * Math.PI / 180, pr = i % 2 === 0;
          return (<g key={l}>
            <line x1={cx+(r-8)*Math.cos(a)} y1={cy+(r-8)*Math.sin(a)} x2={cx+r*Math.cos(a)} y2={cy+r*Math.sin(a)} stroke={pr?'rgba(255,255,255,0.3)':'rgba(255,255,255,0.12)'} strokeWidth={pr?2:1}/>
            <text x={cx+(r+18)*Math.cos(a)} y={cy+(r+18)*Math.sin(a)} textAnchor="middle" dominantBaseline="middle" fill={pr?'rgba(255,255,255,0.5)':'rgba(255,255,255,0.25)'} fontSize={pr?'12':'9'} fontWeight={pr?'600':'400'} fontFamily="Inter, sans-serif">{l}</text>
          </g>);
        })}
        <line x1={cx+cl*Math.cos(ca)} y1={cy+cl*Math.sin(ca)} x2={cx-cl*Math.cos(ca)} y2={cy-cl*Math.sin(ca)} stroke="rgba(99,102,241,0.3)" strokeWidth="2" strokeDasharray="6 4"/>
        <text x={cx+(cl+5)*Math.cos(ca)} y={cy+(cl+5)*Math.sin(ca)-6} fill="rgba(99,102,241,0.5)" fontSize="8" textAnchor="middle">COURT</text>
        <line x1={tx} y1={ty} x2={nx} y2={ny} stroke={col} strokeWidth="3" strokeLinecap="round" filter="url(#cg)"/>
        <circle cx={nx} cy={ny} r="5" fill={col} filter="url(#cg)"/>
        <circle cx={cx} cy={cy} r="4" fill="rgba(255,255,255,0.4)"/>
        <circle cx={cx} cy={cy} r="2" fill="white"/>
        <text x={cx} y={cy+25} textAnchor="middle" fill="white" fontSize="18" fontWeight="700" fontFamily="Inter, sans-serif">{windSpeed.toFixed(1)}</text>
        <text x={cx} y={cy+38} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">km/h</text>
      </svg>
      <div className="flex items-center gap-4 mt-1 text-xs">
        <span className="text-slate-400">方向 <span className="text-white font-medium">{Math.round(animDir)}° {cardDir}</span></span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-400">陣風 <span className="font-medium" style={{color: windSpeed<=25?'#f97316':'#ef4444'}}>{windGust.toFixed(1)}</span> km/h</span>
      </div>
    </div>
  );
}
