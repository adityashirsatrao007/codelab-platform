import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { Calendar, Search, ChevronRight, CheckCircle2, FileText, Trophy } from 'lucide-react'

interface Problem {
  id: string
  frontendId?: number
  title: string
  slug: string
  difficulty: string
  category: string
  acceptedCount: number
  solved: boolean
}

export default function Problems() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [category, setCategory] = useState('')
  const [company, setCompany] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [companies, setCompanies] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchProblems()
    fetchCategories()
    fetchCompanies()
  }, [difficulty, category, company, page])

  const fetchProblems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (difficulty) params.append('difficulty', difficulty)
      if (category) params.append('category', category)
      if (company) params.append('company', company)
      if (search) params.append('search', search)
      params.append('page', page.toString())
      params.append('limit', '50')

      const response = await api.get(`/problems?${params}`)
      // Handle both old (array) and new (paginated) response formats for robustness
      const data = response.data;
      if (Array.isArray(data)) {
         setProblems(data);
         setTotalPages(1);
      } else {
         setProblems(data.problems || []);
         setTotalPages(data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch problems:', error)
    } finally {
      setLoading(false)
    }
  }

  // ... (fetchCategories, fetchCompanies, handleSearch remain same)
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/problems/meta/categories')
      setCategories(response.data.filter((c: string) => c !== 'premium')) 
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/problems/meta/companies')
      setCompanies(response.data)
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1) // Reset to page 1 on search
    fetchProblems()
  }

  if (loading && page === 1 && problems.length === 0) { // Only show full loader on initial load
    return (
      <div className="min-h-[calc(100vh-50px)] flex items-center justify-center bg-lc-layer-1">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-lc-fill-3 border-t-lc-accent"></div>
      </div>
    )
  }

  // Mock Calendar Data
  const currentDays = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="bg-lc-layer-1 min-h-screen pb-10">
      <div className="max-w-[1240px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Content (Left) */}
        <div className="lg:col-span-3">
          
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex-1 flex gap-3">
                <div className="relative group">
                <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                    className="appearance-none bg-lc-layer-2 hover:bg-lc-layer-3 text-lc-text-primary px-4 py-1.5 pr-8 rounded-full text-[14px] focus:outline-none cursor-pointer transition-colors"
                >
                    <option value="">All Topics</option>
                    {categories.map((cat) => (
                    <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                    </option>
                    ))}
                </select>
                <ChevronRight className="w-3.5 h-3.5 text-lc-text-secondary absolute right-3 top-1/2 -translate-y-1/2 rotate-90" />
                </div>

                <div className="relative group">
                <select
                    value={difficulty}
                    onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
                     className="appearance-none bg-lc-layer-2 hover:bg-lc-layer-3 text-lc-text-primary px-4 py-1.5 pr-8 rounded-full text-[14px] focus:outline-none cursor-pointer transition-colors"
                >
                    <option value="">Difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>
                <ChevronRight className="w-3.5 h-3.5 text-lc-text-secondary absolute right-3 top-1/2 -translate-y-1/2 rotate-90" />
                </div>

                <div className="relative group">
                <select
                    value={company}
                    onChange={(e) => { setCompany(e.target.value); setPage(1); }}
                    className="appearance-none bg-lc-layer-2 hover:bg-lc-layer-3 text-lc-text-primary px-4 py-1.5 pr-8 rounded-full text-[14px] focus:outline-none cursor-pointer transition-colors"
                >
                    <option value="">Companies</option>
                    {companies.map((comp) => (
                    <option key={comp} value={comp}>
                        {comp}
                    </option>
                    ))}
                </select>
                <ChevronRight className="w-3.5 h-3.5 text-lc-text-secondary absolute right-3 top-1/2 -translate-y-1/2 rotate-90" />
                </div>
            </div>

            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-lc-text-tertiary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="bg-lc-layer-2 hover:bg-lc-layer-3 focus:bg-transparent border border-transparent focus:border-lc-text-tertiary rounded-full pl-9 pr-4 py-1.5 text-[14px] text-lc-text-primary placeholder-lc-text-tertiary focus:outline-none w-[200px] transition-colors"
              />
            </form>
          </div>

          {/* Table */}
          <div className="overflow-hidden bg-lc-layer-1 rounded-lg">
             {loading && page > 1 && (
                <div className="w-full h-1 bg-lc-layer-2 overflow-hidden mb-2">
                    <div className="h-full bg-lc-accent animate-progress"></div>
                </div>
             )}
            <table className="w-full">
              <thead>
                <tr className="border-b border-lc-border text-left text-[12px] uppercase tracking-wide text-lc-text-tertiary">
                  <th className="px-4 py-3 font-medium w-[50px]">Status</th>
                  <th className="px-4 py-3 font-medium w-[50px]">#</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  {/* Solution col is usually icon only */}
                  <th className="px-4 py-3 font-medium w-[100px]">Solution</th> 
                  <th className="px-4 py-3 font-medium w-[120px]">Acceptance</th>
                  <th className="px-4 py-3 font-medium w-[100px]">Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {problems.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-lc-text-tertiary text-[14px]">
                      No problems found
                    </td>
                  </tr>
                ) : (
                  (problems || []).map((problem, index) => (
                    <tr
                      key={problem.id}
                      className={`${index % 2 === 1 ? 'bg-lc-layer-2/30' : ''} hover:bg-lc-layer-2 transition-colors group`}
                    >
                      <td className="px-4 py-3.5">
                        {problem.solved ? (
                          <CheckCircle2 className="w-[18px] h-[18px] text-lc-green" />
                        ) : (
                           // Empty circle outline on hover? Or just blank
                           <div className="w-[18px] h-[18px]" />
                        )}
                      </td>
                       <td className="px-4 py-3.5 text-lc-text-secondary text-[14px]">
                        {problem.frontendId || index + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          to={`/problems/${problem.slug}`}
                          className="text-lc-text-primary hover:text-blue-500 transition-colors text-[14px] font-medium block truncate max-w-[300px]"
                        >
                          {problem.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                          {/* Fake solution icon availability */}
                          {index % 3 === 0 && <FileText className="w-4 h-4 text-lc-text-tertiary hover:text-lc-text-primary cursor-pointer" />}
                      </td>
                      <td className="px-4 py-3.5 text-lc-text-secondary text-[14px]">
                        {(Math.random() * 40 + 30).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[13px] font-medium difficulty-${problem.difficulty}`}>
                          {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8"> 
                <div className="text-sm text-lc-text-tertiary">
                    Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="w-8 h-8 flex items-center justify-center rounded bg-lc-layer-2 text-lc-text-secondary hover:bg-lc-layer-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                    
                    {/* Simplified Page Numbers Logic - Only show current, prev, next, first, last logic can be complex. 
                        For now, let's show simple Previous / Next and maybe a few numbers around current.
                    */}
                    {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                        // Logic to center current page
                        let p = page;
                        if (totalPages <= 5) p = i + 1;
                        else if (page <= 3) p = i + 1;
                        else if (page >= totalPages - 2) p = totalPages - 4 + i;
                        else p = page - 2 + i;

                        return (
                            <button 
                                key={p}
                                onClick={() => handlePageChange(p)}
                                className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                                    page === p 
                                    ? 'bg-lc-fill-3 text-lc-text-primary' 
                                    : 'hover:bg-lc-layer-2 text-lc-text-secondary'
                                }`}
                            >
                                {p}
                            </button>
                        )
                    })}

                    <button 
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                        className="w-8 h-8 flex items-center justify-center rounded bg-lc-layer-2 text-lc-text-secondary hover:bg-lc-layer-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
          )}
        </div>

        {/* Sidebar (Right) */}
        <div className="hidden lg:flex flex-col gap-6">
          
          {/* Daily Question */}
          <div className="bg-lc-layer-2 rounded-lg p-4 shadow-sm border border-lc-border">
              <div className="flex justify-between items-start mb-2">
                  <div>
                      <h3 className="text-[15px] font-semibold text-lc-text-primary mb-1">Daily Challenge</h3>
                      <div className="text-xs text-lc-text-tertiary">Solve to earn 10 coins</div>
                  </div>
                  <img src="https://assets.leetcode.com/static_assets/public/images/badges/2024/gif/2024-02.gif" className="w-12 h-12" alt="medal" onError={e => e.currentTarget.style.display='none'} />
              </div>
              <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                      <span className="text-lc-text-secondary">Problem of the Day</span>
                      <span className="text-lc-easy font-medium">Easy</span>
                  </div>
                  <Link to="/problems/two-sum" className="text-[14px] text-lc-text-primary hover:text-blue-500 font-medium truncate block">
                      1. Two Sum
                  </Link>
              </div>
          </div>

          {/* Calendar Widget */}
          <div className="bg-lc-layer-2 rounded-lg p-4 shadow-sm border border-lc-border">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-lc-text-primary font-medium text-[15px] flex items-center gap-2">
                 <Calendar className="w-4 h-4 text-lc-brand-orange" />
                 Day {new Date().getDate()}
               </h3>
               <div className="flex items-center text-xs text-lc-text-tertiary gap-1">
                 <Trophy className="w-3 h-3 text-lc-accent" /> <span className="text-lc-text-secondary font-medium">0</span>
               </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['S','M','T','W','T','F','S'].map((d, i) => (
                    <span key={`${d}-${i}`} className="text-[11px] text-lc-text-tertiary mb-1">{d}</span>
                ))}
                {currentDays.slice(0, 31).map((day) => { // show 31 days grid roughly
                    const isToday = day === new Date().getDate();
                    // Mock some solved days
                    const isSolved = [2, 5, 10, 12].includes(day);
                    return (
                        <div 
                            key={day} 
                            className={`text-[11px] h-6 flex items-center justify-center rounded cursor-pointer relative
                                ${isToday ? 'text-lc-text-primary font-bold' : 'text-lc-text-secondary hover:bg-lc-layer-3'}
                            `}
                        >
                            {isToday && <div className="absolute inset-0 border border-lc-text-tertiary rounded opacity-50"></div>}
                            {isSolved && <div className="absolute bottom-1 w-1 h-1 bg-lc-green rounded-full"></div>}
                            {day}
                        </div>
                    )
                })}
            </div>
             <div className="border-t border-lc-border pt-3 mt-1 flex justify-between items-center">
                 <span className="text-xs text-lc-text-tertiary">Check in for 30 days to win badge</span>
             </div>
          </div>
          
           {/* Trending Companies */}
           <div className="bg-lc-layer-2 rounded-lg p-4 shadow-sm border border-lc-border">
             <div className="flex justify-between items-center mb-3">
                 <h3 className="text-[14px] font-medium text-lc-text-secondary">Trending Companies</h3>
             </div>
             <div className="flex flex-wrap gap-2">
                {(companies.length > 0 ? companies.slice(0, 15) : ['Google', 'Facebook', 'Amazon', 'Microsoft', 'Apple']).map(c => (
                    <button 
                        key={c}
                        onClick={() => setCompany(c === company ? '' : c)}
                        className={`px-2.5 py-1 rounded-full text-[11px] cursor-pointer transition-colors ${
                            company === c 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-lc-fill-3 hover:bg-lc-fill-4 text-lc-text-secondary'
                        }`}
                    >
                        {c}
                    </button>
                ))}
             </div>
           </div>

        </div>
      </div>
    </div>
  )
}
