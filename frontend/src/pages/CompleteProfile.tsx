import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../lib/store'
import api from '../lib/api'

export default function CompleteProfile() {
  const navigate = useNavigate()
  const { user, completeProfile, needsProfileCompletion } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<string[]>([])
  const [divisions, setDivisions] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    fullName: user?.profile?.fullName || '',
    username: user?.username || '',
    rollNumber: '',
    department: '',
    division: '',
    year: '',
    contactPhone: '',
    college: 'N. K. Orchid College Of Engineering & Technology, Solapur',
    githubUrl: '', // REQUIRED
  })
  const [collegeIdFile, setCollegeIdFile] = useState<File | null>(null)

  useEffect(() => {
    // Redirect if not needed
    if (!needsProfileCompletion && user?.isVerified) {
      navigate('/problems')
      return
    }

    // Load departments
    api.get('/classes/departments').then((res) => {
      setDepartments(res.data)
    }).catch(console.error)
  }, [needsProfileCompletion, user, navigate])

  useEffect(() => {
    // Load divisions when department and year are selected
    if (formData.department && formData.year) {
      api.get('/classes/divisions', {
        params: { department: formData.department, year: formData.year }
      }).then((res) => {
        setDivisions(res.data)
      }).catch(console.error)
    }
  }, [formData.department, formData.year])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setCollegeIdFile(e.target.files[0])
    }
  }

  const validateGitHubUrl = (url: string) => {
    return /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/.test(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate GitHub URL
    if (!formData.githubUrl) {
      toast.error('GitHub profile URL is required')
      return
    }
    
    if (!validateGitHubUrl(formData.githubUrl)) {
      toast.error('Invalid GitHub URL. Format: https://github.com/username')
      return
    }

    setLoading(true)

    try {
      const data = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value)
      })
      if (collegeIdFile) {
        data.append('collegeId', collegeIdFile)
      }

      await completeProfile(data)
      toast.success('Profile submitted for verification')
      navigate('/verification-pending')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-50px)] flex items-center justify-center bg-lc-layer-1 py-8">
      <div className="w-full max-w-[500px] px-4">
        <div className="text-center mb-6">
          <h1 className="text-[22px] font-semibold text-lc-text-primary">Complete Your Profile</h1>
          <p className="text-sm text-lc-text-secondary mt-2">
            Please fill in your details to verify your student account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-lc-layer-2 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[13px] text-lc-text-secondary mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
                className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2.5 text-[14px] text-lc-text-primary placeholder-lc-text-tertiary focus:outline-none focus:border-lc-accent transition-colors"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[13px] text-lc-text-secondary mb-1.5">
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                pattern="^[a-zA-Z0-9_]+$"
                minLength={3}
                maxLength={20}
                placeholder="Choose a username"
                className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2.5 text-[14px] text-lc-text-primary placeholder-lc-text-tertiary focus:outline-none focus:border-lc-accent transition-colors"
              />
            </div>
          </div>

          {/* GitHub URL - REQUIRED */}
          <div>
            <label className="block text-[13px] text-lc-text-secondary mb-1.5">
              GitHub Profile URL * <span className="text-yellow-500">(Required)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-lc-text-tertiary" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
                </svg>
              </div>
              <input
                type="url"
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleChange}
                required
                placeholder="https://github.com/yourusername"
                className="w-full bg-lc-layer-3 border border-lc-border rounded pl-10 pr-3 py-2.5 text-[14px] text-lc-text-primary placeholder-lc-text-tertiary focus:outline-none focus:border-lc-accent transition-colors"
              />
            </div>
            <p className="text-[11px] text-yellow-500/80 mt-1">
              ⚠️ You must upload your code solutions to GitHub daily after each submission
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] text-lc-text-secondary mb-1.5">
                Roll Number *
              </label>
              <input
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                required
                placeholder="e.g., 2021CS001"
                className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2.5 text-[14px] text-lc-text-primary placeholder-lc-text-tertiary focus:outline-none focus:border-lc-accent transition-colors"
              />
            </div>

            <div>
              <label className="block text-[13px] text-lc-text-secondary mb-1.5">
                Contact Phone *
              </label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                required
                placeholder="e.g., 9876543210"
                className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2.5 text-[14px] text-lc-text-primary placeholder-lc-text-tertiary focus:outline-none focus:border-lc-accent transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] text-lc-text-secondary mb-1.5">
              College Name *
            </label>
            <input
              type="text"
              name="college"
              value={formData.college}
              readOnly
              disabled
              className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2.5 text-[14px] text-lc-text-secondary cursor-not-allowed opacity-70"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[13px] text-lc-text-secondary mb-1.5">
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                title="Select your department"
                className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2.5 text-[14px] text-lc-text-primary focus:outline-none focus:border-lc-accent transition-colors"
              >
                <option value="">Select</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
                <option value="other">Other</option>
              </select>
              {formData.department === 'other' && (
                <input
                  type="text"
                  name="department"
                  placeholder="Enter department"
                  onChange={handleChange}
                  className="w-full mt-2 bg-lc-layer-3 border border-lc-border rounded px-3 py-2 text-[14px] text-lc-text-primary focus:outline-none focus:border-lc-accent"
                />
              )}
            </div>

            <div>
              <label className="block text-[13px] text-lc-text-secondary mb-1.5">
                Year *
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
                title="Select your year"
                className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2.5 text-[14px] text-lc-text-primary focus:outline-none focus:border-lc-accent transition-colors"
              >
                <option value="">Select</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] text-lc-text-secondary mb-1.5">
                Division *
              </label>
              <select
                name="division"
                value={formData.division}
                onChange={handleChange}
                required
                title="Select your division"
                className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2.5 text-[14px] text-lc-text-primary focus:outline-none focus:border-lc-accent transition-colors"
              >
                <option value="">Select</option>
                {divisions.map((div) => (
                  <option key={div} value={div}>{div}</option>
                ))}
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[13px] text-lc-text-secondary mb-1.5">
              College ID Card (Photo) *
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              required
              className="w-full bg-lc-layer-3 border border-lc-border rounded px-3 py-2.5 text-[14px] text-lc-text-primary file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-lc-accent file:text-white hover:file:bg-lc-accent/80"
            />
            <p className="text-[11px] text-lc-text-tertiary mt-1">
              Upload a clear photo of your college ID card (JPG, PNG, or PDF, max 5MB)
            </p>
          </div>

          <div className="bg-lc-layer-1 rounded p-3 mt-4">
            <p className="text-[12px] text-lc-text-tertiary">
              <span className="text-yellow-500">⚠️</span> Your account will be verified by your class coordinator. 
              This usually takes 24-48 hours. You'll receive access to all features once verified.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-lc-green hover:bg-lc-green/90 text-white py-2.5 rounded text-[14px] font-medium transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </form>
      </div>
    </div>
  )
}
