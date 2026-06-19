import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { DB } from './db';
import { ollamaService } from './ollama';

// The built directory structure
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function cosineSimilarity(A: number[], B: number[]) {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < A.length; i++) {
    dotProduct += A[i] * B[i];
    normA += A[i] * A[i];
    normB += B[i] * B[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset',
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow();

  // --- DB IPC Handlers ---
  ipcMain.handle('get-sessions', () => DB.getSessions());
  ipcMain.handle('create-session', (_, id, title) => {
    DB.createSession(id, title);
    return true;
  });
  ipcMain.handle('get-messages', (_, sessionId) => DB.getMessages(sessionId));

  ipcMain.handle('delete-session', (_, id) => DB.deleteSession(id));
  ipcMain.handle('rename-session', (_, id, title) => DB.renameSession(id, title));
  ipcMain.handle('delete-last-message', (_, sessionId) => DB.deleteLastAssistantMessage(sessionId));

  ipcMain.handle('get-settings', () => DB.getSettings());
  ipcMain.handle('save-settings', (_, settings) => DB.saveSettings(settings));

  ipcMain.on('chat-stop', (_, sessionId) => ollamaService.stopStream(sessionId));
  // --- File Handlers ---
  ipcMain.handle('select-file', async () => {
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'webp'] },
        { name: 'Documents', extensions: ['txt', 'md'] }
      ]
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    
    const filePath = result.filePaths[0];
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'png', 'jpeg', 'webp'].includes(ext || '')) {
      const b64 = fs.readFileSync(filePath, 'base64');
      return { type: 'image', data: b64, path: filePath };
    } else {
      const text = fs.readFileSync(filePath, 'utf-8');
      return { type: 'document', data: text, path: filePath };
    }
  });

  ipcMain.handle('process-document', async (_, sessionId: string, text: string) => {
    const EMBEDDING_MODEL = 'nomic-embed-text';
    await ollamaService.ensureModel(EMBEDDING_MODEL);
    
    // Simple paragraph chunker
    const chunks = text.split(/\n\s*\n/).filter(c => c.trim().length > 0);
    
    for (const chunk of chunks) {
      const embedding = await ollamaService.generateEmbedding(EMBEDDING_MODEL, chunk);
      DB.saveDocumentChunk(sessionId, chunk, embedding);
    }
    return chunks.length;
  });

  // --- Ollama IPC Handlers ---
  ipcMain.handle('ollama-list', async () => await ollamaService.listModels());
  ipcMain.handle('ollama-delete', async (_, model) => await ollamaService.deleteModel(model));

  ipcMain.on('ollama-pull', async (event, model) => {
    try {
      const stream = await ollamaService.pullModel(model);
      for await (const chunk of stream) {
        event.sender.send(`pull-chunk-${model}`, chunk);
      }
      event.sender.send(`pull-end-${model}`);
    } catch (error: any) {
      console.error(error);
      event.sender.send(`pull-error-${model}`, error.message);
    }
  });

  ipcMain.on('chat-stream', async (event, { sessionId, messages, model }) => {
    try {
      // Save the user's latest message
      const lastUserMsg = messages[messages.length - 1];
      const images = lastUserMsg.images || [];
      DB.saveMessage(sessionId, 'user', lastUserMsg.content, images);

      // Check for document chunks
      const chunks = DB.getDocumentChunks(sessionId);
      let ragContext = '';
      if (chunks.length > 0) {
        await ollamaService.ensureModel('nomic-embed-text');
        const promptEmbedding = await ollamaService.generateEmbedding('nomic-embed-text', lastUserMsg.content);
        
        // Compute similarities
        const scoredChunks = chunks.map(c => ({
          text: c.text,
          score: cosineSimilarity(promptEmbedding, c.embedding)
        }));
        
        scoredChunks.sort((a, b) => b.score - a.score);
        const topChunks = scoredChunks.slice(0, 3).map(c => c.text);
        if (topChunks.length > 0) {
          ragContext = "Relevant Context:\n" + topChunks.join("\n\n") + "\n\n";
        }
      }

      // Read settings
      const settings = DB.getSettings();
      let systemPrompt = settings.systemPrompt || '';
      if (ragContext) {
        systemPrompt = ragContext + systemPrompt;
      }
      const temperature = settings.temperature ? parseFloat(settings.temperature) : undefined;

      // Start streaming from Ollama
      const stream = await ollamaService.streamChat(sessionId, model, messages, systemPrompt, temperature);
      let assistantResponse = '';

      for await (const chunk of stream) {
        assistantResponse += chunk.message.content;
        event.sender.send(`chat-stream-chunk-${sessionId}`, chunk.message.content);
      }

      // Save AI's complete response
      DB.saveMessage(sessionId, 'assistant', assistantResponse);
      event.sender.send(`chat-stream-end-${sessionId}`);
    } catch (error: any) {
      console.error(error);
      event.sender.send(`chat-stream-error-${sessionId}`, error.message);
      // Clean up abort state just in case
      ollamaService.stopStream(sessionId);
    }
  });
});
