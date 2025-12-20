import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Play, Send, ChevronLeft, ChevronRight, Settings, RotateCcw, AlarmClock } from 'lucide-react'
import { useAuthStore } from '../lib/store'
import { useSettingsStore } from '../lib/settingsStore'
import WorkspaceSettingsModal from './WorkspaceSettingsModal'

interface WorkspaceHeaderProps {
  problem: {
    id: string
    title: string
    slug: string
    frontendId?: number
  }
  running: boolean
  submitting: boolean
  onRun: () => void
  onSubmit: () => void
}

export default function WorkspaceHeader({ running, submitting, onRun, onSubmit }: WorkspaceHeaderProps) {
  const { user } = useAuthStore()
  const settings = useSettingsStore()
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    // Start timer on mount
    setIsTimerRunning(true)
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(t => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning)
  const resetTimer = () => {
      setIsTimerRunning(false)
      setTimer(0)
  }

  return (
    <>
      <div className="h-[50px] bg-lc-layer-2 border-b border-lc-border flex items-center justify-between px-4 select-none">
        {/* Left: Logo & Problem Nav */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center" title="CodeLab Home">
              <svg className="h-6 w-6 text-lc-accent" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
              </svg>
          </Link>
          
          <div className="flex items-center gap-1 text-lc-text-secondary">
               <div className="flex items-center gap-1 hover:text-lc-text-primary cursor-pointer transition-colors">
                   <span>Problem List</span>
                   <ChevronRight className="w-4 h-4" />
               </div>
          </div>
  
          <div className="flex items-center gap-1">
               <button className="p-1 rounded hover:bg-lc-fill-3 text-lc-text-tertiary hover:text-lc-text-primary transition-colors disabled:opacity-30">
                   <ChevronLeft className="w-5 h-5" />
               </button>
               <button className="p-1 rounded hover:bg-lc-fill-3 text-lc-text-tertiary hover:text-lc-text-primary transition-colors disabled:opacity-30">
                   <ChevronRight className="w-5 h-5" />
               </button>
          </div>
        </div>
  
        {/* Center: Actions */}
        <div className="flex items-center gap-2">
           {settings.runButtonPosition === 'toolbar' && (
             <>
               <button 
                  onClick={onRun}
                  disabled={running || submitting}
                  className="flex items-center gap-2 px-4 py-1.5 bg-lc-fill-3 hover:bg-lc-fill-4 disabled:opacity-50 text-lc-text-secondary hover:text-lc-text-primary rounded transition-colors text-sm font-medium"
               >
                   <Play className="w-4 h-4 fill-current" />
                   Run
               </button>
               <button 
                  onClick={onSubmit}
                  disabled={running || submitting}
                  className="flex items-center gap-2 px-4 py-1.5 bg-lc-green/10 hover:bg-lc-green/20 text-lc-green disabled:opacity-50 rounded transition-colors text-sm font-medium"
               >
                  {submitting ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                      <Send className="w-4 h-4" />
                  )}
                   Submit
               </button>
             </>
           )}
        </div>
  
        {/* Right: Timer & Tools */}
        <div className="flex items-center gap-4">
            {/* Timer Widget */}
            <div className="flex items-center bg-lc-fill-2 rounded px-2 py-1 gap-2 group hover:bg-lc-fill-3 transition-colors">
                <button onClick={toggleTimer} className="text-lc-text-tertiary group-hover:text-lc-text-primary">
                    <AlarmClock className="w-4 h-4" />
                </button>
                <span className="text-sm font-mono text-lc-text-secondary w-[60px] text-center">
                    {formatTime(timer)}
                </span>
                <button onClick={resetTimer} className="text-lc-text-tertiary hover:text-lc-text-primary opacity-0 group-hover:opacity-100 transition-opacity" title="Reset">
                    <RotateCcw className="w-3.5 h-3.5" />
                </button>
            </div>
  
            <div className="flex items-center gap-3 text-lc-text-tertiary">
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="hover:text-lc-text-primary transition-colors"
                >
                    <Settings className="w-4.5 h-4.5" />
                </button>
                 {user && user.username && (
                    <Link to={`/profile/${user.username}`} className="w-7 h-7 rounded-full bg-gradient-to-br from-lc-accent to-orange-600 flex items-center justify-center text-xs font-bold text-white">
                        {user.username[0].toUpperCase()}
                    </Link>
                )}
            </div>
        </div>
      </div>
  
      <WorkspaceSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  )
}
