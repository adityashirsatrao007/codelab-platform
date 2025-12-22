import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Layout from './components/Layout'
import Home from './pages/Home'
import Problems from './pages/Problems'
import ProblemDetail from './pages/ProblemDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import Submissions from './pages/Submissions'
import CompleteProfile from './pages/CompleteProfile'
import VerificationPending from './pages/VerificationPending'
import Contests from './pages/Contests'
import ContestDetail from './pages/ContestDetail'
import Discussions from './pages/Discussions'
import Assignments from './pages/Assignments'
import AssignmentDetail from './pages/AssignmentDetail'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminVerifications from './pages/admin/Verifications'
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherAssignments from './pages/teacher/Assignments'
import TeacherAssignmentDetail from './pages/teacher/AssignmentDetail'
import { useAuthStore } from './lib/store'

// Protected route wrapper
function ProtectedRoute({ children, requireVerified = true, allowedRoles }: { 
  children: React.ReactNode
  requireVerified?: boolean
  allowedRoles?: string[]
}) {
  const { user, isLoading, needsProfileCompletion, needsVerification } = useAuthStore()

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-lc-layer-1">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-lc-accent"></div>
    </div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (needsProfileCompletion && user.role === 'student') {
    return <Navigate to="/complete-profile" replace />
  }

  if (requireVerified && needsVerification && user.role === 'student') {
    return <Navigate to="/verification-pending" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// Google Client ID - should be from environment variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

if (!GOOGLE_CLIENT_ID) {
  console.warn('Missing VITE_GOOGLE_CLIENT_ID environment variable. Google Login will not work.')
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid #334155',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="problems" element={<Problems />} />
            <Route path="problems/:slug" element={
              <ProtectedRoute>
                <ProblemDetail />
              </ProtectedRoute>
            } />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="complete-profile" element={<CompleteProfile />} />
            <Route path="verification-pending" element={<VerificationPending />} />
            <Route path="profile/:username" element={<Profile />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="submissions" element={
              <ProtectedRoute>
                <Submissions />
              </ProtectedRoute>
            } />
            
            {/* Contest Routes */}
            <Route path="contests" element={<Contests />} />
            <Route path="contests/:contestId" element={
              <ProtectedRoute>
                <ContestDetail />
              </ProtectedRoute>
            } />

            {/* Discussion Routes */}
            <Route path="discuss" element={<Discussions />} />
            <Route path="discuss/:id" element={
               // Detail page not created yet but using Placeholder or same list for now
               // I should create Detail page later. For now just list.
               <Discussions /> 
            } />
            
            {/* Assignment Routes (Students) */}
            <Route path="assignments" element={
              <ProtectedRoute>
                <Assignments />
              </ProtectedRoute>
            } />
            <Route path="assignments/:assignmentId" element={
              <ProtectedRoute>
                <AssignmentDetail />
              </ProtectedRoute>
            } />

            {/* Teacher Routes */}
            <Route path="teacher" element={
              <ProtectedRoute allowedRoles={['teacher', 'admin', 'superadmin']}>
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            <Route path="teacher/assignments" element={
              <ProtectedRoute allowedRoles={['teacher', 'admin', 'superadmin']}>
                <TeacherAssignments />
              </ProtectedRoute>
            } />
            <Route path="teacher/assignments/:assignmentId" element={
              <ProtectedRoute allowedRoles={['teacher', 'admin', 'superadmin']}>
                <TeacherAssignmentDetail />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="admin" element={
              <ProtectedRoute allowedRoles={['coordinator', 'admin', 'superadmin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="admin/users" element={
              <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="admin/verifications" element={
              <ProtectedRoute allowedRoles={['coordinator', 'admin', 'superadmin']}>
                <AdminVerifications />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}

export default App
