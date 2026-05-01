import React from 'react';
import { Target, TrendingUp, Zap, RotateCw } from 'lucide-react';
import type { SimParams } from './SimulationControls';

interface MissionProfile {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  params: Partial<SimParams>;
}

const PROFILES: MissionProfile[] = [
  {
    id: 'vertical-climb',
    name: 'Vertical Climb',
    description: 'High-altitude vertical ascent for atmospheric testing.',
    icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
    params: {
      initial_position: [0, 0, 0],
      target_position: [0, 0, 2000],
      initial_speed: 5.0,
      launch_pitch: 90.0,
      launch_yaw: 0.0,
      duration: 30.0,
    }
  },
  {
    id: 'intercept-dash',
    name: 'Intercept Dash',
    description: 'Low-altitude high-speed interception profile.',
    icon: <Zap className="w-5 h-5 text-blue-400" />,
    params: {
      initial_position: [0, 0, 10],
      target_position: [500, 200, 50],
      initial_speed: 50.0,
      launch_pitch: 15.0,
      launch_yaw: 45.0,
      duration: 15.0,
    }
  },
  {
    id: 'lollipop-loop',
    name: 'Lollipop Loop',
    description: 'Parabolic arc testing flight stability at peak.',
    icon: <RotateCw className="w-5 h-5 text-orange-400" />,
    params: {
      initial_position: [0, 0, 0],
      target_position: [200, 0, 300],
      initial_speed: 20.0,
      launch_pitch: 60.0,
      launch_yaw: 0.0,
      duration: 25.0,
    }
  }
];

interface Props {
  onSelect: (params: Partial<SimParams>) => void;
}

export function MissionProfiles({ onSelect }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Target className="w-4 h-4 text-blue-500" />
        </div>
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Mission Profiles</h3>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {PROFILES.map((profile) => (
          <button
            key={profile.id}
            onClick={() => onSelect(profile.params)}
            className="p-4 bg-zinc-950 border border-white/5 rounded-xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-zinc-900 group-hover:bg-blue-500/10 transition-colors">
                {profile.icon}
              </div>
              <span className="text-sm font-bold">{profile.name}</span>
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              {profile.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
