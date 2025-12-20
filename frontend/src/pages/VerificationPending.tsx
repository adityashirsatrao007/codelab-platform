import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../lib/store'
import { Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

export default function VerificationPending() {
  const navigate = useNavigate()
  const { user, checkVerificationStatus, logout } = useAuthStore()
  const [status, setStatus] = useState<{
    isVerified: boolean
    verificationStatus: string
    rejectionReason?: string
  } | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    // If user is already verified or is admin, redirect
    if (user?.isVerified || user?.role === 'admin' || user?.role === 'superadmin') {
      navigate('/problems')
    }
  }, [user, navigate])

  const checkStatus = async () => {
    setChecking(true)
    try {
      const result = await checkVerificationStatus()
      setStatus(result)
      
      if (result.isVerified) {
        navigate('/problems')
      }
    } catch (error) {
      console.error('Failed to check status:', error)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkStatus()
    
    // Poll every 30 seconds
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const renderStatus = () => {
    if (!status) return null

    if (status.verificationStatus === 'approved') {
      return (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold text-lc-text-primary mb-2">
            Account Verified!
          </h2>
          <p className="text-lc-text-secondary mb-6">
            Your account has been verified by your class coordinator.
          </p>
          <Link
            to="/problems"
            className="inline-block bg-lc-green hover:bg-lc-green/90 text-white px-6 py-2.5 rounded text-[14px] font-medium transition-colors"
          >
            Start Coding
          </Link>
        </div>
      )
    }

    if (status.verificationStatus === 'rejected') {
      return (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 rounded-full mb-4">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-lc-text-primary mb-2">
            Verification Rejected
          </h2>
          <p className="text-lc-text-secondary mb-4">
            Unfortunately, your verification request was rejected.
          </p>
          {status.rejectionReason && (
            <div className="bg-red-500/10 border border-red-500/20 rounded p-4 mb-6 text-left">
              <p className="text-sm text-red-400">
                <strong>Reason:</strong> {status.rejectionReason}
              </p>
            </div>
          )}
          <p className="text-sm text-lc-text-tertiary mb-6">
            Please contact your class coordinator or update your profile and try again.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/complete-profile"
              className="bg-lc-accent hover:bg-lc-accent/90 text-white px-6 py-2.5 rounded text-[14px] font-medium transition-colors"
            >
              Update Profile
            </Link>
            <button
              onClick={handleLogout}
              className="bg-lc-layer-3 hover:bg-lc-layer-2 text-lc-text-primary px-6 py-2.5 rounded text-[14px] font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )
    }

    // Pending status
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500/10 rounded-full mb-4">
          <Clock className="w-10 h-10 text-yellow-500" />
        </div>
        <h2 className="text-xl font-semibold text-lc-text-primary mb-2">
          Verification Pending
        </h2>
        <p className="text-lc-text-secondary mb-6">
          Your profile has been submitted and is waiting for verification by your class coordinator.
          This usually takes 24-48 hours.
        </p>
        
        <div className="bg-lc-layer-2 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-lc-text-primary mb-3">Your Details</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-left">
            <div className="text-lc-text-tertiary">Name:</div>
            <div className="text-lc-text-primary">{user?.profile?.fullName || '-'}</div>
            <div className="text-lc-text-tertiary">Roll Number:</div>
            <div className="text-lc-text-primary">{user?.profile?.rollNumber || '-'}</div>
            <div className="text-lc-text-tertiary">Department:</div>
            <div className="text-lc-text-primary">{user?.profile?.department || '-'}</div>
            <div className="text-lc-text-tertiary">Division:</div>
            <div className="text-lc-text-primary">{user?.profile?.division || '-'}</div>
            <div className="text-lc-text-tertiary">Year:</div>
            <div className="text-lc-text-primary">{user?.profile?.year || '-'}</div>
          </div>
        </div>

        <button
          onClick={checkStatus}
          disabled={checking}
          className="inline-flex items-center gap-2 bg-lc-layer-3 hover:bg-lc-layer-2 text-lc-text-primary px-6 py-2.5 rounded text-[14px] font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking...' : 'Check Status'}
        </button>

        <div className="mt-6 pt-6 border-t border-lc-border">
          <button
            onClick={handleLogout}
            className="text-sm text-lc-text-tertiary hover:text-lc-accent transition-colors"
          >
            Sign out and use a different account
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-50px)] flex items-center justify-center bg-lc-layer-1">
      <div className="w-full max-w-[500px] px-4">
        {renderStatus()}
      </div>
    </div>
  )
}
