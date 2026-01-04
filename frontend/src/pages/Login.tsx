import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { useAuthStore } from '../lib/store'

export default function Login() {
  const navigate = useNavigate()
  const { login, googleLogin, devLogin } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/problems')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast.error('Google login failed')
      return
    }

    setLoading(true)
    try {
      await googleLogin(credentialResponse.credential)
      
      // Check if profile needs completion
      const state = useAuthStore.getState()
      if (state.needsProfileCompletion) {
        toast.success('Please complete your profile')
        navigate('/complete-profile')
      } else if (state.needsVerification) {
        toast.success('Your account is pending verification')
        navigate('/verification-pending')
      } else {
        toast.success('Welcome!')
        navigate('/problems')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Google login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    toast.error('Google login failed')
  }

  const handleDevLogin = async () => {
    setLoading(true)
    try {
      await devLogin()
      toast.success('Developer Access Granted')
      const state = useAuthStore.getState()
      if (state.needsProfileCompletion) {
        navigate('/complete-profile')
      } else {
        navigate('/problems')
      }
    } catch (error) {
      toast.error('Dev bypass failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-50px)] flex items-center justify-center bg-lc-layer-1">
      <div className="w-full max-w-[340px] px-4">
        <div className="text-center mb-6">
          <h1 className="text-[22px] font-semibold text-lc-text-primary">Sign In</h1>
        </div>

        <div className="mb-6">
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              size="large"
              text="signin_with"
              shape="rectangular"
              width="308"
            />
          </div>
        </div>

        <div className="mb-6">
           <button
             type="button"
             onClick={handleDevLogin}
             className="w-full bg-lc-layer-3 border border-lc-border hover:bg-lc-layer-2 text-lc-text-primary py-2.5 rounded text-[14px] font-medium transition-colors flex items-center justify-center gap-2"
           >
             <svg className="w-5 h-5 text-lc-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
             </svg>
             Developer Access (Bypass)
           </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-lc-border"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-lc-layer-1 text-lc-text-tertiary">or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] text-lc-text-secondary mb-1.5">
              Email or Username
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-lc-layer-2 border border-lc-border rounded px-3 py-2.5 text-[14px] text-lc-text-primary placeholder-lc-text-tertiary focus:outline-none focus:border-lc-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-[13px] text-lc-text-secondary mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-lc-layer-2 border border-lc-border rounded px-3 py-2.5 text-[14px] text-lc-text-primary placeholder-lc-text-tertiary focus:outline-none focus:border-lc-accent transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lc-text-tertiary hover:text-lc-text-secondary"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-lc-green hover:bg-lc-green/90 text-white py-2.5 rounded text-[14px] font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <Link to="/register" className="text-[13px] text-lc-text-tertiary hover:text-lc-accent">
            Don't have an account? Register
          </Link>
        </div>
      </div>
    </div>
  )
}
