let electron = require("electron");
//#region electron/preload.ts
electron.contextBridge.exposeInMainWorld("api", {
	getSessions: () => electron.ipcRenderer.invoke("get-sessions"),
	createSession: (id, title) => electron.ipcRenderer.invoke("create-session", id, title),
	getMessages: (sessionId) => electron.ipcRenderer.invoke("get-messages", sessionId),
	listModels: () => electron.ipcRenderer.invoke("ollama-list"),
	onStreamChunk: (sessionId, callback) => electron.ipcRenderer.on(`chat-stream-chunk-${sessionId}`, (_, chunk) => callback(chunk)),
	onStreamEnd: (sessionId, callback) => electron.ipcRenderer.on(`chat-stream-end-${sessionId}`, () => callback()),
	onStreamError: (sessionId, callback) => electron.ipcRenderer.on(`chat-stream-error-${sessionId}`, (_, err) => callback(err)),
	removeAllListeners: (channel) => electron.ipcRenderer.removeAllListeners(channel),
	sendChatStream: (sessionId, messages, model) => electron.ipcRenderer.send("chat-stream", {
		sessionId,
		messages,
		model
	})
});
//#endregion
