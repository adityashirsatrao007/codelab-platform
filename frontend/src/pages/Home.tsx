import { Link } from 'react-router-dom'
import { useAuthStore } from '../lib/store'

export default function Home() {
  const { user } = useAuthStore()

  return (
    <div className="min-h-[calc(100vh-50px)] flex flex-col">
      {/* Hero Section - Clean and minimal */}
      <section className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-semibold text-lc-text-primary mb-4 tracking-tight">
            A New Way to Learn
          </h1>
          <p className="text-lg text-lc-text-secondary mb-8 leading-relaxed">
            CodeLab is the best platform to help you enhance your skills, expand your knowledge and prepare for technical interviews.
          </p>
          <div className="flex items-center justify-center gap-3">
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="bg-lc-accent hover:bg-lc-accent/90 text-lc-layer-1 px-6 py-2.5 rounded-lg text-[15px] font-medium transition-colors"
                >
                  Create Account
                </Link>
                <Link
                  to="/problems"
                  className="bg-lc-fill-3 hover:bg-lc-fill-4 text-lc-text-primary px-6 py-2.5 rounded-lg text-[15px] font-medium transition-colors"
                >
                  Explore Problems
                </Link>
              </>
            ) : (
              <Link
                to="/problems"
                className="bg-lc-accent hover:bg-lc-accent/90 text-lc-layer-1 px-6 py-2.5 rounded-lg text-[15px] font-medium transition-colors"
              >
                Start Solving
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section - Subtle */}
      <section className="border-t border-lc-border bg-lc-layer-2 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-semibold text-lc-text-primary mb-1">50+</div>
              <div className="text-sm text-lc-text-tertiary">Problems</div>
            </div>
            <div>
              <div className="text-3xl font-semibold text-lc-text-primary mb-1">3</div>
              <div className="text-sm text-lc-text-tertiary">Languages</div>
            </div>
            <div>
              <div className="text-3xl font-semibold text-lc-text-primary mb-1">∞</div>
              <div className="text-sm text-lc-text-tertiary">Practice</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Simple list */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold text-lc-text-primary mb-8 text-center">
            Start your coding journey
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: 'Practice Problems', desc: 'Curated problems from easy to hard' },
              { title: 'Instant Feedback', desc: 'Run code and see results immediately' },
              { title: 'Track Progress', desc: 'Monitor your improvement over time' },
              { title: 'Compete', desc: 'See how you rank on the leaderboard' },
            ].map((feature, i) => (
              <div key={i} className="bg-lc-layer-2 border border-lc-border rounded-lg p-4">
                <h3 className="text-[15px] font-medium text-lc-text-primary mb-1">{feature.title}</h3>
                <p className="text-[13px] text-lc-text-tertiary">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-lc-border py-6">
        <div className="text-center text-[13px] text-lc-text-tertiary">
          © {new Date().getFullYear()} CodeLab
        </div>
      </footer>
    </div>
  )
}
