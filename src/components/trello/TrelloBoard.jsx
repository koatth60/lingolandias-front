import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  getLists, createList, updateList, deleteList,
  createCard, updateCard, deleteCard, moveCard,
  updateBoard,
} from '../../data/trelloApi';
import TrelloCardDetail from './TrelloCardDetail';
import { FONT_OPTIONS, BACKGROUND_PRESETS, getBgStyle } from './trelloConfig';

const LABELS = [
  { color: '#61BD4F', name: 'Green' },
  { color: '#F2D600', name: 'Yellow' },
  { color: '#FF9F1A', name: 'Orange' },
  { color: '#EB5A46', name: 'Red' },
  { color: '#C377E0', name: 'Purple' },
  { color: '#0079BF', name: 'Blue' },
];

// ─── BoardSettingsModal ───────────────────────────────────────────────────────
const BgPickerInline = ({ value, onChange }) => {
  const [tab, setTab] = useState('preset');
  const [imgUrl, setImgUrl] = useState('');

  return (
    <div>
      <div className="flex gap-1 mb-2">
        {['preset', 'image'].map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${tab === t ? 'bg-[#9E2FD0] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            {t === 'preset' ? 'Colors & Gradients' : 'Image URL'}
          </button>
        ))}
      </div>
      {tab === 'preset' ? (
        <div className="grid grid-cols-9 gap-1.5">
          {BACKGROUND_PRESETS.map((bg) => {
            const isActive = value === bg.value;
            return (
              <button key={bg.value} type="button" title={bg.label} onClick={() => onChange(bg.value)}
                className="h-7 w-7 rounded-lg transition-transform hover:scale-110 relative"
                style={{ ...getBgStyle(bg.value), boxShadow: isActive ? '0 0 0 2px white, 0 0 0 4px #9E2FD0' : 'none' }}
              >
                {isActive && <span className="absolute inset-0 flex items-center justify-center text-white text-xs">✓</span>}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          <input type="url" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9E2FD0]"
          />
          <button type="button" onClick={() => { if (imgUrl.trim()) onChange(imgUrl.trim()); }}
            className="w-full py-2 text-sm rounded-lg bg-[#9E2FD0] hover:bg-[#8a27b5] text-white transition"
          >Apply image</button>
          {value?.startsWith('http') && (
            <div className="h-14 rounded-lg" style={{ background: `url(${value}) center/cover no-repeat` }} />
          )}
        </div>
      )}
    </div>
  );
};

const BoardSettingsModal = ({ board, onClose, onUpdated }) => {
  const [name, setName] = useState(board.name);
  const [background, setBackground] = useState(board.background);
  const [fontFamily, setFontFamily] = useState(board.fontFamily || 'Inter, sans-serif');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateBoard(board.id, { name, background, fontFamily });
      onUpdated(updated);
      toast.success('Board settings saved');
      onClose();
    } catch (err) {
      toast.error('Failed to save board settings: ' + (err?.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200 dark:border-[#9E2FD0]/30 overflow-hidden">
        {/* Live preview strip */}
        <div className="h-20 transition-all duration-300" style={{ ...getBgStyle(background), fontFamily }}>
          <div className="h-full flex items-end px-5 pb-3" style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}>
            <span className="text-white font-bold text-base drop-shadow">{name || board.name}</span>
          </div>
        </div>
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Board settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-xl">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9E2FD0]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Background</label>
            <BgPickerInline value={background} onChange={setBackground} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Font</label>
            <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9E2FD0]"
            >
              {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>
        <div className="p-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg bg-[#9E2FD0] hover:bg-[#8a27b5] text-white font-medium transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── TrelloList column ───────────────────────────────────────────────────────
const TrelloListColumn = ({
  list,
  onAddCard,
  onCardClick,
  onDeleteList,
  onRenameList,
  onDragStart,
  onDragOver,
  onDrop,
  fontFamily,
}) => {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [listName, setListName] = useState(list.name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (addingCard && inputRef.current) inputRef.current.focus();
  }, [addingCard]);

  const handleAddCard = async () => {
    if (!newCardName.trim()) { setAddingCard(false); return; }
    await onAddCard(list.id, newCardName.trim());
    setNewCardName('');
    setAddingCard(false);
  };

  const handleRenameList = async () => {
    if (listName.trim() && listName !== list.name) {
      await onRenameList(list.id, listName.trim());
    }
    setRenaming(false);
  };

  const cards = (list.cards || []).sort((a, b) => a.position - b.position);

  return (
    <div
      className="flex-shrink-0 w-72 flex flex-col rounded-2xl max-h-full"
      style={{
        fontFamily,
        background: 'rgba(235,236,240,0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        border: '1px solid rgba(255,255,255,0.4)',
      }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(list.id); }}
      onDrop={() => onDrop(list.id)}
    >
      {/* List header */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        {renaming ? (
          <input
            autoFocus
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            onBlur={handleRenameList}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRenameList(); if (e.key === 'Escape') { setListName(list.name); setRenaming(false); } }}
            className="flex-1 px-2 py-1 text-sm font-bold rounded border border-[#9E2FD0] bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
          />
        ) : (
          <h4
            className="font-bold text-gray-800 text-sm truncate flex-1 cursor-pointer"
            onDoubleClick={() => setRenaming(true)}
            title="Double-click to rename"
          >
            {list.name}
          </h4>
        )}
        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            {cards.length}
          </span>
          <button
            onClick={() => onDeleteList(list.id)}
            className="text-gray-400 hover:text-red-500 p-1 rounded transition"
            title="Delete list"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-2 space-y-2 py-1 min-h-[40px]">
        {cards.map((card) => (
          <div
            key={card.id}
            draggable
            onDragStart={() => onDragStart(card)}
            onClick={() => onCardClick(card, list)}
            className="bg-white rounded-xl border border-gray-100 p-3 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150 group"
          >
            {card.label && (
              <div
                className="h-2 w-12 rounded-full mb-2"
                style={{ backgroundColor: card.label }}
                title={LABELS.find((l) => l.color === card.label)?.name || ''}
              />
            )}
            <p className="text-sm text-gray-800 font-medium line-clamp-3">{card.name}</p>
            {card.description && (
              <p
                className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2"
                dangerouslySetInnerHTML={{ __html: card.description }}
              />
            )}
            {card.dueDate && (
              <div className="flex items-center gap-1 mt-2">
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-gray-400">
                  {new Date(card.dueDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add card */}
      <div className="px-2 pb-2 pt-1">
        {addingCard ? (
          <div className="space-y-1">
            <textarea
              ref={inputRef}
              value={newCardName}
              onChange={(e) => setNewCardName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(); } if (e.key === 'Escape') setAddingCard(false); }}
              placeholder="Enter card title..."
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#9E2FD0] bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none resize-none"
            />
            <div className="flex gap-1">
              <button onClick={handleAddCard} className="bg-[#9E2FD0] hover:bg-[#8a27b5] text-white text-xs px-3 py-1.5 rounded-lg transition">Add card</button>
              <button onClick={() => { setAddingCard(false); setNewCardName(''); }} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-xs px-2 py-1.5 rounded-lg transition">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingCard(true)}
            className="w-full flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 text-sm px-2 py-1.5 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add a card
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main TrelloBoard ────────────────────────────────────────────────────────
const TrelloBoard = ({ board, onBack, onBoardUpdated }) => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingList, setAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedCardList, setSelectedCardList] = useState(null);
  const draggingCardRef = useRef(null);
  const dragOverListRef = useRef(null);

  useEffect(() => {
    loadLists();
  }, [board.id]);

  const loadLists = async () => {
    setLoading(true);
    try {
      setLists(await getLists(board.id));
    } catch (err) {
      toast.error('Failed to load lists: ' + (err?.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddList = async () => {
    if (!newListName.trim()) { setAddingList(false); return; }
    try {
      const list = await createList(board.id, newListName.trim());
      setLists((prev) => [...prev, list]);
      setNewListName('');
      setAddingList(false);
    } catch (err) {
      toast.error('Failed to create list: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleAddCard = async (listId, name) => {
    try {
      const card = await createCard(listId, { name });
      setLists((prev) =>
        prev.map((l) =>
          l.id === listId ? { ...l, cards: [...(l.cards || []), card] } : l
        )
      );
    } catch (err) {
      toast.error('Failed to create card: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Delete this list and all its cards?')) return;
    try {
      await deleteList(listId);
      setLists((prev) => prev.filter((l) => l.id !== listId));
    } catch (err) {
      toast.error('Failed to delete list: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleRenameList = async (listId, name) => {
    try {
      const updated = await updateList(listId, { name });
      setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, name: updated.name } : l)));
    } catch (err) {
      toast.error('Failed to rename list: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleCardClick = (card, list) => {
    setSelectedCard(card);
    setSelectedCardList(list);
  };

  const handleCardUpdated = async (cardId, data) => {
    try {
      const updated = await updateCard(cardId, data);
      setLists((prev) =>
        prev.map((l) => ({
          ...l,
          cards: (l.cards || []).map((c) => (c.id === cardId ? { ...c, ...updated } : c)),
        }))
      );
      setSelectedCard((prev) => (prev?.id === cardId ? { ...prev, ...updated } : prev));
      return updated;
    } catch (err) {
      toast.error('Failed to save card: ' + (err?.response?.data?.message || err.message));
      throw err;
    }
  };

  const handleCardDeleted = async (cardId) => {
    try {
      await deleteCard(cardId);
      setLists((prev) =>
        prev.map((l) => ({ ...l, cards: (l.cards || []).filter((c) => c.id !== cardId) }))
      );
      setSelectedCard(null);
    } catch (err) {
      toast.error('Failed to delete card: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleCardMoved = async (cardId, targetListId) => {
    try {
      const targetList = lists.find((l) => l.id === targetListId);
      const newPos = (targetList?.cards || []).length;
      const moved = await moveCard(cardId, targetListId, newPos);
      setLists((prev) => {
        const withoutCard = prev.map((l) => ({
          ...l,
          cards: (l.cards || []).filter((c) => c.id !== cardId),
        }));
        return withoutCard.map((l) =>
          l.id === targetListId ? { ...l, cards: [...(l.cards || []), moved] } : l
        );
      });
    } catch (err) {
      toast.error('Failed to move card: ' + (err?.response?.data?.message || err.message));
    }
  };

  // Drag and drop handlers
  const handleDragStart = (card) => {
    draggingCardRef.current = card;
  };

  const handleDragOver = (listId) => {
    dragOverListRef.current = listId;
  };

  const handleDrop = (targetListId) => {
    const card = draggingCardRef.current;
    if (!card || card.listId === targetListId) return;
    handleCardMoved(card.id, targetListId);
    draggingCardRef.current = null;
  };

  const bgStyle = {
    ...getBgStyle(board.background),
    fontFamily: board.fontFamily || 'Inter, sans-serif',
  };

  return (
    <div className="flex flex-col h-full min-h-screen" style={bgStyle}>
      {/* Board header */}
      <div className="flex items-center gap-3 px-6 py-3" style={{ backgroundColor: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(4px)' }}>
        <button
          onClick={onBack}
          className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Boards</span>
        </button>
        <div className="w-px h-5 bg-white/30" />
        <h2 className="text-white font-bold text-lg truncate">{board.name}</h2>
        <div className="ml-auto">
          <button
            onClick={() => setShowSettings(true)}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition flex items-center gap-1.5 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Board settings
          </button>
        </div>
      </div>

      {/* Lists area */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-white/40 border-t-white animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 p-6 items-start min-h-full h-full">
            {lists.map((list) => (
              <TrelloListColumn
                key={list.id}
                list={list}
                onAddCard={handleAddCard}
                onCardClick={handleCardClick}
                onDeleteList={handleDeleteList}
                onRenameList={handleRenameList}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                fontFamily={board.fontFamily}
              />
            ))}

            {/* Add list */}
            <div className="flex-shrink-0 w-72">
              {addingList ? (
                <div className="bg-gray-100 dark:bg-[#111827] rounded-2xl p-3 border border-gray-200 dark:border-gray-700 space-y-2">
                  <input
                    autoFocus
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddList(); if (e.key === 'Escape') setAddingList(false); }}
                    placeholder="Enter list name..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#9E2FD0] bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
                  />
                  <div className="flex gap-1">
                    <button onClick={handleAddList} className="bg-[#9E2FD0] hover:bg-[#8a27b5] text-white text-xs px-3 py-1.5 rounded-lg transition">Add list</button>
                    <button onClick={() => { setAddingList(false); setNewListName(''); }} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-xs px-2 py-1.5 rounded-lg transition">Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingList(true)}
                  className="w-full flex items-center gap-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 text-sm font-medium px-4 py-3 rounded-2xl transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add another list
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <BoardSettingsModal
          board={board}
          onClose={() => setShowSettings(false)}
          onUpdated={onBoardUpdated}
        />
      )}

      {selectedCard && (
        <TrelloCardDetail
          card={selectedCard}
          list={selectedCardList}
          lists={lists}
          onClose={() => { setSelectedCard(null); setSelectedCardList(null); }}
          onUpdated={handleCardUpdated}
          onDeleted={handleCardDeleted}
          onMoved={(cardId, targetListId) => { handleCardMoved(cardId, targetListId); setSelectedCard(null); }}
        />
      )}
    </div>
  );
};

export default TrelloBoard;
