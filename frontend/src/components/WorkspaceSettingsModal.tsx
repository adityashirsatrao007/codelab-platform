import { X, Layout, Type, Keyboard } from 'lucide-react'
import { useSettingsStore } from '../lib/settingsStore'
import { useState } from 'react'

// Since we might not have a full UI library setup, I'll implement a custom modal using raw HTML/CSS classes from the project
// assuming we can use a simple overlay/modal structure. 
// Actually, looking at previous files, I don't see a `components/ui/dialog` usage.
// I will build a self-contained Modal component here to avoid dependency issues if Shadcn isn't fully installed.

interface WorkspaceSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WorkspaceSettingsModal({ isOpen, onClose }: WorkspaceSettingsModalProps) {
  const settings = useSettingsStore()
  const [activeTab, setActiveTab] = useState<'editor' | 'shortcuts' | 'layout'>('editor')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative z-50 w-[800px] h-[500px] bg-lc-layer-2 rounded-xl shadow-2xl border border-lc-border flex overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Sidebar */}
        <div className="w-[200px] bg-lc-layer-2 border-r border-lc-border flex flex-col pt-6">
            <div className="px-6 mb-6">
                <h2 className="text-lg font-semibold text-lc-text-primary">Settings</h2>
            </div>
            <nav className="flex-1 space-y-1 px-3">
                <button 
                    onClick={() => setActiveTab('layout')}
                   className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'layout' ? 'bg-lc-fill-3 text-lc-text-primary' : 'text-lc-text-secondary hover:bg-lc-fill-2 hover:text-lc-text-primary'}`}
                >
                    <Layout className="w-4 h-4" />
                    Dynamic Layout
                </button>
                <button 
                    onClick={() => setActiveTab('editor')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'editor' ? 'bg-lc-fill-3 text-lc-text-primary' : 'text-lc-text-secondary hover:bg-lc-fill-2 hover:text-lc-text-primary'}`}
                >
                    <Type className="w-4 h-4" />
                    Code Editor
                </button>
                <button 
                    onClick={() => setActiveTab('shortcuts')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'shortcuts' ? 'bg-lc-fill-3 text-lc-text-primary' : 'text-lc-text-secondary hover:bg-lc-fill-2 hover:text-lc-text-primary'}`}
                >
                    <Keyboard className="w-4 h-4" />
                    Shortcuts
                </button>
            </nav>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col bg-lc-layer-1">
            <div className="flex items-center justify-between p-6 border-b border-lc-border">
                <h3 className="text-xl font-medium text-lc-text-primary">
                    {activeTab === 'editor' && 'Code Editor'}
                    {activeTab === 'layout' && 'Dynamic Layout'}
                    {activeTab === 'shortcuts' && 'Shortcuts'}
                </h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-lc-fill-3 text-lc-text-tertiary hover:text-lc-text-primary transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {activeTab === 'editor' && (
                    <div className="space-y-6">
                         {/* Font Size */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-lc-text-primary">Font size</label>
                                <p className="text-xs text-lc-text-tertiary mt-1">Adjust the font size of the code editor</p>
                            </div>
                            <div className="relative">
                                <select 
                                    value={settings.fontSize}
                                    onChange={(e) => settings.updateSetting('fontSize', Number(e.target.value))}
                                    className="bg-lc-fill-2 border border-lc-border text-lc-text-primary text-sm rounded-md px-3 py-1.5 w-[100px] focus:outline-none focus:border-lc-accent appearance-none cursor-pointer"
                                >
                                    {[12, 13, 14, 15, 16, 17, 18, 20, 22].map(size => (
                                        <option key={size} value={size}>{size}px</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-lc-text-tertiary">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                         {/* Font Family */}
                         <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-lc-text-primary">Font family</label>
                                <p className="text-xs text-lc-text-tertiary mt-1">Choose the font for the code editor</p>
                            </div>
                            <div className="relative">
                                <select 
                                    value={settings.fontFamily}
                                    onChange={(e) => settings.updateSetting('fontFamily', e.target.value)}
                                    className="bg-lc-fill-2 border border-lc-border text-lc-text-primary text-sm rounded-md px-3 py-1.5 w-[200px] focus:outline-none focus:border-lc-accent appearance-none cursor-pointer"
                                >
                                    <option value='"Menlo", "Consolas", "Bitstream Vera Sans Mono", monospace'>Default (Monospace)</option>
                                    <option value='"Fira Code", monospace'>Fira Code</option>
                                    <option value='"JetBrains Mono", monospace'>JetBrains Mono</option>
                                    <option value='"Source Code Pro", monospace'>Source Code Pro</option>
                                </select>
                            </div>
                        </div>

                        {/* Tab Size */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-lc-text-primary">Tab size</label>
                                <p className="text-xs text-lc-text-tertiary mt-1">Number of spaces per indentation level</p>
                            </div>
                            <div className="relative">
                                <select 
                                    value={settings.tabSize}
                                    onChange={(e) => settings.updateSetting('tabSize', Number(e.target.value))}
                                    className="bg-lc-fill-2 border border-lc-border text-lc-text-primary text-sm rounded-md px-3 py-1.5 w-[100px] focus:outline-none focus:border-lc-accent appearance-none cursor-pointer"
                                >
                                    {[2, 4, 8].map(size => (
                                        <option key={size} value={size}>{size} spaces</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                         {/* Word Wrap */}
                         <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-lc-text-primary">Word Wrap</label>
                                <p className="text-xs text-lc-text-tertiary mt-1">Wrap long lines in the editor</p>
                            </div>
                            <button 
                                onClick={() => settings.updateSetting('wordWrap', settings.wordWrap === 'on' ? 'off' : 'on')}
                                className={`w-11 h-6 rounded-full transition-colors relative ${settings.wordWrap === 'on' ? 'bg-lc-accent' : 'bg-lc-fill-3'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings.wordWrap === 'on' ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>

                        {/* Key Binding */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-lc-text-primary">Key binding</label>
                                <p className="text-xs text-lc-text-tertiary mt-1">Editor keyboard shortcuts</p>
                            </div>
                            <div className="relative">
                                <select 
                                    value={settings.keybinding}
                                    onChange={(e) => settings.updateSetting('keybinding', e.target.value as any)}
                                    className="bg-lc-fill-2 border border-lc-border text-lc-text-primary text-sm rounded-md px-3 py-1.5 w-[140px] focus:outline-none focus:border-lc-accent appearance-none cursor-pointer"
                                >
                                    <option value="standard">Standard</option>
                                    <option value="vim">Vim</option>
                                    <option value="emacs">Emacs</option>
                                </select>
                            </div>
                        </div>
                        
                         {/* Relative Line Numbers */}
                         <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-lc-text-primary">Relative Line Numbers</label>
                                <p className="text-xs text-lc-text-tertiary mt-1">Show line numbers relative to cursor</p>
                            </div>
                            <button 
                                onClick={() => settings.updateSetting('relativeLineNumbers', !settings.relativeLineNumbers)}
                                className={`w-11 h-6 rounded-full transition-colors relative ${settings.relativeLineNumbers ? 'bg-lc-accent' : 'bg-lc-fill-3'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings.relativeLineNumbers ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'layout' && (
                    <div className="space-y-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <label className="text-sm font-medium text-lc-text-primary">Default Layout</label>
                                <p className="text-xs text-lc-text-tertiary mt-1 max-w-[400px]">
                                    Show Run/Submit buttons in the toolbar or inside the editor header.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div 
                                    onClick={() => settings.updateSetting('runButtonPosition', 'toolbar')}
                                    className={`cursor-pointer p-2 rounded-lg border-2 transition-all ${settings.runButtonPosition === 'toolbar' ? 'border-lc-accent bg-lc-fill-2' : 'border-transparent hover:bg-lc-fill-2'}`}
                                >
                                    <div className="w-[80px] h-[50px] bg-lc-fill-3 rounded border border-lc-border relative mb-2">
                                        <div className="absolute top-1 left-2 w-[20px] h-[4px] bg-lc-text-tertiary rounded"></div>
                                        <div className="absolute top-1 right-2 w-[30px] h-[8px] bg-lc-accent rounded"></div>
                                    </div>
                                    <p className="text-center text-xs font-medium text-lc-text-primary">Toolbar</p>
                                </div>
                                <div 
                                    onClick={() => settings.updateSetting('runButtonPosition', 'editor')}
                                    className={`cursor-pointer p-2 rounded-lg border-2 transition-all ${settings.runButtonPosition === 'editor' ? 'border-lc-accent bg-lc-fill-2' : 'border-transparent hover:bg-lc-fill-2'}`}
                                >
                                    <div className="w-[80px] h-[50px] bg-lc-fill-3 rounded border border-lc-border relative flex items-center justify-center mb-2">
                                        <div className="w-[30px] h-[8px] bg-lc-accent rounded"></div>
                                    </div>
                                    <p className="text-center text-xs font-medium text-lc-text-primary">Code Editor</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'shortcuts' && (
                    <div className="text-center text-lc-text-tertiary py-10">
                        <Keyboard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Shortcut customization coming soon!</p>
                    </div>
                )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-lc-border bg-lc-layer-2 flex justify-between items-center">
                 <button 
                    onClick={settings.resetSettings}
                    className="text-sm text-lc-text-tertiary hover:text-lc-text-primary transition-colors"
                >
                    Reset to default
                </button>
                <div className="px-4 py-2 bg-lc-fill-3 rounded-md text-xs text-lc-text-secondary">
                    All changes are saved automatically
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
