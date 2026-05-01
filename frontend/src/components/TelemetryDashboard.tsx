import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Zap, Compass, Wind } from 'lucide-react';

interface Props {
  data: any[];
}

export function TelemetryDashboard({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 bg-zinc-950/50 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-zinc-600 gap-4">
        <Activity className="w-12 h-12 opacity-20" />
        <p className="text-xs font-bold uppercase tracking-[0.2em]">Awaiting Simulation Stream</p>
      </div>
    );
  }

  // Downsample data for rendering performance (e.g. max 200 points)
  const step = Math.max(1, Math.floor(data.length / 200));
  const renderData = data.filter((_, i) => i % step === 0);

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      
      {/* Altitude Profile */}
      <div className="bg-zinc-950 border border-white/5 p-6 rounded-2xl flex flex-col gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Altitude (m)</h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={renderData}>
              <defs>
                <linearGradient id="colorAlt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis stroke="#444" tick={{fontSize: 10}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="alt" stroke="#10b981" fillOpacity={1} fill="url(#colorAlt)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Target Distance */}
      <div className="bg-zinc-950 border border-white/5 p-6 rounded-2xl flex flex-col gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Compass className="w-4 h-4 text-red-500" />
          </div>
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Target Convergence (m)</h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={renderData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis stroke="#444" tick={{fontSize: 10}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              />
              <Line type="monotone" dataKey="dist_to_target" name="Distance" stroke="#ef4444" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Velocity Magnitude */}
      <div className="bg-zinc-950 border border-white/5 p-6 rounded-2xl flex flex-col gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Wind className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Velocity (m/s)</h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={renderData}>
              <defs>
                <linearGradient id="colorVel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis stroke="#444" tick={{fontSize: 10}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              />
              <Area type="monotone" dataKey="v_mag" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVel)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Control Stability */}
      <div className="bg-zinc-950 border border-white/5 p-6 rounded-2xl flex flex-col gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-orange-500" />
          </div>
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Thrust Dynamics (N)</h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={renderData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis stroke="#444" tick={{fontSize: 10}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              />
              <Line type="monotone" dataKey="thrust_mag" name="Thrust" stroke="#f97316" dot={false} strokeWidth={1} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
