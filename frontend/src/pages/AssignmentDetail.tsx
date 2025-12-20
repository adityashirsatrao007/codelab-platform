import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, FileText, CheckCircle } from 'lucide-react'
import api from '../lib/api'

interface Problem {
  id: string
  title: string
  slug: string
  difficulty: string
}

interface Assignment {
  id: string
  title: string
  description: string
  deadline: string
  maxScore: number
  problems: { problem: Problem; order: number }[]
  createdBy: { username: string; profile: { fullName: string } }
  submission?: {
    score: number
    isLate: boolean
    submittedAt: string
  }
  isPastDeadline: boolean
}

export default function AssignmentDetail() {
  const { assignmentId } = useParams()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAssignment()
  }, [assignmentId])

  const loadAssignment = async () => {
    try {
      const res = await api.get(`/assignments/${assignmentId}`)
      setAssignment(res.data)
    } catch (error) {
      console.error('Failed to load assignment:', error)
    } finally {
      setLoading(false)
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

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-lc-text-tertiary">Assignment not found</p>
        <Link to="/assignments" className="text-lc-accent hover:underline mt-2 inline-block">
          Back to Assignments
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <Link to="/assignments" className="inline-flex items-center gap-1 text-sm text-lc-text-tertiary hover:text-lc-accent mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to Assignments
      </Link>

      <div className="bg-lc-layer-2 rounded-lg p-6 mb-6 border border-lc-border">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-lc-text-primary">{assignment.title}</h1>
            <p className="text-sm text-lc-text-tertiary mt-1">
              By {assignment.createdBy.profile?.fullName || assignment.createdBy.username}
            </p>
          </div>
          {assignment.submission ? (
            <div className="text-right">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Submitted</span>
              </div>
              <p className="text-sm text-lc-text-tertiary mt-1">
                Score: {assignment.submission.score}/{assignment.maxScore}
              </p>
            </div>
          ) : (
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              assignment.isPastDeadline
                ? 'bg-red-500/20 text-red-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {assignment.isPastDeadline ? 'Overdue' : 'Pending'}
            </span>
          )}
        </div>

        {assignment.description && (
          <p className="text-lc-text-secondary mb-4">{assignment.description}</p>
        )}

        <div className="flex items-center gap-6 text-sm text-lc-text-tertiary">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>Due: {formatDate(assignment.deadline)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>{assignment.problems.length} problems</span>
          </div>
          <span>Max Score: {assignment.maxScore}</span>
        </div>

        {assignment.isPastDeadline && !assignment.submission && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
            ⚠️ This assignment is past due. Late submissions may receive reduced points.
          </div>
        )}
      </div>

      {/* Problems */}
      <h2 className="text-lg font-semibold text-lc-text-primary mb-4">Problems</h2>
      <div className="space-y-2">
        {assignment.problems
          .sort((a, b) => a.order - b.order)
          .map((item, index) => (
            <Link
              key={item.problem.id}
              to={`/problems/${item.problem.slug}?assignment=${assignmentId}`}
              className="flex items-center justify-between bg-lc-layer-2 rounded-lg px-4 py-3 hover:bg-lc-layer-3 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-lc-text-tertiary w-6">{index + 1}</span>
                <span className="text-lc-text-primary">{item.problem.title}</span>
              </div>
              <span className={getDifficultyColor(item.problem.difficulty)}>
                {item.problem.difficulty}
              </span>
            </Link>
          ))}
      </div>
    </div>
  )
}
