//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp$2 = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp$2(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp$2(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let electron = require("electron");
let node_fs = require("node:fs");
let node_fs$1 = __toESM(node_fs, 1);
node_fs = __toESM(node_fs);
let node_path = require("node:path");
node_path = __toESM(node_path, 1);
//#region electron/db.ts
var Database = eval("require")("better-sqlite3");
var dbPath = node_path.default.join(electron.app.getPath("userData"), "openllmdesktop.db");
var db = new Database(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    title TEXT,
    createdAt INTEGER
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionId TEXT,
    role TEXT,
    content TEXT,
    createdAt INTEGER,
    images TEXT,
    FOREIGN KEY(sessionId) REFERENCES sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS document_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionId TEXT,
    text TEXT,
    embedding TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);
try {
	db.exec("ALTER TABLE messages ADD COLUMN images TEXT;");
} catch (e) {}
var DB = {
	createSession: (id, title) => {
		db.prepare("INSERT INTO sessions (id, title, createdAt) VALUES (?, ?, ?)").run(id, title, Date.now());
	},
	getSessions: () => {
		return db.prepare("SELECT * FROM sessions ORDER BY createdAt DESC").all();
	},
	saveMessage: (sessionId, role, content, images) => {
		db.prepare("INSERT INTO messages (sessionId, role, content, createdAt, images) VALUES (?, ?, ?, ?, ?)").run(sessionId, role, content, Date.now(), images ? JSON.stringify(images) : null);
	},
	getMessages: (sessionId) => {
		return db.prepare("SELECT role, content, images FROM messages WHERE sessionId = ? ORDER BY createdAt ASC").all(sessionId).map((r) => ({
			...r,
			images: r.images ? JSON.parse(r.images) : void 0
		}));
	},
	deleteSession: (id) => {
		db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
	},
	renameSession: (id, title) => {
		db.prepare("UPDATE sessions SET title = ? WHERE id = ?").run(title, id);
	},
	deleteLastAssistantMessage: (sessionId) => {
		db.prepare(`
      DELETE FROM messages 
      WHERE id = (
        SELECT id FROM messages 
        WHERE sessionId = ? 
        ORDER BY createdAt DESC 
        LIMIT 1
      ) AND role = 'assistant'
    `).run(sessionId);
	},
	getSettings: () => {
		const rows = db.prepare("SELECT * FROM settings").all();
		const settings = {};
		for (const row of rows) settings[row.key] = row.value;
		return settings;
	},
	saveSettings: (settings) => {
		const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
		db.transaction((settingsObj) => {
			for (const [key, value] of Object.entries(settingsObj)) stmt.run(key, String(value));
		})(settings);
	},
	saveDocumentChunk: (sessionId, text, embedding) => {
		db.prepare("INSERT INTO document_chunks (sessionId, text, embedding) VALUES (?, ?, ?)").run(sessionId, text, JSON.stringify(embedding));
	},
	getDocumentChunks: (sessionId) => {
		return db.prepare("SELECT text, embedding FROM document_chunks WHERE sessionId = ?").all(sessionId).map((r) => ({
			text: r.text,
			embedding: JSON.parse(r.embedding)
		}));
	}
};
//#endregion
//#region node_modules/whatwg-fetch/fetch.js
var g = typeof globalThis !== "undefined" && globalThis || typeof self !== "undefined" && self || typeof global !== "undefined" && global || {};
var support = {
	searchParams: "URLSearchParams" in g,
	iterable: "Symbol" in g && "iterator" in Symbol,
	blob: "FileReader" in g && "Blob" in g && (function() {
		try {
			new Blob();
			return true;
		} catch (e) {
			return false;
		}
	})(),
	formData: "FormData" in g,
	arrayBuffer: "ArrayBuffer" in g
};
function isDataView(obj) {
	return obj && DataView.prototype.isPrototypeOf(obj);
}
if (support.arrayBuffer) {
	var viewClasses = [
		"[object Int8Array]",
		"[object Uint8Array]",
		"[object Uint8ClampedArray]",
		"[object Int16Array]",
		"[object Uint16Array]",
		"[object Int32Array]",
		"[object Uint32Array]",
		"[object Float32Array]",
		"[object Float64Array]"
	];
	var isArrayBufferView = ArrayBuffer.isView || function(obj) {
		return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
	};
}
function normalizeName(name) {
	if (typeof name !== "string") name = String(name);
	if (/[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(name) || name === "") throw new TypeError("Invalid character in header field name: \"" + name + "\"");
	return name.toLowerCase();
}
function normalizeValue(value) {
	if (typeof value !== "string") value = String(value);
	return value;
}
function iteratorFor(items) {
	var iterator = { next: function() {
		var value = items.shift();
		return {
			done: value === void 0,
			value
		};
	} };
	if (support.iterable) iterator[Symbol.iterator] = function() {
		return iterator;
	};
	return iterator;
}
function Headers$1(headers) {
	this.map = {};
	if (headers instanceof Headers$1) headers.forEach(function(value, name) {
		this.append(name, value);
	}, this);
	else if (Array.isArray(headers)) headers.forEach(function(header) {
		if (header.length != 2) throw new TypeError("Headers constructor: expected name/value pair to be length 2, found" + header.length);
		this.append(header[0], header[1]);
	}, this);
	else if (headers) Object.getOwnPropertyNames(headers).forEach(function(name) {
		this.append(name, headers[name]);
	}, this);
}
Headers$1.prototype.append = function(name, value) {
	name = normalizeName(name);
	value = normalizeValue(value);
	var oldValue = this.map[name];
	this.map[name] = oldValue ? oldValue + ", " + value : value;
};
Headers$1.prototype["delete"] = function(name) {
	delete this.map[normalizeName(name)];
};
Headers$1.prototype.get = function(name) {
	name = normalizeName(name);
	return this.has(name) ? this.map[name] : null;
};
Headers$1.prototype.has = function(name) {
	return this.map.hasOwnProperty(normalizeName(name));
};
Headers$1.prototype.set = function(name, value) {
	this.map[normalizeName(name)] = normalizeValue(value);
};
Headers$1.prototype.forEach = function(callback, thisArg) {
	for (var name in this.map) if (this.map.hasOwnProperty(name)) callback.call(thisArg, this.map[name], name, this);
};
Headers$1.prototype.keys = function() {
	var items = [];
	this.forEach(function(value, name) {
		items.push(name);
	});
	return iteratorFor(items);
};
Headers$1.prototype.values = function() {
	var items = [];
	this.forEach(function(value) {
		items.push(value);
	});
	return iteratorFor(items);
};
Headers$1.prototype.entries = function() {
	var items = [];
	this.forEach(function(value, name) {
		items.push([name, value]);
	});
	return iteratorFor(items);
};
if (support.iterable) Headers$1.prototype[Symbol.iterator] = Headers$1.prototype.entries;
function consumed(body) {
	if (body._noBody) return;
	if (body.bodyUsed) return Promise.reject(/* @__PURE__ */ new TypeError("Already read"));
	body.bodyUsed = true;
}
function fileReaderReady(reader) {
	return new Promise(function(resolve, reject) {
		reader.onload = function() {
			resolve(reader.result);
		};
		reader.onerror = function() {
			reject(reader.error);
		};
	});
}
function readBlobAsArrayBuffer(blob) {
	var reader = new FileReader();
	var promise = fileReaderReady(reader);
	reader.readAsArrayBuffer(blob);
	return promise;
}
function readBlobAsText(blob) {
	var reader = new FileReader();
	var promise = fileReaderReady(reader);
	var match = /charset=([A-Za-z0-9_-]+)/.exec(blob.type);
	var encoding = match ? match[1] : "utf-8";
	reader.readAsText(blob, encoding);
	return promise;
}
function readArrayBufferAsText(buf) {
	var view = new Uint8Array(buf);
	var chars = new Array(view.length);
	for (var i = 0; i < view.length; i++) chars[i] = String.fromCharCode(view[i]);
	return chars.join("");
}
function bufferClone(buf) {
	if (buf.slice) return buf.slice(0);
	else {
		var view = new Uint8Array(buf.byteLength);
		view.set(new Uint8Array(buf));
		return view.buffer;
	}
}
function Body() {
	this.bodyUsed = false;
	this._initBody = function(body) {
		this.bodyUsed = this.bodyUsed;
		this._bodyInit = body;
		if (!body) {
			this._noBody = true;
			this._bodyText = "";
		} else if (typeof body === "string") this._bodyText = body;
		else if (support.blob && Blob.prototype.isPrototypeOf(body)) this._bodyBlob = body;
		else if (support.formData && FormData.prototype.isPrototypeOf(body)) this._bodyFormData = body;
		else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) this._bodyText = body.toString();
		else if (support.arrayBuffer && support.blob && isDataView(body)) {
			this._bodyArrayBuffer = bufferClone(body.buffer);
			this._bodyInit = new Blob([this._bodyArrayBuffer]);
		} else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) this._bodyArrayBuffer = bufferClone(body);
		else this._bodyText = body = Object.prototype.toString.call(body);
		if (!this.headers.get("content-type")) {
			if (typeof body === "string") this.headers.set("content-type", "text/plain;charset=UTF-8");
			else if (this._bodyBlob && this._bodyBlob.type) this.headers.set("content-type", this._bodyBlob.type);
			else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) this.headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8");
		}
	};
	if (support.blob) this.blob = function() {
		var rejected = consumed(this);
		if (rejected) return rejected;
		if (this._bodyBlob) return Promise.resolve(this._bodyBlob);
		else if (this._bodyArrayBuffer) return Promise.resolve(new Blob([this._bodyArrayBuffer]));
		else if (this._bodyFormData) throw new Error("could not read FormData body as blob");
		else return Promise.resolve(new Blob([this._bodyText]));
	};
	this.arrayBuffer = function() {
		if (this._bodyArrayBuffer) {
			var isConsumed = consumed(this);
			if (isConsumed) return isConsumed;
			else if (ArrayBuffer.isView(this._bodyArrayBuffer)) return Promise.resolve(this._bodyArrayBuffer.buffer.slice(this._bodyArrayBuffer.byteOffset, this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength));
			else return Promise.resolve(this._bodyArrayBuffer);
		} else if (support.blob) return this.blob().then(readBlobAsArrayBuffer);
		else throw new Error("could not read as ArrayBuffer");
	};
	this.text = function() {
		var rejected = consumed(this);
		if (rejected) return rejected;
		if (this._bodyBlob) return readBlobAsText(this._bodyBlob);
		else if (this._bodyArrayBuffer) return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer));
		else if (this._bodyFormData) throw new Error("could not read FormData body as text");
		else return Promise.resolve(this._bodyText);
	};
	if (support.formData) this.formData = function() {
		return this.text().then(decode);
	};
	this.json = function() {
		return this.text().then(JSON.parse);
	};
	return this;
}
var methods = [
	"CONNECT",
	"DELETE",
	"GET",
	"HEAD",
	"OPTIONS",
	"PATCH",
	"POST",
	"PUT",
	"TRACE"
];
function normalizeMethod(method) {
	var upcased = method.toUpperCase();
	return methods.indexOf(upcased) > -1 ? upcased : method;
}
function Request(input, options) {
	if (!(this instanceof Request)) throw new TypeError("Please use the \"new\" operator, this DOM object constructor cannot be called as a function.");
	options = options || {};
	var body = options.body;
	if (input instanceof Request) {
		if (input.bodyUsed) throw new TypeError("Already read");
		this.url = input.url;
		this.credentials = input.credentials;
		if (!options.headers) this.headers = new Headers$1(input.headers);
		this.method = input.method;
		this.mode = input.mode;
		this.signal = input.signal;
		if (!body && input._bodyInit != null) {
			body = input._bodyInit;
			input.bodyUsed = true;
		}
	} else this.url = String(input);
	this.credentials = options.credentials || this.credentials || "same-origin";
	if (options.headers || !this.headers) this.headers = new Headers$1(options.headers);
	this.method = normalizeMethod(options.method || this.method || "GET");
	this.mode = options.mode || this.mode || null;
	this.signal = options.signal || this.signal || function() {
		if ("AbortController" in g) return new AbortController().signal;
	}();
	this.referrer = null;
	if ((this.method === "GET" || this.method === "HEAD") && body) throw new TypeError("Body not allowed for GET or HEAD requests");
	this._initBody(body);
	if (this.method === "GET" || this.method === "HEAD") {
		if (options.cache === "no-store" || options.cache === "no-cache") {
			var reParamSearch = /([?&])_=[^&]*/;
			if (reParamSearch.test(this.url)) this.url = this.url.replace(reParamSearch, "$1_=" + (/* @__PURE__ */ new Date()).getTime());
			else {
				var reQueryString = /\?/;
				this.url += (reQueryString.test(this.url) ? "&" : "?") + "_=" + (/* @__PURE__ */ new Date()).getTime();
			}
		}
	}
}
Request.prototype.clone = function() {
	return new Request(this, { body: this._bodyInit });
};
function decode(body) {
	var form = new FormData();
	body.trim().split("&").forEach(function(bytes) {
		if (bytes) {
			var split = bytes.split("=");
			var name = split.shift().replace(/\+/g, " ");
			var value = split.join("=").replace(/\+/g, " ");
			form.append(decodeURIComponent(name), decodeURIComponent(value));
		}
	});
	return form;
}
function parseHeaders(rawHeaders) {
	var headers = new Headers$1();
	rawHeaders.replace(/\r?\n[\t ]+/g, " ").split("\r").map(function(header) {
		return header.indexOf("\n") === 0 ? header.substr(1, header.length) : header;
	}).forEach(function(line) {
		var parts = line.split(":");
		var key = parts.shift().trim();
		if (key) {
			var value = parts.join(":").trim();
			try {
				headers.append(key, value);
			} catch (error) {
				console.warn("Response " + error.message);
			}
		}
	});
	return headers;
}
Body.call(Request.prototype);
function Response(bodyInit, options) {
	if (!(this instanceof Response)) throw new TypeError("Please use the \"new\" operator, this DOM object constructor cannot be called as a function.");
	if (!options) options = {};
	this.type = "default";
	this.status = options.status === void 0 ? 200 : options.status;
	if (this.status < 200 || this.status > 599) throw new RangeError("Failed to construct 'Response': The status provided (0) is outside the range [200, 599].");
	this.ok = this.status >= 200 && this.status < 300;
	this.statusText = options.statusText === void 0 ? "" : "" + options.statusText;
	this.headers = new Headers$1(options.headers);
	this.url = options.url || "";
	this._initBody(bodyInit);
}
Body.call(Response.prototype);
Response.prototype.clone = function() {
	return new Response(this._bodyInit, {
		status: this.status,
		statusText: this.statusText,
		headers: new Headers$1(this.headers),
		url: this.url
	});
};
Response.error = function() {
	var response = new Response(null, {
		status: 200,
		statusText: ""
	});
	response.ok = false;
	response.status = 0;
	response.type = "error";
	return response;
};
var redirectStatuses = [
	301,
	302,
	303,
	307,
	308
];
Response.redirect = function(url, status) {
	if (redirectStatuses.indexOf(status) === -1) throw new RangeError("Invalid status code");
	return new Response(null, {
		status,
		headers: { location: url }
	});
};
var DOMException = g.DOMException;
try {
	new DOMException();
} catch (err) {
	DOMException = function(message, name) {
		this.message = message;
		this.name = name;
		var error = Error(message);
		this.stack = error.stack;
	};
	DOMException.prototype = Object.create(Error.prototype);
	DOMException.prototype.constructor = DOMException;
}
function fetch$1(input, init) {
	return new Promise(function(resolve, reject) {
		var request = new Request(input, init);
		if (request.signal && request.signal.aborted) return reject(new DOMException("Aborted", "AbortError"));
		var xhr = new XMLHttpRequest();
		function abortXhr() {
			xhr.abort();
		}
		xhr.onload = function() {
			var options = {
				statusText: xhr.statusText,
				headers: parseHeaders(xhr.getAllResponseHeaders() || "")
			};
			if (request.url.indexOf("file://") === 0 && (xhr.status < 200 || xhr.status > 599)) options.status = 200;
			else options.status = xhr.status;
			options.url = "responseURL" in xhr ? xhr.responseURL : options.headers.get("X-Request-URL");
			var body = "response" in xhr ? xhr.response : xhr.responseText;
			setTimeout(function() {
				resolve(new Response(body, options));
			}, 0);
		};
		xhr.onerror = function() {
			setTimeout(function() {
				reject(/* @__PURE__ */ new TypeError("Network request failed"));
			}, 0);
		};
		xhr.ontimeout = function() {
			setTimeout(function() {
				reject(/* @__PURE__ */ new TypeError("Network request timed out"));
			}, 0);
		};
		xhr.onabort = function() {
			setTimeout(function() {
				reject(new DOMException("Aborted", "AbortError"));
			}, 0);
		};
		function fixUrl(url) {
			try {
				return url === "" && g.location.href ? g.location.href : url;
			} catch (e) {
				return url;
			}
		}
		xhr.open(request.method, fixUrl(request.url), true);
		if (request.credentials === "include") xhr.withCredentials = true;
		else if (request.credentials === "omit") xhr.withCredentials = false;
		if ("responseType" in xhr) {
			if (support.blob) xhr.responseType = "blob";
			else if (support.arrayBuffer) xhr.responseType = "arraybuffer";
		}
		if (init && typeof init.headers === "object" && !(init.headers instanceof Headers$1 || g.Headers && init.headers instanceof g.Headers)) {
			var names = [];
			Object.getOwnPropertyNames(init.headers).forEach(function(name) {
				names.push(normalizeName(name));
				xhr.setRequestHeader(name, normalizeValue(init.headers[name]));
			});
			request.headers.forEach(function(value, name) {
				if (names.indexOf(name) === -1) xhr.setRequestHeader(name, value);
			});
		} else request.headers.forEach(function(value, name) {
			xhr.setRequestHeader(name, value);
		});
		if (request.signal) {
			request.signal.addEventListener("abort", abortXhr);
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) request.signal.removeEventListener("abort", abortXhr);
			};
		}
		xhr.send(typeof request._bodyInit === "undefined" ? null : request._bodyInit);
	});
}
fetch$1.polyfill = true;
if (!g.fetch) {
	g.fetch = fetch$1;
	g.Headers = Headers$1;
	g.Request = Request;
	g.Response = Response;
}
//#endregion
//#region node_modules/ollama/dist/browser.mjs
var defaultPort = "11434";
var defaultHost = `http://127.0.0.1:${defaultPort}`;
var version = "0.6.3";
var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __publicField$1 = (obj, key, value) => {
	__defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
	return value;
};
var ResponseError = class ResponseError extends Error {
	constructor(error, status_code) {
		super(error);
		this.error = error;
		this.status_code = status_code;
		this.name = "ResponseError";
		if (Error.captureStackTrace) Error.captureStackTrace(this, ResponseError);
	}
};
var AbortableAsyncIterator = class {
	constructor(abortController, itr, doneCallback) {
		__publicField$1(this, "abortController");
		__publicField$1(this, "itr");
		__publicField$1(this, "doneCallback");
		this.abortController = abortController;
		this.itr = itr;
		this.doneCallback = doneCallback;
	}
	abort() {
		this.abortController.abort();
	}
	async *[Symbol.asyncIterator]() {
		for await (const message of this.itr) {
			if ("error" in message) throw new Error(message.error);
			yield message;
			if (message.done || message.status === "success") {
				this.doneCallback();
				return;
			}
		}
		throw new Error("Did not receive done or success response in stream.");
	}
};
var checkOk = async (response) => {
	if (response.ok) return;
	let message = `Error ${response.status}: ${response.statusText}`;
	let errorData = null;
	if (response.headers.get("content-type")?.includes("application/json")) try {
		errorData = await response.json();
		message = errorData.error || message;
	} catch (error) {
		console.log("Failed to parse error response as JSON");
	}
	else try {
		console.log("Getting text from response");
		message = await response.text() || message;
	} catch (error) {
		console.log("Failed to get text from error response");
	}
	throw new ResponseError(message, response.status);
};
function getPlatform() {
	if (typeof window !== "undefined" && window.navigator) {
		const nav = navigator;
		if ("userAgentData" in nav && nav.userAgentData?.platform) return `${nav.userAgentData.platform.toLowerCase()} Browser/${navigator.userAgent};`;
		if (navigator.platform) return `${navigator.platform.toLowerCase()} Browser/${navigator.userAgent};`;
		return `unknown Browser/${navigator.userAgent};`;
	} else if (typeof process !== "undefined") return `${process.arch} ${process.platform} Node.js/${process.version}`;
	return "";
}
function normalizeHeaders(headers) {
	if (headers instanceof Headers) {
		const obj = {};
		headers.forEach((value, key) => {
			obj[key] = value;
		});
		return obj;
	} else if (Array.isArray(headers)) return Object.fromEntries(headers);
	else return headers || {};
}
var readEnvVar = (obj, key) => {
	return obj[key];
};
var fetchWithHeaders = async (fetch, url, options = {}) => {
	const defaultHeaders = {
		"Content-Type": "application/json",
		Accept: "application/json",
		"User-Agent": `ollama-js/${version} (${getPlatform()})`
	};
	options.headers = normalizeHeaders(options.headers);
	try {
		const parsed = new URL(url);
		if (parsed.protocol === "https:" && parsed.hostname === "ollama.com") {
			const apiKey = typeof process === "object" && process !== null && typeof process.env === "object" && process.env !== null ? readEnvVar(process.env, "OLLAMA_API_KEY") : void 0;
			if (!(options.headers["authorization"] || options.headers["Authorization"]) && apiKey) options.headers["Authorization"] = `Bearer ${apiKey}`;
		}
	} catch (error) {
		console.error("error parsing url", error);
	}
	const customHeaders = Object.fromEntries(Object.entries(options.headers).filter(([key]) => !Object.keys(defaultHeaders).some((defaultKey) => defaultKey.toLowerCase() === key.toLowerCase())));
	options.headers = {
		...defaultHeaders,
		...customHeaders
	};
	return fetch(url, options);
};
var get = async (fetch, host, options) => {
	const response = await fetchWithHeaders(fetch, host, { headers: options?.headers });
	await checkOk(response);
	return response;
};
var post = async (fetch, host, data, options) => {
	const isRecord = (input) => {
		return input !== null && typeof input === "object" && !Array.isArray(input);
	};
	const response = await fetchWithHeaders(fetch, host, {
		method: "POST",
		body: isRecord(data) ? JSON.stringify(data) : data,
		signal: options?.signal,
		headers: options?.headers
	});
	await checkOk(response);
	return response;
};
var del = async (fetch, host, data, options) => {
	const response = await fetchWithHeaders(fetch, host, {
		method: "DELETE",
		body: JSON.stringify(data),
		headers: options?.headers
	});
	await checkOk(response);
	return response;
};
var parseJSON = async function* (itr) {
	const decoder = new TextDecoder("utf-8");
	let buffer = "";
	const reader = itr.getReader();
	while (true) {
		const { done, value: chunk } = await reader.read();
		if (done) break;
		buffer += decoder.decode(chunk, { stream: true });
		const parts = buffer.split("\n");
		buffer = parts.pop() ?? "";
		for (const part of parts) try {
			yield JSON.parse(part);
		} catch (error) {
			console.warn("invalid json: ", part);
		}
	}
	buffer += decoder.decode();
	for (const part of buffer.split("\n").filter((p) => p !== "")) try {
		yield JSON.parse(part);
	} catch (error) {
		console.warn("invalid json: ", part);
	}
};
var formatHost = (host) => {
	if (!host) return defaultHost;
	let isExplicitProtocol = host.includes("://");
	if (host.startsWith(":")) {
		host = `http://127.0.0.1${host}`;
		isExplicitProtocol = true;
	}
	if (!isExplicitProtocol) host = `http://${host}`;
	const url = new URL(host);
	let port = url.port;
	if (!port) if (!isExplicitProtocol) port = defaultPort;
	else port = url.protocol === "https:" ? "443" : "80";
	let auth = "";
	if (url.username) {
		auth = url.username;
		if (url.password) auth += `:${url.password}`;
		auth += "@";
	}
	let formattedHost = `${url.protocol}//${auth}${url.hostname}:${port}${url.pathname}`;
	if (formattedHost.endsWith("/")) formattedHost = formattedHost.slice(0, -1);
	return formattedHost;
};
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {
	enumerable: true,
	configurable: true,
	writable: true,
	value
}) : obj[key] = value;
var __publicField = (obj, key, value) => {
	__defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
	return value;
};
var Ollama$1 = class Ollama {
	constructor(config) {
		__publicField(this, "config");
		__publicField(this, "fetch");
		__publicField(this, "ongoingStreamedRequests", []);
		this.config = {
			host: "",
			headers: config?.headers
		};
		if (!config?.proxy) this.config.host = formatHost(config?.host ?? defaultHost);
		this.fetch = config?.fetch ?? fetch;
	}
	abort() {
		for (const request of this.ongoingStreamedRequests) request.abort();
		this.ongoingStreamedRequests.length = 0;
	}
	/**
	* Processes a request to the Ollama server. If the request is streamable, it will return a
	* AbortableAsyncIterator that yields the response messages. Otherwise, it will return the response
	* object.
	* @param endpoint {string} - The endpoint to send the request to.
	* @param request {object} - The request object to send to the endpoint.
	* @protected {T | AbortableAsyncIterator<T>} - The response object or a AbortableAsyncIterator that yields
	* response messages.
	* @throws {Error} - If the response body is missing or if the response is an error.
	* @returns {Promise<T | AbortableAsyncIterator<T>>} - The response object or a AbortableAsyncIterator that yields the streamed response.
	*/
	async processStreamableRequest(endpoint, request) {
		request.stream = request.stream ?? false;
		const host = `${this.config.host}/api/${endpoint}`;
		if (request.stream) {
			const abortController = new AbortController();
			const response2 = await post(this.fetch, host, request, {
				signal: abortController.signal,
				headers: this.config.headers
			});
			if (!response2.body) throw new Error("Missing body");
			const abortableAsyncIterator = new AbortableAsyncIterator(abortController, parseJSON(response2.body), () => {
				const i = this.ongoingStreamedRequests.indexOf(abortableAsyncIterator);
				if (i > -1) this.ongoingStreamedRequests.splice(i, 1);
			});
			this.ongoingStreamedRequests.push(abortableAsyncIterator);
			return abortableAsyncIterator;
		}
		return await (await post(this.fetch, host, request, { headers: this.config.headers })).json();
	}
	/**
	* Encodes an image to base64 if it is a Uint8Array.
	* @param image {Uint8Array | string} - The image to encode.
	* @returns {Promise<string>} - The base64 encoded image.
	*/
	async encodeImage(image) {
		if (typeof image !== "string") {
			const uint8Array = new Uint8Array(image);
			let byteString = "";
			const len = uint8Array.byteLength;
			for (let i = 0; i < len; i++) byteString += String.fromCharCode(uint8Array[i]);
			return btoa(byteString);
		}
		return image;
	}
	/**
	* Generates a response from a text prompt.
	* @param request {GenerateRequest} - The request object.
	* @returns {Promise<GenerateResponse | AbortableAsyncIterator<GenerateResponse>>} - The response object or
	* an AbortableAsyncIterator that yields response messages.
	*/
	async generate(request) {
		if (request.images) request.images = await Promise.all(request.images.map(this.encodeImage.bind(this)));
		return this.processStreamableRequest("generate", request);
	}
	/**
	* Chats with the model. The request object can contain messages with images that are either
	* Uint8Arrays or base64 encoded strings. The images will be base64 encoded before sending the
	* request.
	* @param request {ChatRequest} - The request object.
	* @returns {Promise<ChatResponse | AbortableAsyncIterator<ChatResponse>>} - The response object or an
	* AbortableAsyncIterator that yields response messages.
	*/
	async chat(request) {
		if (request.messages) {
			for (const message of request.messages) if (message.images) message.images = await Promise.all(message.images.map(this.encodeImage.bind(this)));
		}
		return this.processStreamableRequest("chat", request);
	}
	/**
	* Creates a new model from a stream of data.
	* @param request {CreateRequest} - The request object.
	* @returns {Promise<ProgressResponse | AbortableAsyncIterator<ProgressResponse>>} - The response object or a stream of progress responses.
	*/
	async create(request) {
		return this.processStreamableRequest("create", { ...request });
	}
	/**
	* Pulls a model from the Ollama registry. The request object can contain a stream flag to indicate if the
	* response should be streamed.
	* @param request {PullRequest} - The request object.
	* @returns {Promise<ProgressResponse | AbortableAsyncIterator<ProgressResponse>>} - The response object or
	* an AbortableAsyncIterator that yields response messages.
	*/
	async pull(request) {
		return this.processStreamableRequest("pull", {
			name: request.model,
			stream: request.stream,
			insecure: request.insecure
		});
	}
	/**
	* Pushes a model to the Ollama registry. The request object can contain a stream flag to indicate if the
	* response should be streamed.
	* @param request {PushRequest} - The request object.
	* @returns {Promise<ProgressResponse | AbortableAsyncIterator<ProgressResponse>>} - The response object or
	* an AbortableAsyncIterator that yields response messages.
	*/
	async push(request) {
		return this.processStreamableRequest("push", {
			name: request.model,
			stream: request.stream,
			insecure: request.insecure
		});
	}
	/**
	* Deletes a model from the server. The request object should contain the name of the model to
	* delete.
	* @param request {DeleteRequest} - The request object.
	* @returns {Promise<StatusResponse>} - The response object.
	*/
	async delete(request) {
		await del(this.fetch, `${this.config.host}/api/delete`, { name: request.model }, { headers: this.config.headers });
		return { status: "success" };
	}
	/**
	* Copies a model from one name to another. The request object should contain the name of the
	* model to copy and the new name.
	* @param request {CopyRequest} - The request object.
	* @returns {Promise<StatusResponse>} - The response object.
	*/
	async copy(request) {
		await post(this.fetch, `${this.config.host}/api/copy`, { ...request }, { headers: this.config.headers });
		return { status: "success" };
	}
	/**
	* Lists the models on the server.
	* @returns {Promise<ListResponse>} - The response object.
	* @throws {Error} - If the response body is missing.
	*/
	async list() {
		return await (await get(this.fetch, `${this.config.host}/api/tags`, { headers: this.config.headers })).json();
	}
	/**
	* Shows the metadata of a model. The request object should contain the name of the model.
	* @param request {ShowRequest} - The request object.
	* @returns {Promise<ShowResponse>} - The response object.
	*/
	async show(request) {
		return await (await post(this.fetch, `${this.config.host}/api/show`, { ...request }, { headers: this.config.headers })).json();
	}
	/**
	* Embeds text input into vectors.
	* @param request {EmbedRequest} - The request object.
	* @returns {Promise<EmbedResponse>} - The response object.
	*/
	async embed(request) {
		return await (await post(this.fetch, `${this.config.host}/api/embed`, { ...request }, { headers: this.config.headers })).json();
	}
	/**
	* Embeds a text prompt into a vector.
	* @param request {EmbeddingsRequest} - The request object.
	* @returns {Promise<EmbeddingsResponse>} - The response object.
	*/
	async embeddings(request) {
		return await (await post(this.fetch, `${this.config.host}/api/embeddings`, { ...request }, { headers: this.config.headers })).json();
	}
	/**
	* Lists the running models on the server
	* @returns {Promise<ListResponse>} - The response object.
	* @throws {Error} - If the response body is missing.
	*/
	async ps() {
		return await (await get(this.fetch, `${this.config.host}/api/ps`, { headers: this.config.headers })).json();
	}
	/**
	* Returns the Ollama server version.
	* @returns {Promise<VersionResponse>} - The server version object.
	*/
	async version() {
		return await (await get(this.fetch, `${this.config.host}/api/version`, { headers: this.config.headers })).json();
	}
	/**
	* Performs web search using the Ollama web search API
	* @param request {WebSearchRequest} - The search request containing query and options
	* @returns {Promise<WebSearchResponse>} - The search results
	* @throws {Error} - If the request is invalid or the server returns an error
	*/
	async webSearch(request) {
		if (!request.query || request.query.length === 0) throw new Error("Query is required");
		return await (await post(this.fetch, `https://ollama.com/api/web_search`, { ...request }, { headers: this.config.headers })).json();
	}
	/**
	* Fetches a single page using the Ollama web fetch API
	* @param request {WebFetchRequest} - The fetch request containing a URL
	* @returns {Promise<WebFetchResponse>} - The fetch result
	* @throws {Error} - If the request is invalid or the server returns an error
	*/
	async webFetch(request) {
		if (!request.url || request.url.length === 0) throw new Error("URL is required");
		return await (await post(this.fetch, `https://ollama.com/api/web_fetch`, { ...request }, { headers: this.config.headers })).json();
	}
};
var browser = new Ollama$1();
//#endregion
//#region node_modules/ollama/dist/index.mjs
var Ollama = class extends Ollama$1 {
	async encodeImage(image) {
		if (typeof image !== "string") return Buffer.from(image).toString("base64");
		try {
			if (node_fs$1.default.existsSync(image)) {
				const fileBuffer = await node_fs$1.promises.readFile((0, node_path.resolve)(image));
				return Buffer.from(fileBuffer).toString("base64");
			}
		} catch {}
		return image;
	}
	/**
	* checks if a file exists
	* @param path {string} - The path to the file
	* @private @internal
	* @returns {Promise<boolean>} - Whether the file exists or not
	*/
	async fileExists(path) {
		try {
			await node_fs$1.promises.access(path);
			return true;
		} catch {
			return false;
		}
	}
	async create(request) {
		if (request.from && await this.fileExists((0, node_path.resolve)(request.from))) throw Error("Creating with a local path is not currently supported from ollama-js");
		if (request.stream) return super.create(request);
		else return super.create(request);
	}
};
var index = new Ollama();
//#endregion
//#region electron/ollama.ts
var currentHost = "http://127.0.0.1:11434";
var ollama = new Ollama({ host: currentHost });
var activeStreams = /* @__PURE__ */ new Map();
var getOllamaInstance = () => {
	const host = DB.getSettings().ollamaUrl || "http://127.0.0.1:11434";
	if (host !== currentHost) {
		currentHost = host;
		ollama = new Ollama({ host: currentHost });
	}
	return ollama;
};
var ollamaService = {
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
			return (await getOllamaInstance().list()).models.map((m) => ({ name: m.name }));
		} catch (error) {
			console.error("Failed to list Ollama models:", error);
			throw new Error(error.message || String(error));
		}
	},
	streamChat: async (sessionId, model, messages, system, temperature) => {
		const finalMessages = [...messages];
		if (system && finalMessages[0]?.role !== "system") finalMessages.unshift({
			role: "system",
			content: system
		});
		const stream = await getOllamaInstance().chat({
			model,
			messages: finalMessages,
			stream: true,
			options: temperature !== void 0 ? { temperature } : void 0
		});
		activeStreams.set(sessionId, stream);
		return stream;
	},
	stopStream: (sessionId) => {
		const stream = activeStreams.get(sessionId);
		if (stream && typeof stream.abort === "function") {
			stream.abort();
			activeStreams.delete(sessionId);
		}
	},
	deleteModel: async (model) => {
		return await getOllamaInstance().delete({ model });
	},
	pullModel: async (model) => {
		return await getOllamaInstance().pull({
			model,
			stream: true
		});
	},
	ensureModel: async (model) => {
		if (!(await ollamaService.listModels()).some((m) => m.name.startsWith(model) || m.name === model)) {
			console.log(`Pulling required model: ${model}...`);
			const stream = await getOllamaInstance().pull({
				model,
				stream: true
			});
			for await (const chunk of stream);
		}
	},
	generateEmbedding: async (model, text) => {
		return (await getOllamaInstance().embeddings({
			model,
			prompt: text
		})).embedding;
	},
	generateTitle: async (model, prompt) => {
		return (await getOllamaInstance().chat({
			model,
			messages: [{
				role: "system",
				content: "You are a helpful assistant. Generate a very short, 3 to 5 word title for the user's prompt. Do not include quotes, prefixes, or any conversational text. Just output the title."
			}, {
				role: "user",
				content: prompt
			}],
			stream: false
		})).message.content;
	}
};
//#endregion
//#region electron/main.ts
process.env.DIST = node_path.default.join(__dirname, "../dist");
process.env.VITE_PUBLIC = electron.app.isPackaged ? process.env.DIST : node_path.default.join(process.env.DIST, "../public");
var win;
var VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
function cosineSimilarity(A, B) {
	let dotProduct = 0, normA = 0, normB = 0;
	for (let i = 0; i < A.length; i++) {
		dotProduct += A[i] * B[i];
		normA += A[i] * A[i];
		normB += B[i] * B[i];
	}
	return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
function createWindow() {
	win = new electron.BrowserWindow({
		width: 1200,
		height: 800,
		titleBarStyle: "hiddenInset",
		icon: node_path.default.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
		webPreferences: {
			preload: node_path.default.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false
		}
	});
	if (VITE_DEV_SERVER_URL) win.loadURL(VITE_DEV_SERVER_URL);
	else win.loadFile(node_path.default.join(process.env.DIST, "index.html"));
}
electron.app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		electron.app.quit();
		win = null;
	}
});
electron.app.on("activate", () => {
	if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
});
electron.app.whenReady().then(() => {
	createWindow();
	electron.ipcMain.handle("get-sessions", () => DB.getSessions());
	electron.ipcMain.handle("create-session", (_, id, title) => {
		DB.createSession(id, title);
		return true;
	});
	electron.ipcMain.handle("get-messages", (_, sessionId) => DB.getMessages(sessionId));
	electron.ipcMain.handle("delete-session", (_, id) => DB.deleteSession(id));
	electron.ipcMain.handle("rename-session", (_, id, title) => DB.renameSession(id, title));
	electron.ipcMain.handle("delete-last-message", (_, sessionId) => DB.deleteLastAssistantMessage(sessionId));
	electron.ipcMain.handle("generate-title", async (_, sessionId, model, prompt) => {
		try {
			const title = (await ollamaService.generateTitle(model, prompt)).replace(/["']/g, "").trim();
			DB.renameSession(sessionId, title);
			return title;
		} catch (e) {
			console.error("Failed to generate title", e);
			return null;
		}
	});
	electron.ipcMain.handle("get-settings", () => DB.getSettings());
	electron.ipcMain.handle("save-settings", (_, settings) => DB.saveSettings(settings));
	electron.ipcMain.on("chat-stop", (_, sessionId) => ollamaService.stopStream(sessionId));
	electron.ipcMain.handle("select-file", async () => {
		if (!win) return null;
		const result = await electron.dialog.showOpenDialog(win, {
			properties: ["openFile"],
			filters: [{
				name: "Images",
				extensions: [
					"jpg",
					"png",
					"jpeg",
					"webp"
				]
			}, {
				name: "Documents",
				extensions: ["txt", "md"]
			}]
		});
		if (result.canceled || result.filePaths.length === 0) return null;
		const filePath = result.filePaths[0];
		const ext = filePath.split(".").pop()?.toLowerCase();
		if ([
			"jpg",
			"png",
			"jpeg",
			"webp"
		].includes(ext || "")) return {
			type: "image",
			data: node_fs.default.readFileSync(filePath, "base64"),
			path: filePath
		};
		else return {
			type: "document",
			data: node_fs.default.readFileSync(filePath, "utf-8"),
			path: filePath
		};
	});
	electron.ipcMain.handle("process-document", async (_, sessionId, text) => {
		const EMBEDDING_MODEL = "nomic-embed-text";
		await ollamaService.ensureModel(EMBEDDING_MODEL);
		const chunks = text.split(/\n\s*\n/).filter((c) => c.trim().length > 0);
		for (const chunk of chunks) {
			const embedding = await ollamaService.generateEmbedding(EMBEDDING_MODEL, chunk);
			DB.saveDocumentChunk(sessionId, chunk, embedding);
		}
		return chunks.length;
	});
	electron.ipcMain.handle("ollama-list", async () => await ollamaService.listModels());
	electron.ipcMain.handle("ollama-delete", async (_, model) => await ollamaService.deleteModel(model));
	electron.ipcMain.on("ollama-pull", async (event, model) => {
		try {
			const stream = await ollamaService.pullModel(model);
			for await (const chunk of stream) event.sender.send(`pull-chunk-${model}`, chunk);
			event.sender.send(`pull-end-${model}`);
		} catch (error) {
			console.error(error);
			event.sender.send(`pull-error-${model}`, error.message);
		}
	});
	electron.ipcMain.on("chat-stream", async (event, { sessionId, messages, model }) => {
		try {
			const lastUserMsg = messages[messages.length - 1];
			const images = lastUserMsg.images || [];
			DB.saveMessage(sessionId, "user", lastUserMsg.content, images);
			const chunks = DB.getDocumentChunks(sessionId);
			let ragContext = "";
			if (chunks.length > 0) {
				await ollamaService.ensureModel("nomic-embed-text");
				const promptEmbedding = await ollamaService.generateEmbedding("nomic-embed-text", lastUserMsg.content);
				const scoredChunks = chunks.map((c) => ({
					text: c.text,
					score: cosineSimilarity(promptEmbedding, c.embedding)
				}));
				scoredChunks.sort((a, b) => b.score - a.score);
				const topChunks = scoredChunks.slice(0, 3).map((c) => c.text);
				if (topChunks.length > 0) ragContext = "Relevant Context:\n" + topChunks.join("\n\n") + "\n\n";
			}
			const settings = DB.getSettings();
			let systemPrompt = settings.systemPrompt || "";
			if (ragContext) systemPrompt = ragContext + systemPrompt;
			const temperature = settings.temperature ? parseFloat(settings.temperature) : void 0;
			const stream = await ollamaService.streamChat(sessionId, model, messages, systemPrompt, temperature);
			let assistantResponse = "";
			for await (const chunk of stream) {
				assistantResponse += chunk.message.content;
				event.sender.send(`chat-stream-chunk-${sessionId}`, chunk.message.content);
			}
			DB.saveMessage(sessionId, "assistant", assistantResponse);
			event.sender.send(`chat-stream-end-${sessionId}`);
		} catch (error) {
			console.error(error);
			event.sender.send(`chat-stream-error-${sessionId}`, error.message);
			ollamaService.stopStream(sessionId);
		}
	});
});
//#endregion
