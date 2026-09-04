import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getRemoteTrelloBoards, importTrelloBoard } from '../../data/trelloApi';

const TRELLO_API_KEY = import.meta.env.VITE_TRELLO_API_KEY;
const TOKEN_STORAGE_KEY = 'trello_import_token';

// Trello's classic "Key + Token" client-side authorize flow — no client
// secret involved. The user authorizes on trello.com, which redirects back
// here with the token in the URL *fragment* (never sent to any server on
// its own), so App-level code must read it off window.location.hash on
// mount before this modal ever opens — see TrelloDashboard's useEffect.
export const buildTrelloAuthorizeUrl = () => {
  const returnUrl = `${window.location.origin}/trello`;
  const params = new URLSearchParams({
    expiration: '1hour',
    name: 'Lingolandias Migration',
    scope: 'read',
    response_type: 'token',
    key: TRELLO_API_KEY || '',
    return_url: returnUrl,
  });
  return `https://trello.com/1/authorize?${params.toString()}`;
};

const TrelloImportModal = ({ userId, initialToken, onClose, onImported }) => {
  const [token, setToken] = useState(initialToken || sessionStorage.getItem(TOKEN_STORAGE_KEY) || '');
  const [remoteBoards, setRemoteBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState(null);
  const [importedIds, setImportedIds] = useState(new Set());
  const [importingAll, setImportingAll] = useState(false);

  useEffect(() => {
    if (initialToken) sessionStorage.setItem(TOKEN_STORAGE_KEY, initialToken);
  }, [initialToken]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getRemoteTrelloBoards(token)
      .then(setRemoteBoards)
      .catch((err) => {
        toast.error('Could not load your Trello boards: ' + (err?.response?.data?.message || err.message));
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken('');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleConnect = () => {
    if (!TRELLO_API_KEY) {
      toast.error('Trello import is not configured yet — missing API key.');
      return;
    }
    window.location.href = buildTrelloAuthorizeUrl();
  };

  const handleDisconnect = () => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken('');
    setRemoteBoards([]);
  };

  // Shared by both the per-row button and "Import all" — returns whether it
  // succeeded so handleImportAll can tally results without duplicating the
  // try/catch/state-update logic.
  const importOne = async (remoteBoard, { silent = false } = {}) => {
    try {
      const board = await importTrelloBoard(userId, token, remoteBoard.id);
      onImported(board);
      setImportedIds((prev) => new Set(prev).add(remoteBoard.id));
      if (!silent) toast.success(`"${remoteBoard.name}" imported!`);
      return true;
    } catch (err) {
      toast.error(`Failed to import "${remoteBoard.name}": ` + (err?.response?.data?.message || err.message));
      return false;
    }
  };

  const handleImport = async (remoteBoard) => {
    setImportingId(remoteBoard.id);
    await importOne(remoteBoard);
    setImportingId(null);
  };

  // Sequential, not parallel — keeps the "Import" buttons' per-row state
  // simple to follow and avoids hammering Trello's API / our own DB with a
  // burst of concurrent writes for accounts with many boards.
  const handleImportAll = async () => {
    const pending = remoteBoards.filter((rb) => !importedIds.has(rb.id));
    if (!pending.length) return;
    setImportingAll(true);
    let succeeded = 0;
    for (const rb of pending) {
      setImportingId(rb.id);
      const ok = await importOne(rb, { silent: true });
      if (ok) succeeded += 1;
    }
    setImportingId(null);
    setImportingAll(false);
    toast.success(`Imported ${succeeded} of ${pending.length} board${pending.length !== 1 ? 's' : ''}.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-gray-200 dark:border-[#9E2FD0]/30 max-h-[85vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Migrate from Trello</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl leading-none p-1">×</button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {!token ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Connect your real Trello account to copy your existing boards, lists, cards, due dates
                and labels into Trello 2.0. This is a one-time copy — nothing stays linked afterward.
              </p>
              <button
                onClick={handleConnect}
                className="inline-flex items-center gap-2 bg-[#0079BF] hover:bg-[#026aa7] text-white font-semibold px-6 py-3 rounded-xl transition"
              >
                Connect Trello account
              </button>
              {!TRELLO_API_KEY && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-4">
                  Not configured yet — ask an admin to set VITE_TRELLO_API_KEY.
                </p>
              )}
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="h-8 w-8 rounded-full border-4 border-[#9E2FD0]/30 border-t-[#9E2FD0] animate-spin" />
              <p className="text-sm text-gray-400 dark:text-gray-500">Loading your Trello boards...</p>
            </div>
          ) : remoteBoards.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
              No open boards found on that Trello account.
            </p>
          ) : (
            <div className="space-y-3">
              {remoteBoards.some((rb) => !importedIds.has(rb.id)) && (
                <button
                  onClick={handleImportAll}
                  disabled={importingAll}
                  className="w-full text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#0079BF] hover:bg-[#026aa7] text-white transition disabled:opacity-50"
                >
                  {importingAll ? 'Importing all boards...' : `Import all (${remoteBoards.filter((rb) => !importedIds.has(rb.id)).length})`}
                </button>
              )}
              <div className="space-y-2">
                {remoteBoards.map((rb) => {
                  const isImporting = importingId === rb.id;
                  const isImported = importedIds.has(rb.id);
                  return (
                    <div
                      key={rb.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40"
                    >
                      <span className="text-sm font-medium text-gray-800 dark:text-white truncate">{rb.name}</span>
                      <button
                        onClick={() => handleImport(rb)}
                        disabled={isImporting || isImported || importingAll}
                        className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                          isImported
                            ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'
                            : 'bg-[#9E2FD0] hover:bg-[#8a27b5] text-white disabled:opacity-50'
                        }`}
                      >
                        {isImported ? 'Imported ✓' : isImporting ? 'Importing...' : 'Import'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {token && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <button onClick={handleDisconnect} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              Disconnect Trello account
            </button>
            <button onClick={onClose} className="text-sm font-medium text-[#9E2FD0] hover:underline">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrelloImportModal;
