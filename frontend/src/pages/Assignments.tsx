import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import api from '../lib/api'

interface Assignment {
  id: string
  title: string
  description: string
  deadline: string
  maxScore: number
  problems: { problem: { id: string; title: string; difficulty: string } }[]
  createdBy: { username: string; profile: { fullName: string } }
  status: 'pending' | 'submitted' | 'submitted_late' | 'overdue'
  submission?: {
    score: number
    isLate: boolean
    submittedAt: string
  }
  isPastDeadline: boolean
}

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAssignments()
  }, [])

  const loadAssignments = async () => {
    try {
      const res = await api.get('/assignments/student')
      setAssignments(res.data)
    } catch (error) {
      console.error('Failed to load assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'submitted_late':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />
      case 'overdue':
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <Clock className="w-5 h-5 text-lc-text-tertiary" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Submitted'
      case 'submitted_late':
        return 'Submitted Late'
      case 'overdue':
        return 'Overdue'
      default:
        return 'Pending'
    }
  }

  const getTimeRemaining = (deadline: string) => {
    const now = new Date()
    const due = new Date(deadline)
    const diff = due.getTime() - now.getTime()

    if (diff < 0) return 'Past due'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}d ${hours}h remaining`
    if (hours > 0) return `${hours}h remaining`
    return 'Due soon'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-lc-accent"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-lc-text-primary flex items-center gap-2">
          <FileText className="w-6 h-6 text-lc-accent" />
          My Assignments
        </h1>
        <p className="text-sm text-lc-text-secondary mt-1">
          View and complete assignments from your teachers
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-12 bg-lc-layer-2 rounded-lg">
          <FileText className="w-12 h-12 mx-auto mb-4 text-lc-text-tertiary opacity-50" />
          <p className="text-lc-text-tertiary">No assignments yet.</p>
          <p className="text-sm text-lc-text-tertiary mt-1">
            Your teacher will assign problems for you to solve.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <Link
              key={assignment.id}
              to={`/assignments/${assignment.id}`}
              className="block bg-lc-layer-2 rounded-lg p-5 hover:bg-lc-layer-3 transition-colors border border-lc-border"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-medium text-lc-text-primary">{assignment.title}</h3>
                  <p className="text-sm text-lc-text-tertiary mt-1">
                    By {assignment.createdBy.profile?.fullName || assignment.createdBy.username}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(assignment.status)}
                  <span className={`text-sm ${
                    assignment.status === 'submitted' ? 'text-green-400' :
                    assignment.status === 'submitted_late' ? 'text-yellow-400' :
                    assignment.status === 'overdue' ? 'text-red-400' :
                    'text-lc-text-tertiary'
                  }`}>
                    {getStatusText(assignment.status)}
                  </span>
                </div>
              </div>

              {assignment.description && (
                <p className="text-sm text-lc-text-secondary mb-4 line-clamp-2">
                  {assignment.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4 text-lc-text-tertiary">
                  <span>{assignment.problems.length} problems</span>
                  <span>Max Score: {assignment.maxScore}</span>
                </div>
                <div className={`flex items-center gap-1.5 ${
                  assignment.isPastDeadline ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span>
                    {assignment.isPastDeadline
                      ? `Due: ${formatDate(assignment.deadline)}`
                      : getTimeRemaining(assignment.deadline)}
                  </span>
                </div>
              </div>

              {assignment.submission && (
                <div className="mt-3 pt-3 border-t border-lc-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-lc-text-tertiary">
                      Submitted: {formatDate(assignment.submission.submittedAt)}
                    </span>
                    <span className="text-lc-text-primary font-medium">
                      Score: {assignment.submission.score}/{assignment.maxScore}
                    </span>
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
