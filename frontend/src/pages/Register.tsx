import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../lib/store'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuthStore()
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    fullName: '',
    college: 'N. K. Orchid College of Engineering & Technology, Solapur',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await register(formData)
      toast.success('Account created!')
      navigate('/problems')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-50px)] flex items-center justify-center bg-lc-layer-1 py-8">
      <div className="w-full max-w-[340px] px-4">
        <div className="text-center mb-6">
          <h1 className="text-[22px] font-semibold text-lc-text-primary">Create Account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[13px] text-lc-text-secondary mb-1.5">
              Email <span className="text-lc-hard">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="w-full bg-lc-layer-2 border border-lc-border rounded px-3 py-2.5 text-[14px] text-lc-text-primary placeholder-lc-text-tertiary focus:outline-none focus:border-lc-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-[13px] text-lc-text-secondary mb-1.5">
              Username <span className="text-lc-hard">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="johndoe"
              pattern="^[a-zA-Z0-9_]+$"
              minLength={3}
              maxLength={20}
              className="w-full bg-lc-layer-2 border border-lc-border rounded px-3 py-2.5 text-[14px] text-lc-text-primary placeholder-lc-text-tertiary focus:outline-none focus:border-lc-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-[13px] text-lc-text-secondary mb-1.5">
              Password <span className="text-lc-hard">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
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

          <div>
            <label className="block text-[13px] text-lc-text-secondary mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full bg-lc-layer-2 border border-lc-border rounded px-3 py-2.5 text-[14px] text-lc-text-primary placeholder-lc-text-tertiary focus:outline-none focus:border-lc-accent transition-colors"
            />
          </div>



          <button
            type="submit"
            disabled={loading}
            className="w-full bg-lc-green hover:bg-lc-green/90 text-white py-2.5 rounded text-[14px] font-medium transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <Link to="/login" className="text-[13px] text-lc-text-tertiary hover:text-lc-accent">
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
