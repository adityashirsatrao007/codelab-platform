import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore, useIsTeacher, useIsAdmin, useIsCoordinator } from '../lib/store'

export default function Layout() {
  const { user, logout, checkAuth, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const isTeacher = useIsTeacher()
  const isAdmin = useIsAdmin()
  const isCoordinator = useIsCoordinator()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path

  if (isLoading) {
    return (
      <div className="min-h-screen bg-lc-layer-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-lc-fill-3 border-t-lc-accent"></div>
      </div>
    )
  }

  const isWorkspace = location.pathname.startsWith('/problems/') && location.pathname.split('/').length > 2

  return (
    <div className="min-h-screen bg-lc-layer-1 flex flex-col">
      {/* Navigation - LeetCode style */}
      {!isWorkspace && (
      <nav className="bg-lc-layer-2 border-b border-lc-border h-[50px] flex items-center px-4 sticky top-0 z-50">
        <div className="flex items-center justify-between w-full max-w-[1800px] mx-auto">
          {/* Left section */}
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-lc-accent" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
              </svg>
              <span className="text-[17px] font-semibold text-lc-text-primary">CodeLab</span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/problems"
                className={`px-3 py-1.5 rounded text-[14px] transition-colors ${
                  isActive('/problems') || location.pathname.startsWith('/problems/')
                    ? 'bg-lc-fill-3 text-lc-text-primary'
                    : 'text-lc-text-secondary hover:text-lc-text-primary'
                }`}
              >
                Problems
              </Link>
              <Link
                to="/contests"
                className={`px-3 py-1.5 rounded text-[14px] transition-colors ${
                  isActive('/contests') || location.pathname.startsWith('/contests/')
                    ? 'bg-lc-fill-3 text-lc-text-primary'
                    : 'text-lc-text-secondary hover:text-lc-text-primary'
                }`}
              >
                Contests
              </Link>
              <Link
                to="/discuss"
                className={`px-3 py-1.5 rounded text-[14px] transition-colors ${
                  isActive('/discuss') || location.pathname.startsWith('/discuss/')
                    ? 'bg-lc-fill-3 text-lc-text-primary'
                    : 'text-lc-text-secondary hover:text-lc-text-primary'
                }`}
              >
                Discuss
              </Link>
              {user && user.role === 'student' && (
                <Link
                  to="/assignments"
                  className={`px-3 py-1.5 rounded text-[14px] transition-colors ${
                    isActive('/assignments') || location.pathname.startsWith('/assignments/')
                      ? 'bg-lc-fill-3 text-lc-text-primary'
                      : 'text-lc-text-secondary hover:text-lc-text-primary'
                  }`}
                >
                  Assignments
                </Link>
              )}
              <Link
                to="/leaderboard"
                className={`px-3 py-1.5 rounded text-[14px] transition-colors ${
                  isActive('/leaderboard')
                    ? 'bg-lc-fill-3 text-lc-text-primary'
                    : 'text-lc-text-secondary hover:text-lc-text-primary'
                }`}
              >
                Leaderboard
              </Link>
              {isTeacher && (
                <Link
                  to="/teacher"
                  className={`px-3 py-1.5 rounded text-[14px] transition-colors ${
                    location.pathname.startsWith('/teacher')
                      ? 'bg-lc-fill-3 text-lc-text-primary'
                      : 'text-lc-text-secondary hover:text-lc-text-primary'
                  }`}
                >
                  Teacher
                </Link>
              )}
              {(isAdmin || isCoordinator) && (
                <Link
                  to="/admin"
                  className={`px-3 py-1.5 rounded text-[14px] transition-colors ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-lc-fill-3 text-lc-text-primary'
                      : 'text-lc-text-secondary hover:text-lc-text-primary'
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <Link
                  to="/submissions"
                  className="text-lc-text-secondary hover:text-lc-text-primary text-[14px] transition-colors"
                >
                  Submissions
                </Link>
                <div className="w-px h-4 bg-lc-border"></div>
                <Link
                  to={`/profile/${user.username}`}
                  className="flex items-center space-x-2 text-lc-text-secondary hover:text-lc-text-primary transition-colors"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-lc-accent to-orange-600 rounded-full flex items-center justify-center text-xs font-medium text-white">
                    {user.username?.[0]?.toUpperCase() || '?'}
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-lc-text-tertiary hover:text-lc-text-primary transition-colors p-1"
                  title="Sign Out"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="text-lc-text-secondary hover:text-lc-text-primary text-[14px] transition-colors"
                >
                  Register
                </Link>
                <span className="text-lc-text-tertiary">or</span>
                <Link
                  to="/login"
                  className="text-lc-accent hover:text-lc-accent/80 text-[14px] transition-colors"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
