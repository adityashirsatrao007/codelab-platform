
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Calendar,
  Clock,
  Users,
  FileText,
  Trash2,
  Eye,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

interface TeacherClass {
  id: string
  department: string
  division: string
  year: number
  _count: {
    users: number
  }
}

interface Assignment {
  id: string
  title: string
  description: string
  deadline: string
  createdAt: string
  class: {
    id: string
    department: string
    division: string
    year: number
  }
  _count: {
    problems: number
    submissions: number
  }
}

interface Problem {
  id: string
  title: string
  difficulty: string
}

interface CreateAssignmentForm {
  title: string
  description: string
  classId: string
  deadline: string
  problemIds: string[]
}

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedClassFilter, setSelectedClassFilter] = useState('')
  const [form, setForm] = useState<CreateAssignmentForm>({
    title: '',
    description: '',
    classId: '',
    deadline: '',
    problemIds: [],
  })
  const [creating, setCreating] = useState(false)
  const [problemSearch, setProblemSearch] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [classesRes, assignmentsRes, problemsRes] = await Promise.all([
        api.get('/assignments/my-classes'),
        api.get('/assignments/my-assignments'),
        api.get('/problems'),
      ])
      setClasses(classesRes.data)
      setAssignments(assignmentsRes.data)
      setProblems(problemsRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.title || !form.classId || !form.deadline) {
      toast.error('Please fill all required fields')
      return
    }

    if (form.problemIds.length === 0) {
      toast.error('Please select at least one problem')
      return
    }

    setCreating(true)
    try {
      await api.post('/assignments', form)
      toast.success('Assignment created successfully')
      setShowCreateModal(false)
      setForm({
        title: '',
        description: '',
        classId: '',
        deadline: '',
        problemIds: [],
      })
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create assignment')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return

    try {
      await api.delete(`/assignments/${id}`)
      toast.success('Assignment deleted')
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete assignment')
    }
  }

  const toggleProblem = (problemId: string) => {
    setForm((prev) => ({
      ...prev,
      problemIds: prev.problemIds.includes(problemId)
        ? prev.problemIds.filter((id) => id !== problemId)
        : [...prev.problemIds, problemId],
    }))
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

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesClass = !selectedClassFilter || a.class.id === selectedClassFilter
    return matchesSearch && matchesClass
  })

  const filteredProblems = problems.filter((p) =>
    p.title.toLowerCase().includes(problemSearch.toLowerCase())
  )

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-lc-text-primary">
            My Assignments
          </h1>
          <p className="text-sm text-lc-text-secondary mt-1">
            Create and manage assignments for your classes
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-lc-accent hover:bg-lc-accent-hover text-black px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Assignment
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lc-text-tertiary" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-lc-layer-2 border border-lc-border rounded pl-10 pr-4 py-2 text-sm text-lc-text-primary placeholder-lc-text-tertiary focus:outline-none focus:border-lc-accent"
          />
        </div>
        <select
          value={selectedClassFilter}
          onChange={(e) => setSelectedClassFilter(e.target.value)}
          className="bg-lc-layer-2 border border-lc-border rounded px-3 py-2 text-sm text-lc-text-primary focus:outline-none focus:border-lc-accent"
        >
          <option value="">All Classes</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.department} - Div {cls.division} - Year {cls.year}
            </option>
          ))}
        </select>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-lc-layer-2 rounded-lg p-12 text-center border border-lc-border">
          <FileText className="w-12 h-12 mx-auto mb-4 text-lc-text-tertiary opacity-50" />
          <p className="text-lc-text-primary font-medium">No assignments yet</p>
          <p className="text-sm text-lc-text-tertiary mt-1">
            Create your first assignment to get started
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-lc-layer-2 rounded-lg p-5 border border-lc-border"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-lc-text-primary text-lg">
                      {assignment.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        isDeadlinePassed(assignment.deadline)
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {isDeadlinePassed(assignment.deadline) ? 'Ended' : 'Active'}
                    </span>
                  </div>
                  {assignment.description && (
                    <p className="text-sm text-lc-text-secondary mt-2 line-clamp-2">
                      {assignment.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-lc-text-tertiary">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {assignment.class.department} • Div {assignment.class.division} • Year{' '}
                      {assignment.class.year}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {assignment._count.problems} problems
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {assignment._count.submissions} submissions
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Due: {formatDate(assignment.deadline)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link
                    to={`/teacher/assignments/${assignment.id}`}
                    className="p-2 text-lc-text-tertiary hover:text-lc-text-primary hover:bg-lc-layer-3 rounded transition-colors"
                    title="View Submissions"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(assignment.id)}
                    className="p-2 text-lc-text-tertiary hover:text-red-400 hover:bg-lc-layer-3 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-lc-layer-2 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-lc-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-lc-text-primary">
                Create Assignment
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-lc-text-tertiary hover:text-lc-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-sm text-lc-text-secondary mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Assignment title"
                  className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2 text-sm text-lc-text-primary placeholder-lc-text-tertiary focus:outline-none focus:border-lc-accent"
                />
              </div>

              <div>
                <label className="block text-sm text-lc-text-secondary mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Assignment description..."
                  rows={2}
                  className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2 text-sm text-lc-text-primary placeholder-lc-text-tertiary focus:outline-none focus:border-lc-accent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-lc-text-secondary mb-1">
                    Class *
                  </label>
                  <select
                    value={form.classId}
                    onChange={(e) => setForm({ ...form, classId: e.target.value })}
                    className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2 text-sm text-lc-text-primary focus:outline-none focus:border-lc-accent"
                  >
                    <option value="">Select class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.department} - Div {cls.division} - Year {cls.year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-lc-text-secondary mb-1">
                    Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    value={form.deadline}
                    onChange={(e) =>
                      setForm({ ...form, deadline: e.target.value })
                    }
                    className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2 text-sm text-lc-text-primary focus:outline-none focus:border-lc-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-lc-text-secondary mb-1">
                  Problems * ({form.problemIds.length} selected)
                </label>
                <input
                  type="text"
                  placeholder="Search problems..."
                  value={problemSearch}
                  onChange={(e) => setProblemSearch(e.target.value)}
                  className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2 text-sm text-lc-text-primary placeholder-lc-text-tertiary focus:outline-none focus:border-lc-accent mb-2"
                />
                <div className="bg-lc-layer-3 border border-lc-border rounded max-h-48 overflow-y-auto">
                  {filteredProblems.map((problem) => (
                    <label
                      key={problem.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-lc-layer-1 cursor-pointer border-b border-lc-border last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={form.problemIds.includes(problem.id)}
                        onChange={() => toggleProblem(problem.id)}
                        className="w-4 h-4 rounded border-lc-border bg-lc-layer-2 text-lc-accent focus:ring-lc-accent"
                      />
                      <span className="text-sm text-lc-text-primary flex-1">
                        {problem.title}
                      </span>
                      <span
                        className={`text-xs font-medium ${getDifficultyColor(
                          problem.difficulty
                        )}`}
                      >
                        {problem.difficulty}
                      </span>
                    </label>
                  ))}
                  {filteredProblems.length === 0 && (
                    <p className="text-sm text-lc-text-tertiary text-center py-4">
                      No problems found
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-lc-border flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-lc-layer-3 hover:bg-lc-layer-1 text-lc-text-primary py-2 rounded text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 bg-lc-accent hover:bg-lc-accent-hover text-black py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
