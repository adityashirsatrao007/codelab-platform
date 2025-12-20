import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Users, FileText, Clock, Plus } from 'lucide-react'
import api from '../../lib/api'
import { useAuthStore } from '../../lib/store'

interface TeacherClass {
  id: string
  department: string
  division: string
  year: number
  _count: {
    users: number
  }
}

interface TeacherAssignment {
  id: string
  title: string
  deadline: string
  class: {
    department: string
    division: string
    year: number
  }
  _count: {
    submissions: number
    problems: number
  }
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  color: string
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-lc-layer-2 rounded-lg p-5 border border-lc-border">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-lc-text-primary">{value}</p>
          <p className="text-sm text-lc-text-tertiary">{label}</p>
        </div>
      </div>
    </div>
  )
}

export default function TeacherDashboard() {
  const { user } = useAuthStore()
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [recentAssignments, setRecentAssignments] = useState<TeacherAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalAssignments: 0,
    pendingSubmissions: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [classesRes, assignmentsRes] = await Promise.all([
        api.get('/assignments/my-classes'),
        api.get('/assignments/my-assignments'),
      ])

      setClasses(classesRes.data)
      setRecentAssignments(assignmentsRes.data.slice(0, 5))

      // Calculate stats
      const totalStudents = classesRes.data.reduce(
        (sum: number, c: TeacherClass) => sum + c._count.users,
        0
      )

      setStats({
        totalClasses: classesRes.data.length,
        totalStudents,
        totalAssignments: assignmentsRes.data.length,
        pendingSubmissions: 0, // Calculate from submissions if needed
      })
    } catch (error) {
      console.error('Failed to load teacher data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date()
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-lc-text-primary">
          Welcome, {user?.username}
        </h1>
        <p className="text-sm text-lc-text-secondary mt-1">Teacher Dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-blue-400" />}
          label="Classes"
          value={stats.totalClasses}
          color="bg-blue-500/20"
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-green-400" />}
          label="Students"
          value={stats.totalStudents}
          color="bg-green-500/20"
        />
        <StatCard
          icon={<FileText className="w-5 h-5 text-purple-400" />}
          label="Assignments"
          value={stats.totalAssignments}
          color="bg-purple-500/20"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-orange-400" />}
          label="Pending"
          value={stats.pendingSubmissions}
          color="bg-orange-500/20"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* My Classes */}
        <div className="bg-lc-layer-2 rounded-lg border border-lc-border">
          <div className="p-4 border-b border-lc-border">
            <h2 className="font-semibold text-lc-text-primary">My Classes</h2>
          </div>
          <div className="p-4">
            {classes.length === 0 ? (
              <p className="text-sm text-lc-text-tertiary text-center py-4">
                No classes assigned yet
              </p>
            ) : (
              <div className="space-y-3">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-3 bg-lc-layer-3 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-lc-text-primary">
                        {cls.department} - Division {cls.division}
                      </p>
                      <p className="text-sm text-lc-text-tertiary">
                        Year {cls.year}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-lc-text-primary">
                        {cls._count.users}
                      </p>
                      <p className="text-xs text-lc-text-tertiary">students</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Assignments */}
        <div className="bg-lc-layer-2 rounded-lg border border-lc-border">
          <div className="p-4 border-b border-lc-border flex items-center justify-between">
            <h2 className="font-semibold text-lc-text-primary">
              Recent Assignments
            </h2>
            <Link
              to="/teacher/assignments"
              className="inline-flex items-center gap-1 text-sm text-lc-accent hover:underline"
            >
              <Plus className="w-4 h-4" />
              Create
            </Link>
          </div>
          <div className="p-4">
            {recentAssignments.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-lc-text-tertiary mb-3">
                  No assignments created yet
                </p>
                <Link
                  to="/teacher/assignments"
                  className="text-sm text-lc-accent hover:underline"
                >
                  Create your first assignment
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAssignments.map((assignment) => (
                  <Link
                    key={assignment.id}
                    to={`/teacher/assignments/${assignment.id}`}
                    className="block p-3 bg-lc-layer-3 rounded-lg hover:bg-lc-layer-1 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-lc-text-primary">
                          {assignment.title}
                        </p>
                        <p className="text-xs text-lc-text-tertiary mt-1">
                          {assignment.class.department} • Division{' '}
                          {assignment.class.division} • Year{' '}
                          {assignment.class.year}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            isDeadlinePassed(assignment.deadline)
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}
                        >
                          {isDeadlinePassed(assignment.deadline)
                            ? 'Ended'
                            : 'Active'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-lc-text-tertiary">
                      <span>{assignment._count.problems} problems</span>
                      <span>{assignment._count.submissions} submissions</span>
                      <span>Due: {formatDate(assignment.deadline)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-lc-layer-2 rounded-lg border border-lc-border p-4">
        <h2 className="font-semibold text-lc-text-primary mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/teacher/assignments"
            className="inline-flex items-center gap-2 bg-lc-accent hover:bg-lc-accent-hover text-black px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Assignment
          </Link>
          <Link
            to="/problems"
            className="inline-flex items-center gap-2 bg-lc-layer-3 hover:bg-lc-layer-1 text-lc-text-primary px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Browse Problems
          </Link>
        </div>
      </div>
    </div>
  )
}
