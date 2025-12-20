import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'

interface Submission {
  id: string
  status: string
  language: string
  runtime?: number
  testsPassed: number
  testsTotal: number
  createdAt: string
  problem: {
    id: string
    title: string
    slug: string
    difficulty: string
  }
}

export default function Submissions() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchSubmissions()
  }, [user, navigate])

  const fetchSubmissions = async () => {
    try {
      const response = await api.get('/submissions/my')
      setSubmissions(response.data)
    } catch (error) {
      console.error('Failed to fetch submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
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
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-[20px] font-semibold text-lc-text-primary mb-5">My Submissions</h1>
        <div className="bg-lc-layer-2 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-lc-border">
                <th className="px-5 py-3 text-left text-[12px] font-medium text-lc-text-tertiary">Time Submitted</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-lc-text-tertiary">Question</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-lc-text-tertiary">Status</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-lc-text-tertiary">Runtime</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-lc-text-tertiary">Language</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <p className="text-[14px] text-lc-text-tertiary mb-3">No submissions yet</p>
                    <Link to="/problems" className="text-[13px] text-lc-accent hover:underline">Start solving problems</Link>
                  </td>
                </tr>
              ) : (
                submissions.map((submission) => (
                  <tr key={submission.id} className="border-b border-lc-border last:border-0 hover:bg-lc-fill-1 transition-colors">
                    <td className="px-5 py-3"><span className="text-[13px] text-lc-text-tertiary">{formatDate(submission.createdAt)}</span></td>
                    <td className="px-5 py-3"><Link to={`/problems/${submission.problem.slug}`} className="text-[13px] text-lc-text-primary hover:text-lc-accent">{submission.problem.title}</Link></td>
                    <td className="px-5 py-3">
                      <span className={`text-[13px] font-medium ${submission.status === 'accepted' ? 'text-lc-easy' : submission.status === 'wrong_answer' ? 'text-lc-hard' : 'text-lc-medium'}`}>
                        {submission.status === 'accepted' ? 'Accepted' : submission.status === 'wrong_answer' ? 'Wrong Answer' : submission.status === 'time_limit' ? 'Time Limit Exceeded' : submission.status.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-lc-text-tertiary ml-2">{submission.testsPassed}/{submission.testsTotal}</span>
                    </td>
                    <td className="px-5 py-3"><span className="text-[13px] text-lc-text-secondary">{submission.runtime ? `${submission.runtime} ms` : 'N/A'}</span></td>
                    <td className="px-5 py-3"><span className="text-[13px] text-lc-text-tertiary capitalize">{submission.language}</span></td>
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
