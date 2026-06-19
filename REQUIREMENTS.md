# 💻 System Prerequisites & Requirements

To run **OpenLLM Desktop** and perform local AI inference, your system must meet specific software and hardware requirements.

## 🛠️ Software Requirements

1. **[Ollama](https://ollama.ai/) (Required)**
   - Ollama acts as the backend AI engine for this application. It must be installed and running in the background.
   - You can download it for Windows, macOS, or Linux from their official website.
   - *Note: If you have Ollama hosted on a remote server/NAS, you do not need it installed locally. Simply update the Ollama URL in the app's Advanced Settings.*

2. **[Node.js](https://nodejs.org/) (Required for Development/Source Installation)**
   - **Version**: 18.x or higher.
   - Required to install packages and run the Electron/Vite development server.

3. **C++ Build Tools (Required for Development)**
   - This app uses `better-sqlite3`, which contains native C++ bindings that must be compiled for Electron.
   - **Windows**: Install the "Desktop development with C++" workload via Visual Studio Installer, or run `npm install --global windows-build-tools`.
   - **macOS**: Run `xcode-select --install` in your terminal.
   - **Linux**: Install `python3`, `make`, and `g++` (e.g., `sudo apt install python3 make g++`).

---

## 🖥️ Hardware Requirements

Local AI inference is highly dependent on your system's RAM and VRAM (Video RAM). The app itself is incredibly lightweight, but the *models* require resources.

### Minimum Specifications (for tiny models)
* **OS**: Windows 10/11, macOS 12+, or modern Linux.
* **RAM**: 8 GB system RAM.
* **GPU**: None required (Ollama can run on CPU, but it will be slower).
* **Storage**: 2 GB free space (for a small model like `qwen2:1.5b` or `moondream`).

### Recommended Specifications (for standard models)
* **OS**: Windows 10/11, macOS 12+, or modern Linux.
* **RAM**: 16 GB system RAM.
* **GPU**: Any dedicated Nvidia/AMD GPU with **6GB+ VRAM**, or an Apple Silicon Mac (M1/M2/M3) with Unified Memory.
* **Storage**: 15+ GB free space (to store multiple 8B parameter models like `llama3` or `phi3`).

### High-End Specifications (for heavy models)
If you wish to run massive 70B parameter models (like `llama3:70b`):
* **RAM**: 64+ GB system RAM.
* **GPU**: Nvidia RTX 3090 / 4090 (24GB VRAM), or high-end Apple Silicon (M-series Max/Ultra with 64GB+ Unified Memory).

---

## 📦 Bundled Application

If you download the pre-compiled standalone executable from the Releases page, you **do not** need Node.js or C++ Build Tools. The only requirement is having **Ollama** installed on your system or network.
