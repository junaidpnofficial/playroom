import React, { useState } from 'react';
import {
  clearAllResults,
  exportDataAsJSON,
  getResults,
  importDataFromJSON,
  isAdminAuthenticated,
  setAdminAuthenticated,
  ADMIN_NAME,
} from '../../utils/storage';
import { formatScore, GAME_MAP } from '../../data/gamesMeta';
import { Download, Upload, Trash2, CheckCircle2, Lock, Unlock, ShieldCheck } from 'lucide-react';

interface AdminViewProps {
  onRefresh: () => void;
  onLockAdmin: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onRefresh, onLockAdmin }) => {
  const [results, setResults] = useState(() => getResults());
  const [isArmed, setIsArmed] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState('');

  const isAuth = isAdminAuthenticated();

  if (!isAuth) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black font-display text-slate-900 dark:text-white mb-2">
          🔒 Admin Locked
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 font-medium">
          This area is locked. Only the administrator (<strong>{ADMIN_NAME}</strong>) can view the results of all players and manage the arcade database.
        </p>
        <button
          onClick={onLockAdmin}
          className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-transform active:scale-95 cursor-pointer inline-flex items-center gap-2"
        >
          <Unlock className="w-4 h-4" />
          <span>Enter Admin Password</span>
        </button>
      </div>
    );
  }

  const handleClear = () => {
    if (!isArmed) {
      setIsArmed(true);
      return;
    }
    clearAllResults();
    setResults([]);
    setIsArmed(false);
    setNotice('All records have been reset.');
    onRefresh();
  };

  const handleExport = () => {
    const json = exportDataAsJSON();
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = importDataFromJSON(importText);
    if (ok) {
      setResults(getResults());
      setShowImportBox(false);
      setImportText('');
      setNotice('Backup data successfully imported!');
      onRefresh();
    } else {
      setNotice('Invalid JSON format. Please check the backup string.');
    }
  };

  const handleLockSession = () => {
    setAdminAuthenticated(false);
    onLockAdmin();
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight">
              🔓 Admin Console
            </h2>
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Admin ({ADMIN_NAME})</span>
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Viewing all {results.length} results recorded across every player.
          </p>
        </div>

        <button
          onClick={handleLockSession}
          className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl border-2 border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors cursor-pointer shadow-xs"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Lock Admin</span>
        </button>
      </div>

      {notice && (
        <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Action controls */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 py-2 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-xs font-bold text-slate-700 dark:text-white hover:border-blue-600 transition-colors cursor-pointer shadow-xs"
        >
          <Download className="w-4 h-4 text-blue-600" />
          <span>{copied ? 'Copied JSON to Clipboard!' : 'Export All Results'}</span>
        </button>

        <button
          onClick={() => setShowImportBox(!showImportBox)}
          className="flex items-center gap-1.5 py-2 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-xs font-bold text-slate-700 dark:text-white hover:border-blue-600 transition-colors cursor-pointer shadow-xs"
        >
          <Upload className="w-4 h-4 text-blue-600" />
          <span>Import Results Backup</span>
        </button>

        <button
          onClick={handleClear}
          className={`flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isArmed
              ? 'bg-rose-600 text-white animate-pulse'
              : 'border-2 border-rose-200 dark:border-rose-900 bg-white dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-50'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>{isArmed ? 'Tap Again to Confirm Clear' : 'Clear All Results'}</span>
        </button>
      </div>

      {/* Import box */}
      {showImportBox && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#131b2e] border-2 border-slate-200 dark:border-slate-800 mb-6 shadow-sm">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
            Paste JSON Backup to Restore
          </h4>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={4}
            placeholder='{"profile": ..., "results": [...]}'
            className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              className="py-1.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
            >
              Apply Import
            </button>
            <button
              onClick={() => setShowImportBox(false)}
              className="py-1.5 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* All Results Table for Admin */}
      <div className="bg-white dark:bg-[#131b2e] rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            All Players' Results ({results.length})
          </h3>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
            Confidential Admin View
          </span>
        </div>

        {results.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 font-bold">
            No records in database.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white dark:bg-[#131b2e]">
                <tr className="border-b-2 border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-3">Player</th>
                  <th className="py-2.5 px-3">Game</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {results.slice(0, 100).map((r) => {
                  const meta = GAME_MAP[r.gameId];
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {r.n}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-bold">
                        <span>{meta?.icon || '🎮'}</span>
                        <span>{r.g}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono-nums font-black text-blue-600 dark:text-blue-400">
                        {formatScore(r.gameId, r.v)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-xs text-slate-500 dark:text-slate-400 font-mono-nums font-semibold">
                        {new Date(r.t).toLocaleDateString([], {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
