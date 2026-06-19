import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState('0.7');
  const [ollamaUrl, setOllamaUrl] = useState('http://127.0.0.1:11434');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      window.api.getSettings().then((settings) => {
        if (settings.systemPrompt !== undefined) setSystemPrompt(settings.systemPrompt);
        if (settings.temperature !== undefined) setTemperature(settings.temperature);
        if (settings.ollamaUrl !== undefined) setOllamaUrl(settings.ollamaUrl);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    await window.api.saveSettings({
      systemPrompt,
      temperature,
      ollamaUrl,
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 non-drag-region">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-[500px] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-slate-100">Advanced Settings</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="e.g. You are a helpful, expert AI assistant."
              className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 resize-none"
            />
            <p className="text-xs text-slate-500">Guides the AI's behavior and personality for all chats.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300 flex justify-between">
              <span>Temperature: {temperature}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full accent-blue-500"
            />
            <p className="text-xs text-slate-500">Higher values make output more creative, lower values make it more focused.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Ollama API URL</label>
            <input
              type="text"
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              placeholder="http://127.0.0.1:11434"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-slate-500">Change this if your Ollama instance is hosted on another machine.</p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
          >
            <Save size={16} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
