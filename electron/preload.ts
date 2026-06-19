import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // DB
  getSessions: () => ipcRenderer.invoke('get-sessions'),
  createSession: (id: string, title: string) => ipcRenderer.invoke('create-session', id, title),
  deleteSession: (id: string) => ipcRenderer.invoke('delete-session', id),
  renameSession: (id: string, title: string) => ipcRenderer.invoke('rename-session', id, title),
  getMessages: (sessionId: string) => ipcRenderer.invoke('get-messages', sessionId),
  deleteLastMessage: (sessionId: string) => ipcRenderer.invoke('delete-last-message', sessionId),
  truncateMessages: (sessionId: string, keepCount: number) => ipcRenderer.invoke('truncate-messages', sessionId, keepCount),
  generateTitle: (sessionId: string, model: string, prompt: string) => ipcRenderer.invoke('generate-title', sessionId, model, prompt),

  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Record<string, string>) => ipcRenderer.invoke('save-settings', settings),
  getSystemStats: () => ipcRenderer.invoke('get-system-stats'),

  // Files
  selectFile: () => ipcRenderer.invoke('select-file'),
  processDocument: (sessionId: string, text: string) => ipcRenderer.invoke('process-document', sessionId, text),
  
  // Ollama
  listModels: () => ipcRenderer.invoke('ollama-list'),
  deleteModel: (model: string) => ipcRenderer.invoke('ollama-delete', model),
  pullModel: (model: string) => ipcRenderer.send('ollama-pull', model),
  onPullChunk: (model: string, callback: (chunk: any) => void) => 
    ipcRenderer.on(`pull-chunk-${model}`, (_, chunk) => callback(chunk)),
  onPullEnd: (model: string, callback: () => void) => 
    ipcRenderer.on(`pull-end-${model}`, () => callback()),
  onPullError: (model: string, callback: (err: string) => void) =>
    ipcRenderer.on(`pull-error-${model}`, (_, err) => callback(err)),
  
  // Streaming
  onStreamChunk: (sessionId: string, callback: (chunk: string) => void) => 
    ipcRenderer.on(`chat-stream-chunk-${sessionId}`, (_, chunk) => callback(chunk)),
  onStreamEnd: (sessionId: string, callback: () => void) => 
    ipcRenderer.on(`chat-stream-end-${sessionId}`, () => callback()),
  onStreamStats: (sessionId: string, callback: (stats: number) => void) => 
    ipcRenderer.on(`chat-stream-stats-${sessionId}`, (_, stats) => callback(stats)),
  onStreamError: (sessionId: string, callback: (err: string) => void) =>
    ipcRenderer.on(`chat-stream-error-${sessionId}`, (_, err) => callback(err)),
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
  sendChatStream: (sessionId: string, messages: any[], model: string) => 
    ipcRenderer.send('chat-stream', { sessionId, messages, model }),
  stopChatStream: (sessionId: string) => ipcRenderer.send('chat-stop', sessionId),
});
