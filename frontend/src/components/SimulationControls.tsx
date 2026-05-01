import React from 'react';

export interface SimParams {
  mass: number;
  target_altitude: number;
  kp: number;
  ki: number;
  kd: number;
  duration: number;
  dt: number;
}

interface Props {
  params: SimParams;
  onChange: (params: SimParams) => void;
  onRun: () => void;
  isLoading: boolean;
}

export function SimulationControls({ params, onChange, onRun, isLoading }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({ ...params, [name]: parseFloat(value) });
  };

  return (
    <div className="bg-zinc-800 p-4 rounded-lg shadow-lg w-full max-w-xs flex flex-col gap-4">
      <h2 className="text-xl font-bold text-blue-400">Control Panel</h2>
      
      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-400 flex justify-between">
          <span>Target Altitude (m)</span>
          <span className="text-white">{params.target_altitude}</span>
        </label>
        <input type="range" name="target_altitude" min="0" max="50" step="0.5" value={params.target_altitude} onChange={handleChange} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-400 flex justify-between">
          <span>Mass (kg)</span>
          <span className="text-white">{params.mass}</span>
        </label>
        <input type="range" name="mass" min="0.1" max="10" step="0.1" value={params.mass} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400">Kp</label>
          <input type="number" name="kp" step="0.1" value={params.kp} onChange={handleChange} className="bg-zinc-700 p-1 rounded text-white text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400">Ki</label>
          <input type="number" name="ki" step="0.01" value={params.ki} onChange={handleChange} className="bg-zinc-700 p-1 rounded text-white text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400">Kd</label>
          <input type="number" name="kd" step="0.1" value={params.kd} onChange={handleChange} className="bg-zinc-700 p-1 rounded text-white text-sm" />
        </div>
      </div>

      <button 
        onClick={onRun} 
        disabled={isLoading}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-600 text-white py-2 rounded font-semibold transition-colors"
      >
        {isLoading ? 'Running...' : 'Run Simulation'}
      </button>
    </div>
  );
}
