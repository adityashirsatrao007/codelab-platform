import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'

interface LeaderboardEntry {
  rank: number
  username: string
  fullName?: string
  college?: string
  solvedCount: number
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/users/stats/leaderboard')
      setLeaderboard(response.data)
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-50px)] flex items-center justify-center bg-lc-layer-1">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-lc-fill-3 border-t-lc-accent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-50px)] bg-lc-layer-1">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-[20px] font-semibold text-lc-text-primary mb-5">Leaderboard</h1>
        {leaderboard.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-8 pt-4">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-lc-fill-3 rounded-lg flex items-center justify-center text-xl font-semibold text-lc-text-primary mb-2">{leaderboard[1].username[0].toUpperCase()}</div>
              <Link to={`/profile/${leaderboard[1].username}`} className="text-[13px] font-medium text-lc-text-primary hover:text-lc-accent">{leaderboard[1].username}</Link>
              <div className="text-[11px] text-lc-text-tertiary">{leaderboard[1].solvedCount} solved</div>
              <div className="w-20 h-16 bg-[#c0c0c0]/20 rounded-t-lg mt-2 flex items-center justify-center"><span className="text-[24px] font-bold text-[#c0c0c0]">2</span></div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-lc-accent/20 rounded-lg flex items-center justify-center text-2xl font-semibold text-lc-accent mb-2">{leaderboard[0].username[0].toUpperCase()}</div>
              <Link to={`/profile/${leaderboard[0].username}`} className="text-[14px] font-medium text-lc-text-primary hover:text-lc-accent">{leaderboard[0].username}</Link>
              <div className="text-[12px] text-lc-accent">{leaderboard[0].solvedCount} solved</div>
              <div className="w-24 h-24 bg-lc-accent/20 rounded-t-lg mt-2 flex items-center justify-center"><span className="text-[32px] font-bold text-lc-accent">1</span></div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-lc-fill-3 rounded-lg flex items-center justify-center text-xl font-semibold text-lc-text-primary mb-2">{leaderboard[2].username[0].toUpperCase()}</div>
              <Link to={`/profile/${leaderboard[2].username}`} className="text-[13px] font-medium text-lc-text-primary hover:text-lc-accent">{leaderboard[2].username}</Link>
              <div className="text-[11px] text-lc-text-tertiary">{leaderboard[2].solvedCount} solved</div>
              <div className="w-20 h-12 bg-[#cd7f32]/20 rounded-t-lg mt-2 flex items-center justify-center"><span className="text-[20px] font-bold text-[#cd7f32]">3</span></div>
            </div>
          </div>
        )}
        <div className="bg-lc-layer-2 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-lc-border">
                <th className="px-5 py-3 text-left text-[12px] font-medium text-lc-text-tertiary w-16">#</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-lc-text-tertiary">User</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-lc-text-tertiary">College</th>
                <th className="px-5 py-3 text-right text-[12px] font-medium text-lc-text-tertiary">Solved</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-[13px] text-lc-text-tertiary">No users yet</td></tr>
              ) : (
                leaderboard.map((entry) => (
                  <tr key={entry.username} className="border-b border-lc-border last:border-0 hover:bg-lc-fill-1 transition-colors">
                    <td className="px-5 py-3"><span className={`text-[13px] font-mono ${entry.rank === 1 ? 'text-lc-accent font-semibold' : entry.rank === 2 ? 'text-[#c0c0c0]' : entry.rank === 3 ? 'text-[#cd7f32]' : 'text-lc-text-tertiary'}`}>{entry.rank}</span></td>
                    <td className="px-5 py-3">
                      <Link to={`/profile/${entry.username}`} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 bg-lc-fill-3 rounded flex items-center justify-center text-[13px] font-medium text-lc-text-primary">{entry.username[0].toUpperCase()}</div>
                        <div><div className="text-[13px] font-medium text-lc-text-primary group-hover:text-lc-accent">{entry.fullName || entry.username}</div><div className="text-[11px] text-lc-text-tertiary">@{entry.username}</div></div>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-lc-text-tertiary">{entry.college || '-'}</td>
                    <td className="px-5 py-3 text-right"><span className="text-[13px] font-medium text-lc-easy">{entry.solvedCount}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
