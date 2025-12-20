import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, ExternalLink, User } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useAuthStore } from '../../lib/store'

interface PendingUser {
  id: string
  email: string
  username: string
  createdAt: string
  profile: {
    fullName: string
    rollNumber: string
    department: string
    division: string
    year: number
    contactPhone: string
    college: string
    collegeIdUrl: string
  }
}

export default function AdminVerifications() {
  const { user: currentUser } = useAuthStore()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadPendingUsers()
  }, [])

  const loadPendingUsers = async () => {
    try {
      const res = await api.get('/admin/verifications/pending')
      setPendingUsers(res.data)
    } catch (error) {
      console.error('Failed to load pending users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (userId: string, action: 'approve' | 'reject') => {
    setProcessing(true)
    try {
      await api.post(`/admin/verify/${userId}`, {
        action,
        rejectionReason: action === 'reject' ? rejectionReason : undefined,
      })

      toast.success(`Student ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
      setShowRejectModal(false)
      setRejectionReason('')
      setSelectedUser(null)
      loadPendingUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${action} student`)
    } finally {
      setProcessing(false)
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
        <h1 className="text-2xl font-bold text-lc-text-primary">Pending Verifications</h1>
        <p className="text-sm text-lc-text-secondary mt-1">
          {currentUser?.role === 'coordinator'
            ? 'Verify students in your class'
            : 'Verify student registrations'}
        </p>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="bg-lc-layer-2 rounded-lg p-12 text-center border border-lc-border">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400 opacity-50" />
          <p className="text-lc-text-primary font-medium">All caught up!</p>
          <p className="text-sm text-lc-text-tertiary mt-1">
            No pending verifications at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((user) => (
            <div
              key={user.id}
              className="bg-lc-layer-2 rounded-lg p-5 border border-lc-border"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-lc-layer-3 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-lc-text-tertiary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lc-text-primary">
                      {user.profile.fullName}
                    </h3>
                    <p className="text-sm text-lc-text-tertiary">{user.email}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-lc-text-secondary">
                      <span>Roll: {user.profile.rollNumber}</span>
                      <span>{user.profile.department}</span>
                      <span>Division {user.profile.division}</span>
                      <span>Year {user.profile.year}</span>
                    </div>
                    <p className="text-sm text-lc-text-tertiary mt-1">
                      College: {user.profile.college}
                    </p>
                    <p className="text-sm text-lc-text-tertiary">
                      Phone: {user.profile.contactPhone}
                    </p>
                    <p className="text-xs text-lc-text-tertiary mt-2">
                      Registered: {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {user.profile.collegeIdUrl && (
                    <a
                      href={user.profile.collegeIdUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-lc-accent hover:underline"
                    >
                      View ID Card
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleVerify(user.id, 'approve')}
                      disabled={processing}
                      className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user)
                        setShowRejectModal(true)
                      }}
                      disabled={processing}
                      className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-lc-layer-2 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-lc-text-primary mb-4">
              Reject Verification
            </h2>
            <p className="text-sm text-lc-text-secondary mb-4">
              Rejecting verification for{' '}
              <span className="font-medium text-lc-text-primary">
                {selectedUser.profile.fullName}
              </span>
            </p>

            <div className="mb-4">
              <label className="block text-sm text-lc-text-secondary mb-1">
                Reason for rejection (optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Invalid ID card, wrong details..."
                rows={3}
                className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2 text-sm text-lc-text-primary placeholder-lc-text-tertiary focus:outline-none focus:border-lc-accent resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedUser(null)
                  setRejectionReason('')
                }}
                className="flex-1 bg-lc-layer-3 hover:bg-lc-layer-1 text-lc-text-primary py-2 rounded text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerify(selectedUser.id, 'reject')}
                disabled={processing}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
              >
                {processing ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
