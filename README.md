# OpenLLM Desktop

OpenLLM Desktop is a fast, privacy-first desktop application for running Large Language Models (LLMs) locally on your machine. Powered by Ollama, it provides a ChatGPT-like experience completely offline, packed with advanced features designed for power users and developers.

## Features

* 100% Private & Offline: All AI processing happens locally on your hardware. Your data never leaves your machine.
* Multi-Modal Vision: Upload images directly into the chat. Use vision models (like llava or moondream) to analyze, describe, or extract text from photos.
* Document Chat (Mini-RAG): Upload .txt or .md files. The app automatically chunks, embeds, and vector-searches your documents to inject highly relevant context into your chats.
* Built-In Model Management: Search, pull, and delete Ollama models directly from the UI. No terminal required.
* Persistent History: All chat sessions are saved locally using an ultra-fast better-sqlite3 database. Easily search, rename, and manage your past conversations.
* Advanced Settings: Configure custom system personas, adjust AI creativity (temperature), or connect to a remote Ollama server on your local network.
* Developer Ready: Beautiful Markdown rendering, syntax-highlighted code blocks, and one-click "Copy Code" functionality.
* Fluid UX: Real-time streaming generation, smooth loading animations, and the ability to instantly stop or regenerate AI responses.

## Getting Started

### Prerequisites

Before installing the application, ensure you meet the system requirements:
* Ollama installed and running.
* Node.js (version 18 or higher) for development.
* C++ Build Tools (required to compile better-sqlite3 for Electron).

For detailed hardware requirements, please see REQUIREMENTS.md.

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/RebReborn/OpenLLMDesktop.git
   cd OpenLLMDesktop
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Rebuild native modules (Required to compile better-sqlite3 for Electron)
   ```bash
   npm run rebuild
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

### Building for Production

To package the app into a standalone executable for your operating system:
```bash
npm run build
```

## Tech Stack

* Frontend: React 18, Vite, Tailwind CSS, Zustand, Lucide Icons
* Backend: Electron, Node.js, better-sqlite3
* AI SDK: Ollama JavaScript SDK
* Markdown: react-markdown, remark-gfm, react-syntax-highlighter

## License

This project is licensed under the MIT License.
