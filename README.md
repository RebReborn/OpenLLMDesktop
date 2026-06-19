# 🌌 OpenLLM Desktop

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-Latest-47848F?logo=electron&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-Local_AI-white)

OpenLLM Desktop is a blazing-fast, privacy-first, and beautifully designed desktop application for running Large Language Models (LLMs) locally on your machine. Powered by [Ollama](https://ollama.ai), it gives you a top-tier ChatGPT-like experience completely offline, packed with advanced features designed for power users and developers.

---

## ✨ Features

* **🔒 100% Private & Offline**: All AI processing happens locally on your hardware. Your data never leaves your machine.
* **🖼️ Multi-Modal Vision**: Upload images directly into the chat. Use vision models (like `llava` or `moondream`) to analyze, describe, or extract text from photos.
* **📄 Document Chat (Mini-RAG)**: Upload `.txt` or `.md` files. The app automatically chunks, embeds, and vector-searches your documents to inject highly relevant context into your chats.
* **⚙️ Built-In Model Management**: Search, pull, and delete Ollama models directly from the UI. No terminal required!
* **💾 Persistent History**: All chat sessions are saved locally using an ultra-fast `better-sqlite3` database. Easily search, rename, and manage your past conversations.
* **🛠️ Advanced Settings**: Configure custom system personas, adjust AI creativity (temperature), or connect to a remote Ollama server on your local network.
* **💻 Developer Ready**: Beautiful Markdown rendering, syntax-highlighted code blocks, and one-click "Copy Code" functionality.
* **⚡ Fluid UX**: Real-time streaming generation, slick loading animations, and the ability to instantly stop or regenerate AI responses.

---

## 🚀 Getting Started

### Prerequisites
Before installing the application, ensure you meet the system requirements. Please see [REQUIREMENTS.md](./REQUIREMENTS.md) for detailed hardware and software prerequisites.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/OpenLLMDesktop.git
   cd OpenLLMDesktop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Rebuild native modules**
   *(Required to compile `better-sqlite3` for Electron)*
   ```bash
   npm run rebuild
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

### Building for Production
To package the app into a standalone executable for your operating system:
```bash
npm run build
```

---

## 📸 Screenshots & Samples

### 💬 The Main Interface
A clean, dark-themed UI focused on your conversations. Easily switch models from the top dropdown, start new chats, or search through your history.

### 🖼️ Vision Capabilities
* **User**: `[Attached: image.png]` "What programming language is shown in this code snippet?"
* **AI**: "The image displays a code snippet written in **TypeScript**. I can identify this from the static typing syntax used in the interface definition..."

### 📄 Document RAG
* **User**: `[Attached: quarterly_report.md]` "Summarize Q3 revenue."
* **AI**: *(Silently vectors the document, finds relevant chunks, and answers)* "Based on the attached report, Q3 revenue reached $4.2 million, representing a 15% growth over Q2."

---

## 🛠️ Tech Stack

* **Frontend**: React 18, Vite, Tailwind CSS, Zustand, Lucide Icons
* **Backend**: Electron, Node.js, better-sqlite3
* **AI SDK**: Ollama JavaScript SDK
* **Markdown**: react-markdown, remark-gfm, react-syntax-highlighter

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check [issues page](https://github.com/yourusername/OpenLLMDesktop/issues) if you want to contribute.

## 📝 License

This project is [MIT](https://opensource.org/licenses/MIT) licensed.
