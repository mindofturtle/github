import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Moon, Dumbbell, Utensils, Pill, Heart,
  Target, Activity, Brain, User, Menu, X, Zap
} from 'lucide-react'
import { useState } from 'react'
import Dashboard from './components/Dashboard'
import SleepTracker from './components/SleepTracker'
import WorkoutTracker from './components/WorkoutTracker'
import NutritionLogger from './components/NutritionLogger'
import SupplementTracker from './components/SupplementTracker'
import HeartData from './components/HeartData'
import GoalsTracker from './components/GoalsTracker'
import RecoveryLogger from './components/RecoveryLogger'
import AIOverview from './components/AIOverview'
import Profile from './components/Profile'

const NAV = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/peak', icon: Zap, label: 'Peak Windows' },
  { path: '/sleep', icon: Moon, label: 'Sleep' },
  { path: '/workout', icon: Dumbbell, label: 'Workout' },
  { path: '/nutrition', icon: Utensils, label: 'Nutrition' },
  { path: '/supplements', icon: Pill, label: 'Supplements' },
  { path: '/heart', icon: Heart, label: 'Heart & HRV' },
  { path: '/recovery', icon: Activity, label: 'Recovery' },
  { path: '/goals', icon: Target, label: 'Goals' },
  { path: '/ai', icon: Brain, label: 'AI Overview' },
  { path: '/profile', icon: User, label: 'Profile' },
]

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-56 bg-surface border-r border-border z-30 flex flex-col
          transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-gradient-cyan">PeakForm</div>
            <div className="text-xs text-muted">AI Performance OS</div>
          </div>
          <button onClick={onClose} className="lg:hidden text-muted hover:text-white">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                isActive ? 'nav-item-active' : 'nav-item-inactive'
              }
              onClick={onClose}
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border text-xs text-muted">
          All data stored locally
        </div>
      </aside>
    </>
  )
}

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 bg-bg/80 backdrop-blur border-b border-border lg:hidden px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-muted hover:text-white">
            <Menu size={20} />
          </button>
          <span className="text-gradient-cyan font-bold">PeakForm</span>
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-[1400px] w-full mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/peak" element={<Dashboard peakOnly />} />
            <Route path="/sleep" element={<SleepTracker />} />
            <Route path="/workout" element={<WorkoutTracker />} />
            <Route path="/nutrition" element={<NutritionLogger />} />
            <Route path="/supplements" element={<SupplementTracker />} />
            <Route path="/heart" element={<HeartData />} />
            <Route path="/recovery" element={<RecoveryLogger />} />
            <Route path="/goals" element={<GoalsTracker />} />
            <Route path="/ai" element={<AIOverview />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
