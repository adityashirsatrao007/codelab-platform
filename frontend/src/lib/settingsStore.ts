import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WorkspaceSettings {
  fontSize: number
  fontFamily: string
  tabSize: number
  keybinding: 'standard' | 'vim' | 'emacs'
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded'
  showLineNumbers: boolean
  relativeLineNumbers: boolean
  layout: 'default' | 'split'
  runButtonPosition: 'toolbar' | 'editor'
  theme: 'vs-dark' | 'light' // Adding theme for completeness, though mostly dark aimed
}

interface SettingsState extends WorkspaceSettings {
  updateSetting: <K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) => void
  resetSettings: () => void
}

const DEFAULT_SETTINGS: WorkspaceSettings = {
  fontSize: 14,
  fontFamily: '"Menlo", "Consolas", "Bitstream Vera Sans Mono", monospace',
  tabSize: 4,
  keybinding: 'standard',
  wordWrap: 'on',
  showLineNumbers: true,
  relativeLineNumbers: false,
  layout: 'default',
  runButtonPosition: 'toolbar',
  theme: 'vs-dark'
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      updateSetting: (key, value) => set((state) => ({ ...state, [key]: value })),
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'codelab-workspace-settings',
    }
  )
)
