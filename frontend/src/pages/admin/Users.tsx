import { useState, useEffect } from 'react'
import { Search, Plus, Trash2, Shield, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useAuthStore } from '../../lib/store'

interface User {
  id: string
  email: string
  username: string
  role: string
  isVerified: boolean
  verificationStatus: string
  createdAt: string
  profile?: {
    fullName: string
    rollNumber?: string
    department?: string
    division?: string
    year?: number
  }
}

export default function AdminUsers() {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createType, setCreateType] = useState<'admin' | 'coordinator' | 'teacher'>('teacher')

  useEffect(() => {
    loadUsers()
  }, [search, roleFilter, page])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/users', {
        params: { search, role: roleFilter || undefined, page, limit: 20 },
      })
      setUsers(res.data.users)
      setTotalPages(res.data.pagination.pages)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (userId: string) => {
    if (!confirm('Are you sure you want to approve this user?')) return

    try {
      await api.post(`/admin/verify/${userId}`, {
        action: 'approve',
      })
      toast.success('User approved successfully')
      loadUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to approve user')
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      await api.delete(`/admin/users/${userId}`)
      toast.success('User deleted')
      loadUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete user')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-500/20 text-red-400'
      case 'admin':
        return 'bg-purple-500/20 text-purple-400'
      case 'coordinator':
        return 'bg-blue-500/20 text-blue-400'
      case 'teacher':
        return 'bg-orange-500/20 text-orange-400'
      default:
        return 'bg-green-500/20 text-green-400'
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-lc-text-primary">User Management</h1>
          <p className="text-sm text-lc-text-secondary mt-1">
            Manage all users on the platform
          </p>
        </div>
        <div className="flex gap-2">
          {currentUser?.role === 'superadmin' && (
            <button
              onClick={() => { setCreateType('admin'); setShowCreateModal(true) }}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              <Shield className="w-4 h-4" />
              Create Admin
            </button>
          )}
          <button
            onClick={() => { setCreateType('coordinator'); setShowCreateModal(true) }}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            Create Coordinator
          </button>
          <button
            onClick={() => { setCreateType('teacher'); setShowCreateModal(true) }}
            className="inline-flex items-center gap-2 bg-lc-accent hover:bg-lc-accent/90 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Teacher
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lc-text-tertiary" />
          <input
            type="text"
            placeholder="Search by email, username, or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-lc-layer-2 border border-lc-border rounded pl-10 pr-4 py-2 text-sm text-lc-text-primary placeholder-lc-text-tertiary focus:outline-none focus:border-lc-accent"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-lc-layer-2 border border-lc-border rounded px-4 py-2 text-sm text-lc-text-primary focus:outline-none focus:border-lc-accent"
        >
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="coordinator">Coordinators</option>
          <option value="admin">Admins</option>
          <option value="superadmin">Super Admins</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-lc-layer-2 rounded-lg overflow-hidden border border-lc-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-lc-border bg-lc-layer-3">
              <th className="px-4 py-3 text-left text-sm font-medium text-lc-text-tertiary">User</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-lc-text-tertiary">Role</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-lc-text-tertiary">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-lc-text-tertiary">Details</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-lc-text-tertiary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-lc-accent mx-auto"></div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-lc-text-tertiary">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-lc-border/50 last:border-0">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-lc-text-primary">
                        {user.profile?.fullName || user.username || 'No name'}
                      </p>
                      <p className="text-xs text-lc-text-tertiary">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      user.isVerified
                        ? 'bg-green-500/20 text-green-400'
                        : user.verificationStatus === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {user.verificationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-lc-text-tertiary">
                    {user.profile?.department && (
                      <span>{user.profile.department} - {user.profile.division} - Y{user.profile.year}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.verificationStatus === 'pending' && (currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
                        <button
                          onClick={() => handleVerify(user.id)}
                          className="p-1 text-green-400 hover:text-green-300 transition-colors"
                          title="Approve User"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      {user.role !== 'superadmin' && user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded text-sm ${
                p === page
                  ? 'bg-lc-accent text-white'
                  : 'bg-lc-layer-2 text-lc-text-secondary hover:bg-lc-layer-3'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Create Modal - simplified for now */}
      {showCreateModal && (
        <CreateUserModal
          type={createType}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); loadUsers() }}
        />
      )}
    </div>
  )
}

function CreateUserModal({ type, onClose, onSuccess }: {
  type: 'admin' | 'coordinator' | 'teacher'
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    fullName: '',
    department: '',
    division: '',
    year: '1',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = type === 'admin' 
        ? '/admin/users/admin' 
        : type === 'coordinator' 
        ? '/admin/users/coordinator'
        : '/admin/users/teacher'

      await api.post(endpoint, formData)
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} created successfully`)
      onSuccess()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-lc-layer-2 rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-lc-text-primary mb-4">
          Create {type.charAt(0).toUpperCase() + type.slice(1)}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-lc-text-secondary mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2 text-sm text-lc-text-primary focus:outline-none focus:border-lc-accent"
            />
          </div>

          <div>
            <label className="block text-sm text-lc-text-secondary mb-1">Username</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2 text-sm text-lc-text-primary focus:outline-none focus:border-lc-accent"
            />
          </div>

          <div>
            <label className="block text-sm text-lc-text-secondary mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2 text-sm text-lc-text-primary focus:outline-none focus:border-lc-accent"
            />
          </div>

          <div>
            <label className="block text-sm text-lc-text-secondary mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2 text-sm text-lc-text-primary focus:outline-none focus:border-lc-accent"
            />
          </div>

          {type === 'coordinator' && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm text-lc-text-secondary mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2 text-sm text-lc-text-primary focus:outline-none focus:border-lc-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-lc-text-secondary mb-1">Division</label>
                  <input
                    type="text"
                    required
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2 text-sm text-lc-text-primary focus:outline-none focus:border-lc-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-lc-text-secondary mb-1">Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2 text-sm text-lc-text-primary focus:outline-none focus:border-lc-accent"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-lc-layer-3 hover:bg-lc-layer-1 text-lc-text-primary py-2 rounded text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-lc-accent hover:bg-lc-accent/90 text-white py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
