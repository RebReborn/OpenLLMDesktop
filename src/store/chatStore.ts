import { create } from 'zustand';

interface Message {
  role: string;
  content: string;
  images?: string[];
  isStreaming?: boolean;
  model?: string;
  tokensPerSec?: number;
}

interface Session {
  id: string;
  title: string;
  createdAt: number;
}

interface ChatState {
  sessions: Session[];
  activeSessionId: string | null;
  messages: Message[];
  models: any[];
  activeModel: string;
  isStreaming: boolean;
  attachments: { type: 'image' | 'document', data: string, path: string }[];
  
  loadSessions: () => Promise<void>;
  createSession: () => Promise<void>;
  setActiveSession: (id: string) => Promise<void>;
  loadModels: () => Promise<void>;
  setActiveModel: (model: string) => void;
  
  sendMessage: (content: string) => void;
  deleteSession: (id: string) => Promise<void>;
  renameSession: (id: string, title: string) => Promise<void>;
  stopStream: () => void;
  regenerateLastMessage: () => Promise<void>;
  editMessage: (index: number, newContent: string) => Promise<void>;
  
  attachFile: () => Promise<void>;
  removeAttachment: (index: number) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  models: [],
  activeModel: '',
  isStreaming: false,
  attachments: [],

  loadSessions: async () => {
    const sessions = await window.api.getSessions();
    if (sessions.length === 0) {
      await get().createSession();
    } else {
      set({ sessions });
      if (!get().activeSessionId) {
        get().setActiveSession(sessions[0].id);
      }
    }
  },

  createSession: async () => {
    const id = Date.now().toString();
    const title = 'New Chat';
    await window.api.createSession(id, title);
    await get().loadSessions();
    await get().setActiveSession(id);
  },

  setActiveSession: async (id: string) => {
    const messages = await window.api.getMessages(id);
    set({ activeSessionId: id, messages });
  },

  deleteSession: async (id: string) => {
    await window.api.deleteSession(id);
    const { activeSessionId } = get();
    if (activeSessionId === id) {
      set({ activeSessionId: null, messages: [] });
    }
    await get().loadSessions();
  },

  renameSession: async (id: string, title: string) => {
    await window.api.renameSession(id, title);
    await get().loadSessions();
  },

  loadModels: async () => {
    try {
      const models = await window.api.listModels();
      set({ models });
      if (models.length > 0 && !get().activeModel) {
        set({ activeModel: models[0].name });
      }
    } catch (error: any) {
      console.error(error);
      alert("Error fetching models: " + (error.message || error));
      set({ models: [] });
    }
  },

  setActiveModel: (model: string) => set({ activeModel: model }),

  sendMessage: (content: string) => {
    const { activeSessionId, activeModel, messages, attachments, sessions } = get();
    if (!activeSessionId || !activeModel) return;

    const currentSession = sessions.find(s => s.id === activeSessionId);
    const isNewChat = currentSession && currentSession.title === 'New Chat' && messages.length === 0;

    const images = attachments.filter(a => a.type === 'image').map(a => a.data);
    const newMsg = { role: 'user', content, images: images.length > 0 ? images : undefined };
    const newMessages = [...messages, newMsg, { role: 'assistant', content: '', isStreaming: true, model: activeModel }];
    
    set({ messages: newMessages, isStreaming: true, attachments: [] });
    get()._startStream(activeSessionId, newMessages.slice(0, -1), activeModel); // don't send the empty assistant msg to API

    if (isNewChat) {
      window.api.generateTitle(activeSessionId, activeModel, content).then(title => {
        if (title) {
          get().loadSessions();
        }
      });
    }
  },

  stopStream: () => {
    const { activeSessionId, isStreaming } = get();
    if (!activeSessionId || !isStreaming) return;
    
    window.api.stopChatStream(activeSessionId);
    
    set((state) => {
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.isStreaming) last.isStreaming = false;
      return { messages: msgs, isStreaming: false };
    });
  },

  regenerateLastMessage: async () => {
    const { activeSessionId, activeModel, messages } = get();
    if (!activeSessionId || !activeModel || messages.length === 0) return;
    
    let newMessages = [...messages];
    if (newMessages[newMessages.length - 1].role === 'assistant') {
      await window.api.deleteLastMessage(activeSessionId);
      newMessages.pop();
      set({ messages: newMessages });
    }
    
    const payloadMessages = [...newMessages];
    newMessages.push({ role: 'assistant', content: '', isStreaming: true, model: activeModel });
    
    set({ messages: newMessages, isStreaming: true });
    get()._startStream(activeSessionId, payloadMessages, activeModel);
  },

  editMessage: async (index: number, newContent: string) => {
    const { activeSessionId, activeModel, messages } = get();
    if (!activeSessionId || !activeModel) return;

    await window.api.truncateMessages(activeSessionId, index);

    const newMessages = messages.slice(0, index);
    newMessages.push({ role: 'user', content: newContent });
    
    const payloadMessages = [...newMessages];
    newMessages.push({ role: 'assistant', content: '', isStreaming: true, model: activeModel });
    
    set({ messages: newMessages, isStreaming: true });
    get()._startStream(activeSessionId, payloadMessages, activeModel);
  },

  _startStream: (activeSessionId: string, payloadMessages: any[], activeModel: string) => {
    window.api.onStreamChunk(activeSessionId, (chunk) => {
      set((state) => {
        const msgs = [...state.messages];
        const last = msgs[msgs.length - 1];
        if (last && last.role === 'assistant' && last.isStreaming) {
          msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
        } else {
          msgs.push({ role: 'assistant', content: chunk, isStreaming: true });
        }
        return { messages: msgs };
      });
    });

    window.api.onStreamStats(activeSessionId, (stats) => {
      set((state) => {
        const msgs = [...state.messages];
        const last = msgs[msgs.length - 1];
        if (last && last.role === 'assistant') {
          last.tokensPerSec = stats;
        }
        return { messages: msgs };
      });
    });

    window.api.onStreamEnd(activeSessionId, () => {
      set((state) => {
        const msgs = [...state.messages];
        const last = msgs[msgs.length - 1];
        if (last && last.isStreaming) last.isStreaming = false;
        return { messages: msgs, isStreaming: false };
      });
      window.api.removeAllListeners(`chat-stream-chunk-${activeSessionId}`);
      window.api.removeAllListeners(`chat-stream-end-${activeSessionId}`);
      window.api.removeAllListeners(`chat-stream-error-${activeSessionId}`);
      window.api.getMessages(activeSessionId).then(dbMsgs => {
        set({ messages: dbMsgs });
      });
    });

    window.api.onStreamError(activeSessionId, (err) => {
      set((state) => {
        const msgs = [...state.messages];
        const last = msgs[msgs.length - 1];
        if (last && last.role === 'assistant' && last.content === '') {
          msgs.pop();
        } else if (last) {
          last.isStreaming = false;
        }
        return { messages: msgs, isStreaming: false };
      });
      alert('Error: ' + err);
    });

    window.api.sendChatStream(activeSessionId, payloadMessages, activeModel);
  },

  attachFile: async () => {
    const file = await window.api.selectFile();
    if (!file) return;

    if (file.type === 'document') {
      const { activeSessionId } = get();
      if (!activeSessionId) return;
      
      set({ isStreaming: true });
      try {
        const numChunks = await window.api.processDocument(activeSessionId, file.data);
        alert(`Document successfully indexed (${numChunks} chunks)! You can now ask questions about it.`);
      } catch (err: any) {
        alert('Error processing document: ' + (err.message || err));
      } finally {
        set({ isStreaming: false });
      }
    } else {
      set(state => ({ attachments: [...state.attachments, file] }));
    }
  },

  removeAttachment: (index: number) => {
    set(state => ({
      attachments: state.attachments.filter((_, i) => i !== index)
    }));
  }
}));
