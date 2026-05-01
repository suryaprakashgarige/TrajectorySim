import { useState, useEffect, useRef } from 'react'
import { SimulationControls } from './components/SimulationControls'
import type { SimParams } from './components/SimulationControls'
import { TrajectoryScene } from './components/TrajectoryScene'
import { TelemetryDashboard } from './components/TelemetryDashboard'
import { MissionProfiles } from './components/MissionProfiles'
import { Rocket, Loader2, History, Play } from 'lucide-react'

function App() {
  const [params, setParams] = useState<SimParams>({
    mass: 1.0,
    initial_position: [0, 0, 0],
    target_position: [100, 50, 100],
    initial_speed: 10.0,
    launch_pitch: 45.0,
    launch_yaw: 0.0,
    kp: 10.0,
    kd: 5.0,
    duration: 20.0,
    dt: 0.1,
  })
  const [data, setData] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [replays, setReplays] = useState<any[]>([])
  const [view, setView] = useState<'live' | 'replay'>('live')

  const ws = useRef<WebSocket | null>(null)

  const fetchReplays = async () => {
    try {
      const response = await fetch('http://localhost:8000/replays')
      const result = await response.json()
      setReplays(result)
    } catch (err) {
      console.error('Failed to fetch replays')
    }
  }

  const loadReplay = async (id: string) => {
    setIsLoading(true)
    setView('replay')
    try {
      const response = await fetch(`http://localhost:8000/replays/${id}`)
      const result = await response.json()
      setData(result.trajectory)
      setMetrics(result.metrics)
    } catch (err: any) {
      console.error('Failed to load replay')
    } finally {
      setIsLoading(false)
    }
  }

  const runSimulation = async () => {
    setIsLoading(true)
    setData([])
    setMetrics(null)
    setView('live')
    
    try {
      const response = await fetch('http://localhost:8000/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params }),
      })
      
      const { job_id } = await response.json()
      
      // Connect to WebSocket for real-time telemetry
      if (ws.current) ws.current.close()
      
      ws.current = new WebSocket(`ws://localhost:8000/ws/${job_id}`)
      
      ws.current.onmessage = (event) => {
        const point = JSON.parse(event.data)
        setData(prev => [...prev, point])
      }
      
      ws.current.onclose = async () => {
        // Fetch final metrics and full trajectory once finished
        const resResponse = await fetch(`http://localhost:8000/result/${job_id}`)
        const result = await resResponse.json()
        if (result.metrics) {
          setMetrics(result.metrics)
          setData(result.trajectory)
        }
        setIsLoading(false)
        fetchReplays()
      }

    } catch (err: any) {
      console.error(err.message)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReplays()
    return () => { if (ws.current) ws.current.close() }
  }, [])

  const handleProfileSelect = (profileParams: Partial<SimParams>) => {
    setParams(prev => ({ ...prev, ...profileParams }))
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 flex flex-col font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="px-8 py-5 border-b border-white/5 bg-black/40 backdrop-blur-xl flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <Rocket className="text-white w-6 h-6" />
          </div>
          <div>
              Missile<span className="text-blue-500">Sim</span> 3D
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Live Cluster</span>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col p-6 lg:p-8 gap-8 max-w-[1800px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel */}
          <div className="lg:col-span-3 flex flex-col gap-6 h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
            <SimulationControls params={params} onChange={setParams} onRun={runSimulation} isLoading={isLoading} />
            <div className="h-px bg-white/5" />
            <MissionProfiles onSelect={handleProfileSelect} />
            <div className="h-px bg-white/5" />
            
            {/* Replay System */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <History className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Mission Logs</h3>
              </div>
              <div className="flex flex-col gap-2">
                {replays.map((replay) => (
                  <button
                    key={replay.job_id}
                    onClick={() => loadReplay(replay.job_id)}
                    className="flex items-center justify-between p-3 bg-zinc-900/50 border border-white/5 rounded-lg hover:bg-purple-500/5 hover:border-purple-500/30 transition-all text-left"
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-300">JOB-{replay.job_id.substring(0,6)}</span>
                      <span className="text-[9px] text-zinc-500">{replay.status}</span>
                    </div>
                    <Play className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visualization */}
          <div className="lg:col-span-9 flex flex-col gap-6 relative">
            <div className="flex-grow border border-white/5 rounded-2xl overflow-hidden relative shadow-2xl bg-zinc-950 min-h-[600px]">
              <TrajectoryScene data={data} />
              
              {isLoading && view === 'live' && (
                <div className="absolute bottom-10 right-10 z-10 bg-black/80 backdrop-blur-md border border-white/10 px-6 py-4 rounded-2xl flex items-center gap-4">
                   <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                   <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Receiving Telemetry</p>
                     <p className="text-xs font-black">{data.length} Packets</p>
                   </div>
                </div>
              )}
            </div>
            
            <TelemetryDashboard data={data} />
            
            {metrics && (
              <div className="grid grid-cols-4 gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
                 <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">TOF</p>
                    <p className="text-xl font-black">{metrics.time_of_flight.toFixed(2)}s</p>
                 </div>
                 <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Miss Distance</p>
                    <p className="text-xl font-black text-emerald-400">{metrics.miss_distance.toFixed(2)}m</p>
                 </div>
                 <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Max Altitude</p>
                    <p className="text-xl font-black">{metrics.max_altitude.toFixed(1)}m</p>
                 </div>
                 <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Terminal Velocity</p>
                    <p className="text-xl font-black">{metrics.final_velocity_mag.toFixed(1)}m/s</p>
                 </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
