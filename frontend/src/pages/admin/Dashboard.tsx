import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, FileText, Award, Clock, TrendingUp } from 'lucide-react'
import api from '../../lib/api'
import { useAuthStore } from '../../lib/store'

interface Stats {
  totalUsers: number
  totalStudents: number
  totalTeachers: number
  totalCoordinators: number
  pendingVerifications: number
  totalProblems: number
  totalSubmissions: number
  totalClasses: number
  recentSubmissions: number
}

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await api.get('/admin/stats')
      setStats(res.data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!confirm('This will sync ALL problems from the daily-updated source. This may take a minute. Continue?')) return;
    
    setSyncing(true);
    try {
        await api.post('/sync/trigger', { type: 'full' });
        alert('Full Sync started! New problems will appear shortly.');
        loadStats(); // Refresh stats
    } catch (e) {
        alert('Failed to trigger sync.');
        console.error(e);
    } finally {
        setSyncing(false);
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, link }: {
    title: string
    value: number | string
    icon: any
    color: string
    link?: string
  }) => {
    const content = (
      <div className={`bg-lc-layer-2 rounded-lg p-5 border border-lc-border ${link ? 'hover:bg-lc-layer-3 transition-colors' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <p className="text-2xl font-bold text-lc-text-primary">{value}</p>
        <p className="text-sm text-lc-text-tertiary mt-1">{title}</p>
      </div>
    )

    return link ? <Link to={link}>{content}</Link> : content
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
          {user?.role === 'coordinator' ? 'Coordinator' : 'Admin'} Dashboard
        </h1>
        <p className="text-sm text-lc-text-secondary mt-1">
          Overview of the platform
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-lc-text-primary mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/verifications"
            className="inline-flex items-center gap-2 bg-lc-accent hover:bg-lc-accent/90 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            <Clock className="w-4 h-4" />
            Pending Verifications ({stats?.pendingVerifications || 0})
          </Link>
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <>
              <Link
                to="/admin/users"
                className="inline-flex items-center gap-2 bg-lc-layer-3 hover:bg-lc-layer-2 text-lc-text-primary px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                <Users className="w-4 h-4" />
                Manage Users
              </Link>
              {/* Sync is potentially destructive/heavy, restrict to SuperAdmin */}
              {user?.role === 'superadmin' && (
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="inline-flex items-center gap-2 bg-lc-layer-3 hover:bg-lc-layer-2 text-lc-text-primary px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <TrendingUp className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Sync LeetCode'}
                  </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            color="bg-blue-500/20 text-blue-400"
            link="/admin/users"
          />
          <StatCard
            title="Students"
            value={stats.totalStudents}
            icon={Users}
            color="bg-green-500/20 text-green-400"
          />
          <StatCard
            title="Pending Verifications"
            value={stats.pendingVerifications}
            icon={Clock}
            color="bg-yellow-500/20 text-yellow-400"
            link="/admin/verifications"
          />
          <StatCard
            title="Total Problems"
            value={stats.totalProblems}
            icon={FileText}
            color="bg-purple-500/20 text-purple-400"
          />
          <StatCard
            title="Total Submissions"
            value={stats.totalSubmissions}
            icon={TrendingUp}
            color="bg-indigo-500/20 text-indigo-400"
          />
          <StatCard
            title="Today's Submissions"
            value={stats.recentSubmissions}
            icon={TrendingUp}
            color="bg-cyan-500/20 text-cyan-400"
          />
          <StatCard
            title="Teachers"
            value={stats.totalTeachers}
            icon={Users}
            color="bg-orange-500/20 text-orange-400"
          />
          <StatCard
            title="Classes"
            value={stats.totalClasses}
            icon={Award}
            color="bg-pink-500/20 text-pink-400"
          />
        </div>
      )}

      {/* Role-specific sections */}
      {user?.role === 'coordinator' && (
        <div className="bg-lc-layer-2 rounded-lg p-6 border border-lc-border">
          <h2 className="text-lg font-semibold text-lc-text-primary mb-4">Your Class</h2>
          <p className="text-lc-text-secondary">
            As a coordinator, you can verify students in your assigned class.
            Check the pending verifications to approve or reject student registrations.
          </p>
        </div>
      )}
    </div>
  )
}
