import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, User, Clock, CheckCircle, XCircle } from 'lucide-react'
import api from '../../lib/api'

interface AssignmentSubmission {
  id: string
  status: string
  submittedAt: string
  user: {
    username: string
    profile: {
      fullName: string
      rollNumber: string
    }
  }
  problem: {
    id: string
    title: string
    difficulty: string
  }
}

interface AssignmentDetail {
  id: string
  title: string
  description: string
  deadline: string
  class: {
    department: string
    division: string
    year: number
  }
  problems: Array<{
    problem: {
      id: string
      title: string
      difficulty: string
    }
  }>
  _count: {
    submissions: number
  }
}

export default function TeacherAssignmentDetail() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [filterProblem, setFilterProblem] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    loadData()
  }, [assignmentId])

  const loadData = async () => {
    try {
      const [assignmentRes, submissionsRes] = await Promise.all([
        api.get(`/assignments/${assignmentId}`),
        api.get(`/assignments/${assignmentId}/submissions`),
      ])
      setAssignment(assignmentRes.data)
      setSubmissions(submissionsRes.data)
    } catch (error) {
      console.error('Failed to load assignment:', error)
      navigate('/teacher/assignments')
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

  const isDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date()
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

  const filteredSubmissions = submissions.filter((s) => {
    const matchesProblem = !filterProblem || s.problem.id === filterProblem
    const matchesStatus = !filterStatus || s.status === filterStatus
    return matchesProblem && matchesStatus
  })

  // Group submissions by student
  const submissionsByStudent = filteredSubmissions.reduce((acc, sub) => {
    const key = sub.user.username
    if (!acc[key]) {
      acc[key] = {
        user: sub.user,
        submissions: [],
      }
    }
    acc[key].submissions.push(sub)
    return acc
  }, {} as Record<string, { user: typeof submissions[0]['user']; submissions: AssignmentSubmission[] }>)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-lc-accent"></div>
      </div>
    )
  }

  if (!assignment) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/teacher/assignments"
          className="inline-flex items-center gap-1 text-sm text-lc-text-tertiary hover:text-lc-text-secondary mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assignments
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-lc-text-primary">
              {assignment.title}
            </h1>
            <p className="text-sm text-lc-text-secondary mt-1">
              {assignment.class.department} • Division {assignment.class.division} • Year{' '}
              {assignment.class.year}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded text-sm font-medium ${
              isDeadlinePassed(assignment.deadline)
                ? 'bg-red-500/20 text-red-400'
                : 'bg-green-500/20 text-green-400'
            }`}
          >
            {isDeadlinePassed(assignment.deadline) ? 'Ended' : 'Active'}
          </span>
        </div>
        <p className="text-sm text-lc-text-tertiary mt-2">
          Deadline: {formatDate(assignment.deadline)}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-lc-layer-2 rounded-lg p-4 border border-lc-border">
          <p className="text-2xl font-bold text-lc-text-primary">
            {assignment.problems.length}
          </p>
          <p className="text-sm text-lc-text-tertiary">Problems</p>
        </div>
        <div className="bg-lc-layer-2 rounded-lg p-4 border border-lc-border">
          <p className="text-2xl font-bold text-lc-text-primary">
            {Object.keys(submissionsByStudent).length}
          </p>
          <p className="text-sm text-lc-text-tertiary">Students Submitted</p>
        </div>
        <div className="bg-lc-layer-2 rounded-lg p-4 border border-lc-border">
          <p className="text-2xl font-bold text-lc-text-primary">
            {assignment._count.submissions}
          </p>
          <p className="text-sm text-lc-text-tertiary">Total Submissions</p>
        </div>
      </div>

      {/* Problems */}
      <div className="bg-lc-layer-2 rounded-lg border border-lc-border mb-8">
        <div className="p-4 border-b border-lc-border">
          <h2 className="font-semibold text-lc-text-primary">Problems</h2>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            {assignment.problems.map(({ problem }) => (
              <div
                key={problem.id}
                className="flex items-center justify-between p-3 bg-lc-layer-3 rounded"
              >
                <span className="text-sm text-lc-text-primary">{problem.title}</span>
                <span
                  className={`text-xs font-medium ${getDifficultyColor(
                    problem.difficulty
                  )}`}
                >
                  {problem.difficulty}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <select
          value={filterProblem}
          onChange={(e) => setFilterProblem(e.target.value)}
          className="bg-lc-layer-2 border border-lc-border rounded px-3 py-2 text-sm text-lc-text-primary focus:outline-none focus:border-lc-accent"
        >
          <option value="">All Problems</option>
          {assignment.problems.map(({ problem }) => (
            <option key={problem.id} value={problem.id}>
              {problem.title}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-lc-layer-2 border border-lc-border rounded px-3 py-2 text-sm text-lc-text-primary focus:outline-none focus:border-lc-accent"
        >
          <option value="">All Status</option>
          <option value="accepted">Accepted</option>
          <option value="wrong_answer">Wrong Answer</option>
          <option value="runtime_error">Runtime Error</option>
          <option value="time_limit_exceeded">Time Limit</option>
        </select>
      </div>

      {/* Submissions by Student */}
      <div className="bg-lc-layer-2 rounded-lg border border-lc-border">
        <div className="p-4 border-b border-lc-border">
          <h2 className="font-semibold text-lc-text-primary">Submissions</h2>
        </div>
        <div className="divide-y divide-lc-border">
          {Object.keys(submissionsByStudent).length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-lc-text-tertiary">No submissions yet</p>
            </div>
          ) : (
            Object.values(submissionsByStudent).map(({ user, submissions }) => (
              <div key={user.username} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-lc-layer-3 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-lc-text-tertiary" />
                  </div>
                  <div>
                    <p className="font-medium text-lc-text-primary">
                      {user.profile.fullName}
                    </p>
                    <p className="text-xs text-lc-text-tertiary">
                      {user.profile.rollNumber} • @{user.username}
                    </p>
                  </div>
                </div>
                <div className="ml-11 space-y-2">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between text-sm p-2 bg-lc-layer-3 rounded"
                    >
                      <div className="flex items-center gap-2">
                        {sub.status === 'accepted' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-lc-text-primary">{sub.problem.title}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`text-xs ${
                            sub.status === 'accepted'
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}
                        >
                          {sub.status.replace(/_/g, ' ')}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-lc-text-tertiary">
                          <Clock className="w-3 h-3" />
                          {formatDate(sub.submittedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
