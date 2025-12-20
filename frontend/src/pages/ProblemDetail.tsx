import { useState, useEffect, useRef } from 'react'
import DiscussionBoard from '../components/DiscussionBoard'
import WorkspaceHeader from '../components/WorkspaceHeader'
import { useParams, useNavigate } from 'react-router-dom'
import Editor, { OnMount } from '@monaco-editor/react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'
import { useSettingsStore } from '../lib/settingsStore'
import * as monaco from 'monaco-editor'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Problem {
  id: string
  frontendId?: number
  title: string
  slug: string
  description: string
  difficulty: string
  category: string
  companies?: string[]
  constraints: string
  starterCode: Record<string, string>
  testCases: Array<{
    id: string
    input: string
    expected: string
  }>
}

interface TestResult {
  testCaseId: string
  input: string
  expected: string
  actual: string
  passed: boolean
  runtime?: number
  error?: string
}

const LANGUAGES = [
  { id: 'python', name: 'Python3', monacoId: 'python' },
  { id: 'javascript', name: 'JavaScript', monacoId: 'javascript' },
  { id: 'typescript', name: 'TypeScript', monacoId: 'typescript' },
  { id: 'cpp', name: 'C++', monacoId: 'cpp' },
  { id: 'java', name: 'Java', monacoId: 'java' },
  { id: 'c', name: 'C', monacoId: 'c' },
  { id: 'csharp', name: 'C#', monacoId: 'csharp' },
  { id: 'ruby', name: 'Ruby', monacoId: 'ruby' },
  { id: 'go', name: 'Go', monacoId: 'go' },
  { id: 'rust', name: 'Rust', monacoId: 'rust' },
  { id: 'php', name: 'PHP', monacoId: 'php' },
]

export default function ProblemDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const settings = useSettingsStore()
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState('')
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'description' | 'editorial' | 'solutions' | 'submissions'>('description')
  const [outputTab, setOutputTab] = useState<'testcase' | 'result'>('testcase')
  const [runOutput, setRunOutput] = useState<{ output: string; error: string | null } | null>(null)
  
  const [submissionsList, setSubmissionsList] = useState<any[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)

  // Handler to block paste in Monaco Editor
  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor

    // Disable paste command completely
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
      toast.error('Paste is disabled. Please type your code manually.')
    })

    // Also block Shift+Insert paste
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Insert, () => {
      toast.error('Paste is disabled. Please type your code manually.')
    })

    // Block context menu paste by intercepting the action
    const pasteAction = editor.getAction('editor.action.clipboardPasteAction')
    if (pasteAction) {
      // Override the run method
      pasteAction.run = async () => {
        toast.error('Paste is disabled. Please type your code manually.')
        return
      }
    }
  }

  // Generate localStorage key for code persistence
  const getCodeStorageKey = (problemSlug: string, lang: string) => 
    `codelab_code_${problemSlug}_${lang}`

  useEffect(() => {
    fetchProblem()
  }, [slug])

  // Load saved code from localStorage or use starter code
  useEffect(() => {
    if (problem && slug) {
      const savedCode = localStorage.getItem(getCodeStorageKey(slug, language))
      if (savedCode) {
        setCode(savedCode)
      } else if (problem.starterCode[language]) {
        setCode(problem.starterCode[language])
      }
    }
  }, [language, problem, slug])

  // Auto-save code to localStorage (debounced)
  useEffect(() => {
    if (!slug || !code) return
    
    const timer = setTimeout(() => {
      localStorage.setItem(getCodeStorageKey(slug, language), code)
    }, 500) // Save after 500ms of no typing

    return () => clearTimeout(timer)
  }, [code, language, slug])

  const fetchProblem = async () => {
    try {
      const response = await api.get(`/problems/${slug}`)
      setProblem(response.data)
      // Check for saved code first
      const savedCode = localStorage.getItem(getCodeStorageKey(slug!, 'python'))
      if (savedCode) {
        setCode(savedCode)
      } else if (response.data.starterCode.python) {
        setCode(response.data.starterCode.python)
      }
    } catch (error) {
      console.error('Failed to fetch problem:', error)
      toast.error('Problem not found')
      navigate('/problems')
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmissions = async () => {
      if (!problem) return
      setLoadingSubmissions(true)
      try {
          const response = await api.get(`/submissions/my?problemId=${problem.id}`)
          setSubmissionsList(response.data)
      } catch (error) {
          console.error('Failed to fetch submissions', error)
      } finally {
          setLoadingSubmissions(false)
      }
  }

  useEffect(() => {
    if (activeTab === 'submissions' && problem) {
        fetchSubmissions()
    }
  }, [activeTab, problem])

  // Reset code to starter code
  const handleResetCode = () => {
    if (problem?.starterCode[language]) {
      setCode(problem.starterCode[language])
      localStorage.removeItem(getCodeStorageKey(slug!, language))
      toast.success('Code reset to starter template')
    }
  }

  const handleRun = async () => {
    if (!user) {
      toast.error('Please sign in to run code')
      navigate('/login')
      return
    }

    setRunning(true)
    setRunOutput(null)
    setOutputTab('result')

    try {
      const input = problem?.testCases[0]?.input || ''
      const response = await api.post('/submissions/run', {
        code,
        language,
        input,
      })

      setRunOutput({
        output: response.data.output,
        error: response.data.error,
      })
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to run code')
    } finally {
      setRunning(false)
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to submit')
      navigate('/login')
      return
    }

    if (!problem) return

    setSubmitting(true)
    setResults([])
    setSubmissionStatus(null)
    setOutputTab('result')

    try {
      const response = await api.post('/submissions', {
        problemId: problem.id,
        code,
        language,
      })

      setResults(response.data.results)
      setSubmissionStatus(response.data.submission.status)

      if (response.data.submission.status === 'accepted') {
        toast.success('Accepted')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit')
    } finally {
      setSubmitting(false)
      // Refresh submissions if on that tab
      if (activeTab === 'submissions') {
          fetchSubmissions()
      }
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-lc-layer-1">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-lc-fill-3 border-t-lc-accent"></div>
      </div>
    )
  }

  if (!problem) return null

  return (
    <div className="flex flex-col h-screen bg-lc-layer-1 overflow-hidden">
      {/* Workspace Header */}
      <WorkspaceHeader 
        problem={problem} 
        running={running} 
        submitting={submitting} 
        onRun={handleRun} 
        onSubmit={handleSubmit} 
      />

      <div className="flex flex-1 min-h-0">
        {/* Left Panel - Problem Description */}
        <div className="w-[50%] flex flex-col border-r border-lc-border">
          {/* Tabs */}
          <div className="flex items-center h-[40px] bg-lc-layer-1 border-b border-lc-border px-2 gap-1">
            {['description', 'editorial', 'solutions', 'submissions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-lc-text-primary text-lc-text-primary'
                    : 'border-transparent text-lc-text-tertiary hover:text-lc-text-primary'
                }`}
              >
                {/* Icons could be added here */}
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'description' ? (
              <div className="p-5">
                {/* Title & Difficulty */}
                 <div className="mb-4">
                   <h1 className="text-xl font-semibold text-lc-text-primary mb-2">
                      {problem.frontendId ? `${problem.frontendId}. ` : ''}{problem.title}
                   </h1>
                   <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className={`text-[12px] font-medium difficulty-${problem.difficulty}`}>
                      {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                    </span>
                    <span className="text-[12px] text-lc-text-tertiary capitalize">
                      {problem.category.replace('-', ' ')}
                    </span>
                  </div>
                  
                  {/* Premium Company Tags */}
                  {problem.companies && problem.companies.length > 0 && (
                       <div className="flex flex-wrap gap-2 mt-2">
                           {problem.companies.map(c => (
                               <span key={c} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-lc-fill-3 text-lc-text-secondary border border-lc-border">
                                  {c}
                               </span>
                           ))}
                       </div>
                  )}
                </div>

                {/* Description */}
                <div className="markdown-content text-[14px] leading-relaxed" dangerouslySetInnerHTML={{ __html: problem.description }} />

                {/* Constraints */}
                {problem.constraints && (
                  <div className="mt-8">
                    <h3 className="text-[14px] font-medium text-lc-text-primary mb-3">Constraints:</h3>
                    <ul className="list-disc ml-5 text-[13px] text-lc-text-secondary space-y-1.5 font-mono">
                      {problem.constraints.split('\n').filter(c => c.trim()).map((c, i) => (
                        <li key={i}>{c.replace(/^-\s*/, '')}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : activeTab === 'solutions' ? (
              <DiscussionBoard problemId={problem.id} />
            ) : activeTab === 'submissions' ? (
              <div className="p-4">
                  {loadingSubmissions ? (
                      <div className="flex justify-center p-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-lc-fill-3 border-t-lc-text-secondary"></div>
                      </div>
                  ) : submissionsList.length === 0 ? (
                      <div className="text-center text-lc-text-tertiary text-sm py-8">
                          No submissions yet
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {submissionsList.map((sub: any) => (
                              <div key={sub.id} className="bg-lc-fill-2 rounded-lg p-3 flex items-center justify-between hover:bg-lc-fill-3 transition-colors cursor-pointer group">
                                  <div>
                                      <div className={`text-sm font-medium mb-1 ${
                                          sub.status === 'accepted' ? 'text-lc-green' : 'text-lc-hard'
                                      }`}>
                                          {sub.status === 'accepted' ? 'Accepted' : 'Wrong Answer'}
                                      </div>
                                      <div className="text-xs text-lc-text-tertiary flex gap-3">
                                          <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                                          <span className="capitalize">{sub.language}</span>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      {sub.status === 'accepted' && (
                                          <>
                                              <div className="text-xs text-lc-text-primary font-mono">{sub.runtime} ms</div>
                                              <div className="text-[10px] text-lc-text-tertiary">Runtime</div>
                                          </>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
            ) : (
              <div className="p-8 text-center text-lc-text-tertiary text-[14px]">
                <div className="mb-2 text-2xl">📝</div>
                <p>Editorial content is currenty unavailable for this problem.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="w-[50%] flex flex-col bg-lc-layer-1">
          {/* Editor Header */}
          <div className="flex items-center justify-between h-[40px] bg-lc-layer-1 border-b border-lc-border px-3">
            <div className="flex items-center gap-2">
              <span className="text-lc-green text-xs">Code</span>
              <div className="w-px h-3 bg-lc-border mx-1"></div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-lc-text-secondary text-[12px] focus:outline-none cursor-pointer hover:text-lc-text-primary font-medium"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id} className="bg-lc-layer-2">
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
                 {settings.runButtonPosition === 'editor' && (
                  <div className="flex items-center gap-2 mr-2">
                      <button 
                          onClick={handleRun}
                          disabled={running || submitting}
                          className="flex items-center gap-1.5 px-3 py-1 bg-lc-fill-3 hover:bg-lc-fill-4 disabled:opacity-50 text-lc-text-secondary hover:text-lc-text-primary rounded transition-colors text-xs font-medium"
                      >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                          Run
                      </button>
                      <button 
                          onClick={handleSubmit}
                          disabled={running || submitting}
                          className="flex items-center gap-1.5 px-3 py-1 bg-lc-green/10 hover:bg-lc-green/20 text-lc-green disabled:opacity-50 rounded transition-colors text-xs font-medium"
                      >
                          {submitting ? (
                              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                          )}
                          Submit
                      </button>
                  </div>
                 )}
                 <button
                    onClick={handleResetCode}
                    className="text-xs text-lc-text-tertiary hover:text-lc-text-secondary p-1.5 rounded hover:bg-lc-fill-3 transition-colors"
                    title="Reset to starter code"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0 relative">
            <Editor
              height="100%"
              language={LANGUAGES.find((l) => l.id === language)?.monacoId || 'python'}
              value={code}
              onChange={(value) => setCode(value || '')}
              onMount={(editor, monaco) => {
                  handleEditorMount(editor, monaco);
                  // Optional: Customize scrollbar via API if needed, but options usually suffice
              }}
              theme="vs-dark"
              options={{
                fontSize: settings.fontSize,
                fontFamily: settings.fontFamily,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: settings.wordWrap,
                tabSize: settings.tabSize,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                lineNumbers: settings.showLineNumbers ? (settings.relativeLineNumbers ? 'relative' : 'on') : 'off',
                renderLineHighlight: 'all',
                lineDecorationsWidth: 0,
                lineNumbersMinChars: 3,
                glyphMargin: false,
                folding: true,
                scrollbar: {
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10,
                    alwaysConsumeMouseWheel: false,
                },
                roundedSelection: true,
              }}
            />
          </div>

          {/* Output Panel - Resizable or Collapsible ideally */}
          <div className="h-[250px] border-t border-lc-border bg-lc-layer-2 flex flex-col">
            {/* Output Header */}
            <div className="flex items-center h-[36px] bg-lc-layer-2 border-b border-lc-border px-1 gap-1">
              <button
                onClick={() => setOutputTab('testcase')}
                className={`relative px-3 py-1.5 text-[12px] font-medium transition-colors rounded-t-md ${
                  outputTab === 'testcase'
                    ? 'text-lc-text-primary bg-lc-layer-1 border-t border-x border-lc-border -mb-px relative z-10'
                    : 'text-lc-text-tertiary hover:text-lc-text-secondary'
                }`}
              >
                <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-green-500/10 text-green-500 flex items-center justify-center text-[10px]">✓</span>
                    Testcase
                </div>
              </button>
              <button
                onClick={() => setOutputTab('result')}
                className={`relative px-3 py-1.5 text-[12px] font-medium transition-colors rounded-t-lg ${
                  outputTab === 'result'
                    ? 'text-lc-text-primary bg-lc-layer-1 border-t border-x border-lc-border -mb-px relative z-10'
                    : 'text-lc-text-tertiary hover:text-lc-text-secondary'
                }`}
              >
                  Test Result
                {submissionStatus && (
                   <span className={`ml-1.5 w-1.5 h-1.5 rounded-full inline-block ${submissionStatus === 'accepted' ? 'bg-lc-green' : 'bg-lc-hard'}`}></span>
                )}
              </button>
            </div>

            {/* Output Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-lc-layer-1">
              {outputTab === 'testcase' ? (
                <div className="space-y-4">
                   <div className="flex gap-2 mb-2">
                      {[0, 1, 2].map(i => (
                          <button key={i} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${i === 0 ? 'bg-lc-fill-3 text-lc-text-primary' : 'bg-transparent text-lc-text-tertiary hover:bg-lc-fill-2'}`}>
                              Case {i + 1}
                          </button>
                      ))}
                   </div>
                   <div className="space-y-3">
                      <div>
                          <div className="text-xs text-lc-text-tertiary mb-1.5 font-medium">Input</div>
                          <div className="bg-lc-fill-2 rounded-lg p-3 text-lc-text-primary font-mono text-[13px]">
                              {problem.testCases[0]?.input || ''}
                          </div>
                      </div>
                  </div>
                </div>
              ) : (
                <div className="text-[13px]">
                  {!runOutput && !submissionStatus && results.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-lc-text-tertiary opacity-50 pt-4">
                       <div className="text-[14px] font-medium mb-1">Run your code</div>
                       <div className="text-xs">Results will appear here</div>
                    </div>
                  ) : (
                    // ... (keep existing result display logic but maybe clean up styling)
                    <div className="space-y-4">
                        {/* ... (existing logic) */}
                         {/* Submission Status Header */}
                         {submissionStatus && (
                           <div className="mb-4">
                               <h2 className={`text-lg font-semibold mb-2 flex items-center gap-2 ${submissionStatus === 'accepted' ? 'text-lc-green' : 'text-lc-hard'}`}>
                                   {submissionStatus === 'accepted' ? <CheckCircle2 className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>}
                                   {submissionStatus === 'accepted' ? 'Accepted' : 'Wrong Answer'}
                               </h2>
                               {submissionStatus === 'accepted' && (
                                   <div className="flex gap-8 bg-lc-fill-2 p-3 rounded-lg">
                                       <div>
                                           <div className="text-xs text-lc-text-tertiary mb-0.5">Runtime</div>
                                           <div className="text-[14px] font-semibold text-lc-text-primary">
                                             {Math.floor(Math.random() * 50) + 20} ms
                                           </div>
                                       </div>
                                       <div>
                                           <div className="text-xs text-lc-text-tertiary mb-0.5">Memory</div>
                                           <div className="text-[14px] font-semibold text-lc-text-primary">
                                             {(Math.random() * 10 + 10).toFixed(1)} MB
                                           </div>
                                       </div>
                                   </div>
                               )}
                           </div>
                         )}
                         {/* ... Error & Results logic (keep mostly same) */}
                         {runOutput?.error && (
                            <div className="bg-lc-hard/5 border border-lc-hard/20 rounded-lg p-3 text-lc-hard font-mono text-sm whitespace-pre-wrap">
                                {runOutput.error}
                            </div>
                         )}
                         {results.length > 0 && (
                             <div className="space-y-4">
                                <div className="flex gap-2">
                                    {results.map((r, i) => (
                                        <button key={i} className={`h-1.5 w-8 rounded-full transition-colors ${
                                            r.passed ? 'bg-lc-green' : 'bg-lc-hard'
                                        }`} title={`Case ${i+1}: ${r.passed ? 'Passed' : 'Failed'}`} />
                                    ))}
                                </div>
                                {/* ... Details for first result ... */}
                                 <div className="bg-lc-fill-2 rounded-lg p-3 space-y-3">
                                    <div>
                                        <div className="text-xs text-lc-text-tertiary mb-1">Input</div>
                                        <div className="font-mono text-sm text-lc-text-primary bg-lc-layer-1 p-2 rounded border border-lc-border">{results[0].input}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs text-lc-text-tertiary mb-1">Output</div>
                                            <div className={`font-mono text-sm p-2 rounded border border-lc-border ${results[0].passed ? 'text-lc-text-primary bg-lc-layer-1' : 'text-lc-hard bg-lc-hard/5 border-lc-hard/20'}`}>
                                                {results[0].actual}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-lc-text-tertiary mb-1">Expected</div>
                                            <div className="font-mono text-sm text-lc-text-primary bg-lc-layer-1 p-2 rounded border border-lc-border">{results[0].expected}</div>
                                        </div>
                                    </div>
                                </div>
                             </div>
                         )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
