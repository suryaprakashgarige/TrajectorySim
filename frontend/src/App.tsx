import { useState } from 'react'
import { SimulationControls, SimParams } from './components/SimulationControls'
import { TrajectoryScene } from './components/TrajectoryScene'
import { TelemetryDashboard } from './components/TelemetryDashboard'

function App() {
  const [params, setParams] = useState<SimParams>({
    mass: 1.0,
    target_altitude: 10.0,
    kp: 5.0,
    ki: 0.5,
    kd: 10.0,
    duration: 15.0,
    dt: 0.02,
  })
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runSimulation = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('http://localhost:8000/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, drag_coeff: 0.47, reference_area: 0.01 }),
      })
      
      if (!response.ok) throw new Error('Simulation failed')
      
      const result = await response.json()
      setData(result.trajectory)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-slate-100 flex flex-col font-sans">
      <header className="px-6 py-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Gravity-Comp Simulator
          </h1>
          <p className="text-sm text-zinc-500">RK4 Integration & PID Control Analysis</p>
        </div>
      </header>

      <main className="flex-grow flex flex-col p-6 gap-6">
        <div className="flex flex-col lg:flex-row gap-6 flex-grow min-h-[500px]">
          {/* Left Panel: Controls */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <SimulationControls 
              params={params} 
              onChange={setParams} 
              onRun={runSimulation} 
              isLoading={isLoading} 
            />
            {error && <div className="mt-4 text-red-400 text-sm">{error}</div>}
          </div>

          {/* Right Panel: 3D Scene */}
          <div className="flex-grow border border-zinc-800 rounded-lg overflow-hidden relative shadow-2xl shadow-blue-900/10">
            <div className="absolute top-4 left-4 z-10 bg-black/50 px-3 py-1 rounded-full text-xs text-white backdrop-blur-md">
              3D Spatial View
            </div>
            <TrajectoryScene data={data} />
          </div>
        </div>

        {/* Bottom Panel: Telemetry */}
        <div className="w-full">
          <TelemetryDashboard data={data} />
        </div>
      </main>
    </div>
  )
}

export default App
