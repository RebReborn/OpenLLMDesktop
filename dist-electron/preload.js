let electron = require("electron");
//#region electron/preload.ts
electron.contextBridge.exposeInMainWorld("api", {
	getSessions: () => electron.ipcRenderer.invoke("get-sessions"),
	createSession: (id, title) => electron.ipcRenderer.invoke("create-session", id, title),
	deleteSession: (id) => electron.ipcRenderer.invoke("delete-session", id),
	renameSession: (id, title) => electron.ipcRenderer.invoke("rename-session", id, title),
	getMessages: (sessionId) => electron.ipcRenderer.invoke("get-messages", sessionId),
	deleteLastMessage: (sessionId) => electron.ipcRenderer.invoke("delete-last-message", sessionId),
	truncateMessages: (sessionId, keepCount) => electron.ipcRenderer.invoke("truncate-messages", sessionId, keepCount),
	generateTitle: (sessionId, model, prompt) => electron.ipcRenderer.invoke("generate-title", sessionId, model, prompt),
	getSettings: () => electron.ipcRenderer.invoke("get-settings"),
	saveSettings: (settings) => electron.ipcRenderer.invoke("save-settings", settings),
	getSystemStats: () => electron.ipcRenderer.invoke("get-system-stats"),
	selectFile: () => electron.ipcRenderer.invoke("select-file"),
	processDocument: (sessionId, text) => electron.ipcRenderer.invoke("process-document", sessionId, text),
	listModels: () => electron.ipcRenderer.invoke("ollama-list"),
	deleteModel: (model) => electron.ipcRenderer.invoke("ollama-delete", model),
	pullModel: (model) => electron.ipcRenderer.send("ollama-pull", model),
	onPullChunk: (model, callback) => electron.ipcRenderer.on(`pull-chunk-${model}`, (_, chunk) => callback(chunk)),
	onPullEnd: (model, callback) => electron.ipcRenderer.on(`pull-end-${model}`, () => callback()),
	onPullError: (model, callback) => electron.ipcRenderer.on(`pull-error-${model}`, (_, err) => callback(err)),
	onStreamChunk: (sessionId, callback) => electron.ipcRenderer.on(`chat-stream-chunk-${sessionId}`, (_, chunk) => callback(chunk)),
	onStreamEnd: (sessionId, callback) => electron.ipcRenderer.on(`chat-stream-end-${sessionId}`, () => callback()),
	onStreamStats: (sessionId, callback) => electron.ipcRenderer.on(`chat-stream-stats-${sessionId}`, (_, stats) => callback(stats)),
	onStreamError: (sessionId, callback) => electron.ipcRenderer.on(`chat-stream-error-${sessionId}`, (_, err) => callback(err)),
	removeAllListeners: (channel) => electron.ipcRenderer.removeAllListeners(channel),
	sendChatStream: (sessionId, messages, model) => electron.ipcRenderer.send("chat-stream", {
		sessionId,
		messages,
		model
	}),
	stopChatStream: (sessionId) => electron.ipcRenderer.send("chat-stop", sessionId)
});
//#endregion
