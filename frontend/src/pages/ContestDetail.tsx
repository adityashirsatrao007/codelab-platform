import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, Users, Clock, Trophy, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'


interface Problem {
  id: string
  title: string
  slug: string
  difficulty: string
}

interface Contest {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  status: 'upcoming' | 'active' | 'ended'
  participantCount: number
  problems: Problem[]
}

interface LeaderboardEntry {
  rank: number
  user: {
    id: string
    username: string
    profile?: { fullName: string }
  }
  score: number
  problemsSolved: number
}

export default function ContestDetail() {
  const { contestId } = useParams()
  const [contest, setContest] = useState<Contest | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [registered, setRegistered] = useState(false)
  const [tab, setTab] = useState<'problems' | 'leaderboard'>('problems')

  useEffect(() => {
    loadContest()
  }, [contestId])

  const loadContest = async () => {
    try {
      const [contestRes, leaderboardRes] = await Promise.all([
        api.get(`/contests/${contestId}`),
        api.get(`/contests/${contestId}/leaderboard`),
      ])
      setContest(contestRes.data)
      setLeaderboard(leaderboardRes.data.leaderboard)
    } catch (error) {
      console.error('Failed to load contest:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    try {
      await api.post(`/contests/${contestId}/register`)
      setRegistered(true)
      toast.success('Registered successfully!')
      loadContest()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to register')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-lc-easy'
      case 'medium':
        return 'text-lc-medium'
      case 'hard':
        return 'text-lc-hard'
      default:
        return 'text-lc-text-secondary'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-lc-accent"></div>
      </div>
    )
  }

  if (!contest) {
    return (
      <div className="text-center py-12">
        <p className="text-lc-text-tertiary">Contest not found</p>
        <Link to="/contests" className="text-lc-accent hover:underline mt-2 inline-block">
          Back to Contests
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <Link to="/contests" className="inline-flex items-center gap-1 text-sm text-lc-text-tertiary hover:text-lc-accent mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to Contests
      </Link>

      <div className="bg-lc-layer-2 rounded-lg p-6 mb-6 border border-lc-border">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-lc-text-primary">{contest.title}</h1>
            <span
              className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                contest.status === 'active'
                  ? 'bg-green-500/20 text-green-400'
                  : contest.status === 'upcoming'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              {contest.status === 'active' ? 'Live Now' : contest.status === 'upcoming' ? 'Upcoming' : 'Ended'}
            </span>
          </div>
          {contest.status !== 'ended' && !registered && (
            <button
              onClick={handleRegister}
              className="bg-lc-green hover:bg-lc-green/90 text-white px-6 py-2 rounded text-sm font-medium transition-colors"
            >
              Register
            </button>
          )}
        </div>

        {contest.description && (
          <p className="text-lc-text-secondary mb-4">{contest.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-6 text-sm text-lc-text-tertiary">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>Starts: {formatDate(contest.startTime)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>Ends: {formatDate(contest.endTime)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>{contest.participantCount} participants</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-lc-border mb-6">
        <button
          onClick={() => setTab('problems')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'problems'
              ? 'border-lc-accent text-lc-accent'
              : 'border-transparent text-lc-text-tertiary hover:text-lc-text-secondary'
          }`}
        >
          Problems ({contest.problems.length})
        </button>
        <button
          onClick={() => setTab('leaderboard')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'leaderboard'
              ? 'border-lc-accent text-lc-accent'
              : 'border-transparent text-lc-text-tertiary hover:text-lc-text-secondary'
          }`}
        >
          Leaderboard
        </button>
      </div>

      {/* Content */}
      {tab === 'problems' ? (
        contest.status === 'upcoming' ? (
          <div className="text-center py-12 text-lc-text-tertiary">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Problems will be revealed when the contest starts.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {contest.problems.map((problem, index) => (
              <Link
                key={problem.id}
                to={`/problems/${problem.slug}?contest=${contestId}`}
                className="flex items-center justify-between bg-lc-layer-2 rounded-lg px-4 py-3 hover:bg-lc-layer-3 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-lc-text-tertiary w-6">{index + 1}</span>
                  <span className="text-lc-text-primary">{problem.title}</span>
                </div>
                <span className={getDifficultyColor(problem.difficulty)}>
                  {problem.difficulty}
                </span>
              </Link>
            ))}
          </div>
        )
      ) : (
        <div className="bg-lc-layer-2 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-lc-border">
                <th className="px-4 py-3 text-left text-sm font-medium text-lc-text-tertiary w-16">Rank</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-lc-text-tertiary">User</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-lc-text-tertiary">Solved</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-lc-text-tertiary">Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr key={entry.user.id} className="border-b border-lc-border/50 last:border-0">
                  <td className="px-4 py-3">
                    {entry.rank <= 3 ? (
                      <Trophy className={`w-5 h-5 ${
                        entry.rank === 1 ? 'text-yellow-400' :
                        entry.rank === 2 ? 'text-gray-400' :
                        'text-amber-600'
                      }`} />
                    ) : (
                      <span className="text-lc-text-tertiary">{entry.rank}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/profile/${entry.user.username}`} className="text-lc-text-primary hover:text-lc-accent">
                      {entry.user.username}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center text-lc-text-secondary">{entry.problemsSolved}</td>
                  <td className="px-4 py-3 text-right text-lc-text-primary font-medium">{entry.score}</td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-lc-text-tertiary">
                    No participants yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
