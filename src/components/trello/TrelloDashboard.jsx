import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { getBoards, createBoard, deleteBoard } from '../../data/trelloApi';
import TrelloBoard from './TrelloBoard';
import { BACKGROUND_PRESETS, FONT_OPTIONS, PHOTO_PRESETS, getBgStyle } from './trelloConfig';

export { BACKGROUND_PRESETS, FONT_OPTIONS, getBgStyle };

// ─── Background Picker ────────────────────────────────────────────────────────
const UNSPLASH = (id, w, h) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;

const BgPicker = ({ value, onChange }) => {
  const [tab, setTab] = useState('preset'); // 'preset' | 'photos' | 'image'
  const [imgUrl, setImgUrl] = useState('');

  const TABS = [
    { key: 'preset', label: 'Colors' },
    { key: 'photos', label: 'Photos' },
    { key: 'image',  label: 'URL' },
  ];

  return (
    <div>
      <div className="flex gap-1 mb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              tab === t.key
                ? 'bg-[#9E2FD0] text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'preset' && (
        <div className="grid grid-cols-9 gap-1.5">
          {BACKGROUND_PRESETS.map((bg) => {
            const isActive = value === bg.value;
            return (
              <button
                key={bg.value}
                type="button"
                title={bg.label}
                onClick={() => onChange(bg.value)}
                className="h-7 w-7 rounded-lg transition-transform hover:scale-110 relative"
                style={{
                  ...getBgStyle(bg.value),
                  boxShadow: isActive ? '0 0 0 2px white, 0 0 0 4px #9E2FD0' : 'none',
                }}
              >
                {isActive && (
                  <span className="absolute inset-0 flex items-center justify-center text-white text-xs">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {tab === 'photos' && (
        <div className="grid grid-cols-4 gap-1.5">
          {PHOTO_PRESETS.map((photo) => {
            const fullUrl = UNSPLASH(photo.id, 1920, 1080);
            const thumbUrl = UNSPLASH(photo.id, 160, 90);
            const isActive = value === fullUrl;
            return (
              <button
                key={photo.id}
                type="button"
                title={photo.label}
                onClick={() => onChange(fullUrl)}
                className="relative rounded-lg overflow-hidden transition-transform hover:scale-105"
                style={{
                  height: '52px',
                  boxShadow: isActive ? '0 0 0 2px white, 0 0 0 4px #9E2FD0' : 'none',
                }}
              >
                <img
                  src={thumbUrl}
                  alt={photo.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {isActive && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-sm">✓</span>
                )}
                <span className="absolute bottom-0 left-0 right-0 text-[9px] text-white font-medium px-1 py-0.5 bg-black/40 truncate">
                  {photo.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'image' && (
        <div className="space-y-2">
          <input
            type="url"
            value={imgUrl}
            onChange={(e) => setImgUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9E2FD0]"
          />
          <button
            type="button"
            onClick={() => { if (imgUrl.trim()) onChange(imgUrl.trim()); }}
            className="w-full py-2 text-sm rounded-lg bg-[#9E2FD0] hover:bg-[#8a27b5] text-white transition"
          >
            Apply image
          </button>
          {value?.startsWith('http') && (
            <div
              className="h-16 rounded-lg border border-gray-200 dark:border-gray-600"
              style={{ background: `url(${value}) center/cover no-repeat` }}
            />
          )}
        </div>
      )}
    </div>
  );
};

// ─── Create Board Modal ────────────────────────────────────────────────────────
const CreateBoardModal = ({ onClose, onCreated, userId }) => {
  const [name, setName] = useState('');
  const [background, setBackground] = useState('linear-gradient(135deg,#667eea 0%,#764ba2 100%)');
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const board = await createBoard({ name: name.trim(), background, fontFamily, userId });
      onCreated(board);
      onClose();
    } catch (err) {
      toast.error('Failed to create board: ' + (err?.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200 dark:border-[#9E2FD0]/30">
        {/* Preview */}
        <div
          className="h-28 flex items-end justify-start px-5 pb-4 transition-all duration-300"
          style={{ ...getBgStyle(background), fontFamily }}
        >
          <h3 className="text-xl font-bold text-white drop-shadow-md">{name || 'Board preview'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Board name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My awesome board"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9E2FD0]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Background</label>
            <BgPicker value={background} onChange={setBackground} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Font style</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9E2FD0]"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="flex-1 py-2.5 rounded-lg bg-[#9E2FD0] hover:bg-[#8a27b5] text-white font-medium transition disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const TrelloDashboard = () => {
  const user = useSelector((state) => state.user.userInfo.user);
  const userId = user?.id;
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeBoard, setActiveBoard] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (userId) loadBoards();
  }, [userId]);

  const loadBoards = async () => {
    setLoading(true);
    try {
      setBoards(await getBoards(userId));
    } catch (err) {
      toast.error('Failed to load boards: ' + (err?.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBoard = async (boardId) => {
    if (!window.confirm('Delete this board and all its contents? This cannot be undone.')) return;
    try {
      await deleteBoard(boardId);
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
      if (activeBoard?.id === boardId) setActiveBoard(null);
    } catch (err) {
      toast.error('Failed to delete board: ' + (err?.response?.data?.message || err.message));
    }
  };

  if (activeBoard) {
    return (
      <TrelloBoard
        board={activeBoard}
        onBack={() => setActiveBoard(null)}
        onBoardUpdated={(updated) => {
          setBoards((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
          setActiveBoard(updated);
        }}
      />
    );
  }

  const filtered = search.trim()
    ? boards.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    : boards;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">

      {/* ── Hero banner ─────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden">
        <div
          className="h-44 flex flex-col justify-end px-8 pb-6"
          style={{ background: 'linear-gradient(135deg, #4f0d8a 0%, #9E2FD0 50%, #c96ff0 100%)' }}
        >
          {/* subtle texture */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-7 h-7 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Trello 2.0</h1>
            </div>
            <p className="text-white/70 text-sm font-medium">
              {user?.name ? `Welcome back, ${user.name.split(' ')[0]} ·` : ''} {boards.length} board{boards.length !== 1 ? 's' : ''} in your workspace
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="absolute top-5 right-5 flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold px-4 py-2 rounded-xl border border-white/30 transition text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New board
          </button>
        </div>
      </div>

      {/* ── Controls bar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Your boards</span>
          {boards.length > 0 && (
            <span className="text-xs font-bold bg-[#9E2FD0]/10 text-[#9E2FD0] px-2 py-0.5 rounded-full">{boards.length}</span>
          )}
        </div>
        {boards.length > 0 && (
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search boards..."
              className="pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9E2FD0]/40 focus:border-[#9E2FD0] transition w-56"
            />
          </div>
        )}
      </div>

      {/* ── Board grid ──────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-[#9E2FD0]/30 border-t-[#9E2FD0] animate-spin" />
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading your workspace...</p>
        </div>
      ) : boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="w-20 h-20 rounded-2xl mb-6 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #9E2FD0 0%, #c96ff0 100%)' }}
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No boards yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm text-sm leading-relaxed">
            Create your first board to organize lessons, student progress, and language tasks.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#9E2FD0] hover:bg-[#8a27b5] text-white font-semibold px-8 py-3 rounded-xl transition shadow-lg shadow-purple-500/25"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create first board
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No boards match &ldquo;{search}&rdquo;</p>
          <button onClick={() => setSearch('')} className="mt-2 text-xs text-[#9E2FD0] hover:underline">Clear search</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((board) => (
            <div
              key={board.id}
              className="relative group rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-36"
              style={{ ...getBgStyle(board.background), fontFamily: board.fontFamily }}
              onClick={() => setActiveBoard(board)}
            >
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-all duration-300" />
              <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow-md">
                  {board.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-xs font-medium opacity-0 group-hover:opacity-100 transition">
                    Click to open
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteBoard(board.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/30 hover:bg-red-500/80 text-white rounded-lg p-1.5 backdrop-blur-sm"
                    title="Delete board"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={() => setShowCreate(true)}
            className="group rounded-2xl h-36 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-[#9E2FD0] dark:hover:border-[#9E2FD0] bg-gray-50/50 dark:bg-gray-800/20 hover:bg-[#9E2FD0]/5 text-gray-400 dark:text-gray-600 hover:text-[#9E2FD0] transition-all duration-200 flex flex-col items-center justify-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-semibold">New board</span>
          </button>
        </div>
      )}

      {showCreate && (
        <CreateBoardModal
          userId={userId}
          onClose={() => setShowCreate(false)}
          onCreated={(b) => setBoards((prev) => [...prev, b])}
        />
      )}
    </div>
  );
};

export default TrelloDashboard;
