import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  data: any[];
}

export function TelemetryDashboard({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500">
        Run a simulation to see telemetry data.
      </div>
    );
  }

  // Downsample data for rendering performance (e.g. max 150 points)
  const step = Math.max(1, Math.floor(data.length / 150));
  const renderData = data.filter((_, i) => i % step === 0);

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      
      {/* Altitude & Target */}
      <div className="bg-zinc-800 p-4 rounded-lg h-64">
        <h3 className="text-sm font-semibold text-zinc-300 mb-2">Altitude Tracking (m)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={renderData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="time" stroke="#888" tick={{fontSize: 12}} />
            <YAxis stroke="#888" tick={{fontSize: 12}} />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px' }} />
            <Legend />
            <Line type="monotone" dataKey="z" name="Altitude" stroke="#22c55e" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Control Force & Altitude Error */}
      <div className="bg-zinc-800 p-4 rounded-lg h-64">
        <h3 className="text-sm font-semibold text-zinc-300 mb-2">Control Force (N) vs Error</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={renderData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="time" stroke="#888" tick={{fontSize: 12}} />
            <YAxis yAxisId="left" stroke="#3b82f6" tick={{fontSize: 12}} />
            <YAxis yAxisId="right" orientation="right" stroke="#ef4444" tick={{fontSize: 12}} />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px' }} />
            <Legend />
            <Line yAxisId="left" type="stepAfter" dataKey="f_up" name="Lift Force (N)" stroke="#3b82f6" dot={false} strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="altitude_error" name="Error (m)" stroke="#ef4444" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Energy Consistency */}
      <div className="bg-zinc-800 p-4 rounded-lg h-64">
        <h3 className="text-sm font-semibold text-zinc-300 mb-2">Energy Consistency (Joules)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={renderData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="time" stroke="#888" tick={{fontSize: 12}} />
            <YAxis stroke="#888" tick={{fontSize: 12}} />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px' }} />
            <Legend />
            <Line type="monotone" dataKey="energy_error" name="Energy Error" stroke="#eab308" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
