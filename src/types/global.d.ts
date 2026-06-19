interface Window {
  api: {
    getSessions: () => Promise<any[]>;
    createSession: (id: string, title: string) => Promise<boolean>;
    deleteSession: (id: string) => Promise<void>;
    renameSession: (id: string, title: string) => Promise<void>;
    getMessages: (sessionId: string) => Promise<any[]>;
    deleteLastMessage: (sessionId: string) => Promise<void>;
    truncateMessages: (sessionId: string, keepCount: number) => Promise<void>;
    generateTitle: (sessionId: string, model: string, prompt: string) => Promise<string | null>;
    getSettings: () => Promise<Record<string, string>>;
    saveSettings: (settings: Record<string, string>) => Promise<void>;
    selectFile: () => Promise<{ type: 'image' | 'document', data: string, path: string } | null>;
    processDocument: (sessionId: string, text: string) => Promise<number>;
    getSystemStats: () => Promise<{ freemem: number, totalmem: number }>;
    
    // Ollama
    listModels: () => Promise<{name: string}[]>;
    deleteModel: (model: string) => Promise<void>;
    pullModel: (model: string) => void;
    onPullChunk: (model: string, callback: (chunk: any) => void) => void;
    onPullEnd: (model: string, callback: () => void) => void;
    onPullError: (model: string, callback: (err: string) => void) => void;

    // Streaming
    onStreamChunk: (sessionId: string, callback: (chunk: string) => void) => void;
    onStreamEnd: (sessionId: string, callback: () => void) => void;
    onStreamStats: (sessionId: string, callback: (stats: number) => void) => void;
    onStreamError: (sessionId: string, callback: (err: string) => void) => void;
    removeAllListeners: (channel: string) => void;
    sendChatStream: (sessionId: string, messages: any[], model: string) => void;
    stopChatStream: (sessionId: string) => void;
  }
}
