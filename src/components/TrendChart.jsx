import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, ComposedChart, Line } from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-white font-semibold mb-2">{label}</p>
      <div className="space-y-1.5">
        <div className="flex justify-between gap-6">
          <span className="text-slate-400">PPI</span>
          <span className="font-medium" style={{color: d.ppiColor}}>{d.ppi} ({d.ppiCategory})</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-400">風速</span>
          <span className="text-cyan-300">{d.wind_speed} km/h</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-400">陣風</span>
          <span className="text-cyan-400">{d.wind_gust} km/h</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-400">降雨機率</span>
          <span className="text-blue-300">{d.pop}%</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-400">溫度</span>
          <span className="text-orange-300">{d.temp}°C</span>
        </div>
      </div>
    </div>
  );
}

export default function TrendChart({ data }) {
  if (!data?.length) return null;

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="ppiGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
          <XAxis
            dataKey="time"
            stroke="rgba(255,255,255,0.2)"
            fontSize={11}
            tickLine={false}
            axisLine={{stroke: 'rgba(255,255,255,0.06)'}}
          />
          <YAxis
            yAxisId="ppi"
            domain={[0, 100]}
            stroke="rgba(255,255,255,0.2)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            label={{ value: 'PPI', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.3)', fontSize: 10, offset: 15 }}
          />
          <YAxis
            yAxisId="wind"
            orientation="right"
            domain={[0, 'auto']}
            stroke="rgba(255,255,255,0.2)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            label={{ value: 'km/h', angle: 90, position: 'insideRight', fill: 'rgba(255,255,255,0.3)', fontSize: 10, offset: 15 }}
          />
          <Tooltip content={<CustomTooltip/>}/>
          
          {/* Rain probability bars */}
          <Bar yAxisId="ppi" dataKey="pop" fill="rgba(59,130,246,0.2)" radius={[2,2,0,0]} barSize={20}/>
          
          {/* PPI area */}
          <Area yAxisId="ppi" type="monotone" dataKey="ppi" stroke="#818cf8" strokeWidth={2.5} fill="url(#ppiGrad)" dot={{fill:'#818cf8', r:3, strokeWidth:0}} activeDot={{r:5, stroke:'#818cf8', strokeWidth:2, fill:'white'}}/>
          
          {/* Wind speed line */}
          <Line yAxisId="wind" type="monotone" dataKey="wind_speed" stroke="#22d3ee" strokeWidth={2} dot={{fill:'#22d3ee', r:2.5, strokeWidth:0}} strokeDasharray="5 3"/>
          
          {/* Wind gust line */}
          <Line yAxisId="wind" type="monotone" dataKey="wind_gust" stroke="rgba(34,211,238,0.3)" strokeWidth={1} dot={false} strokeDasharray="2 4"/>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
