import React from 'react';

export interface SimParams {
  mass: number;
  initial_position: [number, number, number];
  target_position: [number, number, number];
  initial_speed: number;
  launch_pitch: number;
  launch_yaw: number;
  kp: number;
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
    const val = parseFloat(value);
    
    if (name.startsWith('pos_')) {
      const parts = name.split('_');
      const axis = parseInt(parts[2]);
      const newPos = [...params.initial_position] as [number, number, number];
      newPos[axis] = val;
      onChange({ ...params, initial_position: newPos });
    } else if (name.startsWith('target_')) {
      const parts = name.split('_');
      const axis = parseInt(parts[2]);
      const newTarget = [...params.target_position] as [number, number, number];
      newTarget[axis] = val;
      onChange({ ...params, target_position: newTarget });
    } else {
      onChange({ ...params, [name]: val });
    }
  };

  return (
    <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-xl border border-zinc-800 shadow-2xl w-full max-w-sm flex flex-col gap-6 overflow-y-auto max-h-[85vh]">
      <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Simulation Config</h2>
      
      {/* Initial State */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Initial State</h3>
        <div className="grid grid-cols-3 gap-2">
          {['X', 'Y', 'Z'].map((axis, i) => (
            <div key={axis} className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-400">Pos {axis}</label>
              <input type="number" name={`pos_init_${i}`} value={params.initial_position[i]} onChange={handleChange} className="bg-zinc-800 p-2 rounded border border-zinc-700 text-white text-xs" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-400">Speed (m/s)</label>
            <input type="number" name="initial_speed" value={params.initial_speed} onChange={handleChange} className="bg-zinc-800 p-2 rounded border border-zinc-700 text-white text-xs" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-400">Pitch (°)</label>
            <input type="number" name="launch_pitch" value={params.launch_pitch} onChange={handleChange} className="bg-zinc-800 p-2 rounded border border-zinc-700 text-white text-xs" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-400">Yaw (°)</label>
            <input type="number" name="launch_yaw" value={params.launch_yaw} onChange={handleChange} className="bg-zinc-800 p-2 rounded border border-zinc-700 text-white text-xs" />
          </div>
        </div>
      </div>

      {/* Target State */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Target Objective</h3>
        <div className="grid grid-cols-3 gap-2">
          {['X', 'Y', 'Z'].map((axis, i) => (
            <div key={axis} className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-400">Target {axis}</label>
              <input type="number" name={`target_pos_${i}`} value={params.target_position[i]} onChange={handleChange} className="bg-zinc-800 p-2 rounded border border-zinc-700 text-white text-xs" />
            </div>
          ))}
        </div>
      </div>

      {/* Physics & Control */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Physics & Guidance</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-400 flex justify-between">Mass (kg) <span className="text-white">{params.mass}</span></label>
            <input type="range" name="mass" min="0.1" max="100" step="0.1" value={params.mass} onChange={handleChange} className="accent-blue-500" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-400 flex justify-between">Time (s) <span className="text-white">{params.duration}</span></label>
            <input type="range" name="duration" min="1" max="100" step="1" value={params.duration} onChange={handleChange} className="accent-blue-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-400 uppercase">Guidance Kp</label>
            <input type="number" name="kp" step="0.5" value={params.kp} onChange={handleChange} className="bg-zinc-800 p-2 rounded border border-zinc-700 text-white text-xs" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-400 uppercase">Damping Kd</label>
            <input type="number" name="kd" step="0.5" value={params.kd} onChange={handleChange} className="bg-zinc-800 p-2 rounded border border-zinc-700 text-white text-xs" />
          </div>
        </div>
      </div>

      <button 
        onClick={onRun} 
        disabled={isLoading}
        className="mt-2 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-zinc-700 disabled:to-zinc-800 text-white py-3 rounded-lg font-black uppercase tracking-tighter transition-all active:scale-95 shadow-lg shadow-blue-900/20"
      >
        {isLoading ? 'Computing Trajectory...' : 'Execute Simulation'}
      </button>
    </div>
  );
}
