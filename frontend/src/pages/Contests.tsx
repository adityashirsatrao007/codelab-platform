import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Users, Clock, Trophy } from 'lucide-react'
import api from '../lib/api'


interface Contest {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  status: 'upcoming' | 'active' | 'ended'
  participantCount: number
  isWeekly: boolean
}

export default function Contests() {
  const [contests, setContests] = useState<Contest[]>([])
  const [pastContests, setPastContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    loadContests()
  }, [])

  const loadContests = async () => {
    try {
      const [upcomingRes, pastRes] = await Promise.all([
        api.get('/contests'),
        api.get('/contests/past'),
      ])
      setContests(upcomingRes.data)
      setPastContests(pastRes.data.contests)
    } catch (error) {
      console.error('Failed to load contests:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTimeRemaining = (startTime: string) => {
    const now = new Date()
    const start = new Date(startTime)
    const diff = start.getTime() - now.getTime()

    if (diff < 0) return 'Started'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const ContestCard = ({ contest }: { contest: Contest }) => (
    <Link
      to={`/contests/${contest.id}`}
      className="block bg-lc-layer-2 rounded-lg p-5 hover:bg-lc-layer-3 transition-colors border border-lc-border"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-medium text-lc-text-primary">{contest.title}</h3>
          {contest.isWeekly && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-lc-accent/20 text-lc-accent text-xs rounded">
              Weekly Contest
            </span>
          )}
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            contest.status === 'active'
              ? 'bg-green-500/20 text-green-400'
              : contest.status === 'upcoming'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}
        >
          {contest.status === 'active' ? 'Live' : contest.status === 'upcoming' ? 'Upcoming' : 'Ended'}
        </span>
      </div>

      {contest.description && (
        <p className="text-sm text-lc-text-secondary mb-4 line-clamp-2">{contest.description}</p>
      )}

      <div className="flex items-center gap-6 text-sm text-lc-text-tertiary">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(contest.startTime)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          <span>{contest.participantCount} registered</span>
        </div>
        {contest.status === 'upcoming' && (
          <div className="flex items-center gap-1.5 text-yellow-400">
            <Clock className="w-4 h-4" />
            <span>Starts in {getTimeRemaining(contest.startTime)}</span>
          </div>
        )}
      </div>
    </Link>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-lc-accent"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-lc-text-primary flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Contests
          </h1>
          <p className="text-sm text-lc-text-secondary mt-1">
            Compete with others and climb the leaderboard
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-lc-border mb-6">
        <button
          onClick={() => setTab('upcoming')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'upcoming'
              ? 'border-lc-accent text-lc-accent'
              : 'border-transparent text-lc-text-tertiary hover:text-lc-text-secondary'
          }`}
        >
          Upcoming & Active ({contests.length})
        </button>
        <button
          onClick={() => setTab('past')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'past'
              ? 'border-lc-accent text-lc-accent'
              : 'border-transparent text-lc-text-tertiary hover:text-lc-text-secondary'
          }`}
        >
          Past Contests ({pastContests.length})
        </button>
      </div>

      {/* Contest List */}
      <div className="space-y-4">
        {tab === 'upcoming' ? (
          contests.length > 0 ? (
            contests.map((contest) => <ContestCard key={contest.id} contest={contest} />)
          ) : (
            <div className="text-center py-12 text-lc-text-tertiary">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming contests at the moment.</p>
              <p className="text-sm mt-1">Check back soon!</p>
            </div>
          )
        ) : pastContests.length > 0 ? (
          pastContests.map((contest) => <ContestCard key={contest.id} contest={contest} />)
        ) : (
          <div className="text-center py-12 text-lc-text-tertiary">
            <p>No past contests yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
