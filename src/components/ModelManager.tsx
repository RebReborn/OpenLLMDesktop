import { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { X, Trash2, Download } from 'lucide-react';

export default function ModelManager({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { models, loadModels } = useChatStore();
  const [modelName, setModelName] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [pullStatus, setPullStatus] = useState('');

  if (!isOpen) return null;

  const handleDelete = async (model: string) => {
    if (confirm(`Are you sure you want to delete ${model}?`)) {
      await window.api.deleteModel(model);
      await loadModels();
    }
  };

  const handlePull = async () => {
    const targetModel = modelName.trim();
    if (!targetModel) return;
    setIsPulling(true);
    setPullProgress(0);
    setPullStatus('Starting download...');

    window.api.onPullChunk(targetModel, (chunk: any) => {
      setPullStatus(chunk.status || 'Downloading...');
      if (chunk.total) {
        setPullProgress(Math.round((chunk.completed / chunk.total) * 100));
      }
    });

    window.api.onPullEnd(targetModel, () => {
      setIsPulling(false);
      setPullStatus('');
      setModelName('');
      window.api.removeAllListeners(`pull-chunk-${targetModel}`);
      window.api.removeAllListeners(`pull-end-${targetModel}`);
      window.api.removeAllListeners(`pull-error-${targetModel}`);
      loadModels();
    });

    window.api.onPullError(targetModel, (err) => {
      setIsPulling(false);
      setPullStatus(`Error: ${err}`);
      window.api.removeAllListeners(`pull-chunk-${targetModel}`);
      window.api.removeAllListeners(`pull-end-${targetModel}`);
      window.api.removeAllListeners(`pull-error-${targetModel}`);
    });

    window.api.pullModel(targetModel);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 non-drag-region">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-[500px] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-slate-100">Manage Models</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Download New Model */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Download Model</h3>
            <div className="flex gap-2">
              <input
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g. llama3, mistral, phi3"
                disabled={isPulling}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handlePull}
                disabled={isPulling || !modelName.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <Download size={16} />
                Pull
              </button>
            </div>
            
            {isPulling && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{pullStatus}</span>
                  <span>{pullProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${pullProgress}%` }} />
                </div>
              </div>
            )}
            {!isPulling && pullStatus && pullStatus.startsWith('Error:') && (
              <div className="text-red-400 text-xs">{pullStatus}</div>
            )}
          </div>

          {/* Installed Models */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Installed Models ({models.length})</h3>
            <div className="max-h-[250px] overflow-y-auto space-y-2 pr-2">
              {models.length === 0 && (
                <div className="text-slate-500 text-sm italic">No models installed.</div>
              )}
              {models.map((m) => (
                <div key={m.name} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                  <span className="text-slate-200 font-medium">{m.name}</span>
                  <button 
                    onClick={() => handleDelete(m.name)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-1.5 rounded transition"
                    title="Delete model"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
