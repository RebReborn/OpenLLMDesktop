import { Ollama } from 'ollama';
import { DB } from './db';

let currentHost = 'http://127.0.0.1:11434';
let ollama = new Ollama({ host: currentHost });

const activeStreams = new Map<string, any>();

const getOllamaInstance = () => {
  const settings = DB.getSettings();
  const host = settings.ollamaUrl || 'http://127.0.0.1:11434';
  if (host !== currentHost) {
    currentHost = host;
    ollama = new Ollama({ host: currentHost });
  }
  return ollama;
};

export const ollamaService = {
  checkConnection: async () => {
    try {
      await getOllamaInstance().list();
      return true;
    } catch {
      return false;
    }
  },
  listModels: async () => {
    try {
      const response = await getOllamaInstance().list();
      return response.models.map(m => ({ name: m.name }));
    } catch (error: any) {
      console.error("Failed to list Ollama models:", error);
      throw new Error(error.message || String(error));
    }
  },
  streamChat: async (sessionId: string, model: string, messages: any[], system?: string, temperature?: number) => {
    const finalMessages = [...messages];
    if (system && finalMessages[0]?.role !== 'system') {
      finalMessages.unshift({ role: 'system', content: system });
    }

    const stream = await getOllamaInstance().chat({
      model,
      messages: finalMessages,
      stream: true,
      options: temperature !== undefined ? { temperature } : undefined,
    });
    
    activeStreams.set(sessionId, stream);
    return stream;
  },
  stopStream: (sessionId: string) => {
    const stream = activeStreams.get(sessionId);
    if (stream && typeof stream.abort === 'function') {
      stream.abort();
      activeStreams.delete(sessionId);
    }
  },
  deleteModel: async (model: string) => {
    return await getOllamaInstance().delete({ model });
  },
  pullModel: async (model: string) => {
    return await getOllamaInstance().pull({ model, stream: true });
  },
  ensureModel: async (model: string) => {
    const models = await ollamaService.listModels();
    if (!models.some(m => m.name.startsWith(model) || m.name === model)) {
      console.log(`Pulling required model: ${model}...`);
      const stream = await getOllamaInstance().pull({ model, stream: true });
      for await (const chunk of stream) { /* consume */ }
    }
  },
  generateEmbedding: async (model: string, text: string) => {
    const res = await getOllamaInstance().embeddings({ model, prompt: text });
    return res.embedding;
  }
};
