import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from './api'

export interface Profile {
  fullName?: string
  college?: string
  bio?: string
  solvedCount: number
  rollNumber?: string
  department?: string
  division?: string
  year?: number
  contactPhone?: string
  collegeIdUrl?: string
  coins: number
  streaks: number
  classId?: string
  class?: {
    id: string
    name: string
    department: string
    division: string
    year: number
  }
}

export interface User {
  id: string
  email: string
  username?: string
  role: 'student' | 'teacher' | 'coordinator' | 'admin' | 'superadmin'
  isVerified: boolean
  verificationStatus: 'pending' | 'approved' | 'rejected'
  avatarUrl?: string
  profile?: Profile
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  needsProfileCompletion: boolean
  needsVerification: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    username: string
    password: string
    fullName?: string
    college?: string
  }) => Promise<void>
  googleLogin: (credential: string) => Promise<void>
  completeProfile: (data: FormData) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  checkVerificationStatus: () => Promise<{ isVerified: boolean; verificationStatus: string; rejectionReason?: string }>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      needsProfileCompletion: false,
      needsVerification: false,

      login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password })
        const { user, token, needsVerification } = response.data
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        set({ 
          user, 
          token, 
          needsVerification: needsVerification || false,
          needsProfileCompletion: false 
        })
      },

      register: async (data) => {
        const response = await api.post('/auth/register', data)
        const { user, token, needsVerification } = response.data
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        set({ 
          user, 
          token, 
          needsVerification: needsVerification || false,
          needsProfileCompletion: false 
        })
      },

      googleLogin: async (credential: string) => {
        const response = await api.post('/auth/google', { credential })
        const { user, token, needsProfileCompletion, needsVerification } = response.data
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        set({ 
          user, 
          token,
          needsProfileCompletion: needsProfileCompletion || false,
          needsVerification: needsVerification || false 
        })
      },

      completeProfile: async (data: FormData) => {
        const response = await api.post('/auth/complete-profile', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        const { user, token } = response.data
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        set({ 
          user, 
          token, 
          needsProfileCompletion: false,
          needsVerification: true 
        })
      },

      logout: () => {
        delete api.defaults.headers.common['Authorization']
        set({ user: null, token: null, needsProfileCompletion: false, needsVerification: false })
      },

      checkAuth: async () => {
        const token = get().token
        if (!token) {
          set({ isLoading: false })
          return
        }

        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const response = await api.get('/auth/me')
          const user = response.data
          set({ 
            user, 
            isLoading: false,
            needsProfileCompletion: user.role === 'student' && !user.profile?.rollNumber,
            needsVerification: user.role === 'student' && !user.isVerified
          })
        } catch {
          delete api.defaults.headers.common['Authorization']
          set({ user: null, token: null, isLoading: false })
        }
      },

      checkVerificationStatus: async () => {
        const response = await api.get('/auth/verification-status')
        const { isVerified, verificationStatus, rejectionReason } = response.data
        
        if (isVerified) {
          const currentUser = get().user
          if (currentUser) {
            set({ 
              user: { ...currentUser, isVerified, verificationStatus },
              needsVerification: false 
            })
          }
        }
        
        return { isVerified, verificationStatus, rejectionReason }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
)

// Helper hooks for role-based access
export const useIsAdmin = () => {
  const user = useAuthStore((state) => state.user)
  return user?.role === 'admin' || user?.role === 'superadmin'
}

export const useIsSuperAdmin = () => {
  const user = useAuthStore((state) => state.user)
  return user?.role === 'superadmin'
}

export const useIsTeacher = () => {
  const user = useAuthStore((state) => state.user)
  return user?.role === 'teacher'
}

export const useIsCoordinator = () => {
  const user = useAuthStore((state) => state.user)
  return user?.role === 'coordinator'
}

export const useIsVerified = () => {
  const user = useAuthStore((state) => state.user)
  return user?.isVerified || false
}
