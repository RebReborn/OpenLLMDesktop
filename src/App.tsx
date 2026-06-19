import { useEffect, useState, useRef } from 'react';
import { useChatStore } from './store/chatStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy, Settings2, Trash2, Edit2, RotateCcw, StopCircle, Search, Settings, Paperclip, X } from 'lucide-react';
import ModelManager from './components/ModelManager';
import SettingsModal from './components/SettingsModal';

const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="relative group my-4 rounded-lg overflow-hidden bg-[#1E1E1E] border border-slate-700">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-slate-400 text-xs font-sans">
          <span className="uppercase">{language}</span>
          <button 
            onClick={handleCopy}
            className="hover:text-slate-200 transition-colors p-1 flex items-center gap-1"
            title="Copy code"
          >
            {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>
        <SyntaxHighlighter
          {...props}
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code {...props} className={`${className} bg-slate-800 px-1.5 py-0.5 rounded text-sm text-blue-300 font-mono`}>
      {children}
    </code>
  );
};

function App() {
  const { 
    sessions, activeSessionId, messages, models, activeModel, isStreaming, attachments,
    loadSessions, createSession, setActiveSession, loadModels, setActiveModel, sendMessage,
    deleteSession, renameSession, stopStream, regenerateLastMessage, attachFile, removeAttachment
  } = useChatStore();

  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModelManagerOpen, setIsModelManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
    loadModels();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 drag-region select-none">
          <span className="font-bold text-slate-300">OpenLLM</span>
        </div>
        
        <div className="p-4 non-drag-region">
          <button 
            onClick={createSession}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition"
          >
            + New Chat
          </button>
        </div>

        <div className="p-3 non-drag-region">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-slate-500" size={16} />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 non-drag-region pb-4">
          {sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
            <div key={s.id} className="relative group">
              {editingSessionId === s.id ? (
                <input
                  autoFocus
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onBlur={() => {
                    renameSession(s.id, editTitle || 'New Chat');
                    setEditingSessionId(null);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      renameSession(s.id, editTitle || 'New Chat');
                      setEditingSessionId(null);
                    }
                  }}
                  className="w-full bg-slate-800 text-slate-200 px-3 py-2 rounded text-sm outline-none border border-blue-500"
                />
              ) : (
                <button
                  onClick={() => setActiveSession(s.id)}
                  className={`w-full text-left px-3 py-2 rounded transition truncate pr-16 ${
                    s.id === activeSessionId ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {s.title}
                </button>
              )}
              
              {!editingSessionId && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditTitle(s.title); setEditingSessionId(s.id); }}
                    className="p-1 text-slate-400 hover:text-blue-400 transition"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete chat?')) deleteSession(s.id); }}
                    className="p-1 text-slate-400 hover:text-red-400 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Title Bar Area (Draggable) */}
        <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 drag-region select-none">
          <div className="flex-1"></div>
          
          {/* Model Selector */}
          <div className="non-drag-region flex items-center gap-2">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
              title="Settings"
            >
              <Settings size={18} />
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            <button 
              onClick={() => setIsModelManagerOpen(true)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition flex items-center gap-1.5 text-sm font-medium mr-2 px-2"
            >
              <Settings2 size={16} /> Manage Models
            </button>
            <button 
              onClick={loadModels}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
              title="Refresh Models"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
            <select 
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
            >
              {models.length === 0 && <option value="">No local models found...</option>}
              {models.map(m => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!activeSessionId && (
             <div className="h-full flex items-center justify-center text-slate-500">
               Select or create a chat to begin.
             </div>
          )}
          {activeSessionId && messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-500">
              Start a conversation with {activeModel || 'AI'}.
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl p-4 rounded-xl shadow-md ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-200 overflow-hidden'
              }`}>
                {msg.images && msg.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {msg.images.map((img, idx) => (
                      <img key={idx} src={`data:image/jpeg;base64,${img}`} alt="attachment" className="max-h-60 rounded-lg object-contain bg-slate-900/50" />
                    ))}
                  </div>
                )}
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                ) : (
                  <div className="markdown-body">
                    {msg.content === '' && msg.isStreaming ? (
                      <div className="flex items-center gap-1.5 h-6 px-1 mt-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    ) : (
                      <>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code: CodeBlock as any,
                            p: ({children}) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
                            ul: ({children}) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                            li: ({children}) => <li>{children}</li>,
                            h1: ({children}) => <h1 className="text-2xl font-bold mb-4 mt-6 text-slate-100">{children}</h1>,
                            h2: ({children}) => <h2 className="text-xl font-bold mb-3 mt-5 text-slate-100">{children}</h2>,
                            h3: ({children}) => <h3 className="text-lg font-bold mb-2 mt-4 text-slate-100">{children}</h3>,
                            a: ({children, href}) => <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noreferrer">{children}</a>,
                            blockquote: ({children}) => <blockquote className="border-l-4 border-slate-600 pl-4 italic my-4 text-slate-400">{children}</blockquote>,
                            table: ({children}) => <div className="overflow-x-auto mb-4"><table className="min-w-full divide-y divide-slate-700">{children}</table></div>,
                            th: ({children}) => <th className="px-3 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-900">{children}</th>,
                            td: ({children}) => <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-300 border-t border-slate-700">{children}</td>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                        {msg.isStreaming && <span className="inline-block w-2 h-4 bg-slate-400 mt-2 animate-pulse align-middle"></span>}
                      </>
                    )}
                  </div>
                )}
                
                {!msg.isStreaming && msg.role === 'assistant' && i === messages.length - 1 && (
                  <div className="mt-3 pt-2 border-t border-slate-700/50 flex justify-end">
                    <button 
                      onClick={regenerateLastMessage}
                      className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition"
                    >
                      <RotateCcw size={13} /> Regenerate
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <div className="max-w-4xl mx-auto flex flex-col gap-2 relative">
            {isStreaming && (
              <div className="absolute -top-12 left-0 right-0 flex justify-center z-10">
                <button 
                  onClick={stopStream}
                  className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 px-4 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-lg transition"
                >
                  <StopCircle size={16} /> Stop Generating
                </button>
              </div>
            )}
            
            {attachments.length > 0 && (
              <div className="flex gap-2 p-3 bg-slate-800 rounded-lg overflow-x-auto border border-slate-700 mx-2 mt-[-8px]">
                {attachments.map((file, idx) => (
                  <div key={idx} className="relative shrink-0 group">
                    {file.type === 'image' ? (
                      <img src={`data:image/jpeg;base64,${file.data}`} className="h-16 w-16 object-cover rounded-lg border border-slate-600" />
                    ) : (
                      <div className="h-16 w-16 bg-slate-700 flex items-center justify-center rounded-lg text-[10px] text-center p-1 break-all border border-slate-600">
                        {file.path.split(/[/\\]/).pop()}
                      </div>
                    )}
                    <button 
                      onClick={() => removeAttachment(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-md"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 w-full">
              <button
                onClick={attachFile}
                disabled={isStreaming || !activeSessionId}
                className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 px-4 rounded-lg transition disabled:opacity-50 flex items-center justify-center"
                title="Attach Image or Document"
              >
                <Paperclip size={20} />
              </button>
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isStreaming || !activeSessionId || !activeModel}
                className="flex-1 bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-lg p-4 text-slate-100 focus:outline-none transition non-drag-region disabled:opacity-50"
                placeholder={
                  !activeSessionId ? "Create a session to start..." :
                  !activeModel ? "Please ensure Ollama is running and has a model installed." :
                  "Message AI..."
                }
              />
              <button 
                onClick={handleSend}
                disabled={isStreaming || !activeSessionId || !activeModel}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 text-white px-6 py-4 rounded-lg font-medium transition non-drag-region"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
      <ModelManager isOpen={isModelManagerOpen} onClose={() => setIsModelManagerOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}

export default App
