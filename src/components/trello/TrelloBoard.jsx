import { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove,
  horizontalListSortingStrategy, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getLists, createList, updateList, deleteList,
  createCard, updateCard, deleteCard, moveCard, reorderCards, reorderLists,
  updateBoard,
} from '../../data/trelloApi';
import TrelloCardDetail from './TrelloCardDetail';
import { FONT_OPTIONS, BACKGROUND_PRESETS, PHOTO_PRESETS, getBgStyle } from './trelloConfig';

const UNSPLASH = (id, w, h) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;

const parseCardLabels = (v) => {
  if (!v) return [];
  try { return JSON.parse(v); } catch { return []; }
};

// ─── BoardSettingsModal ───────────────────────────────────────────────────────
const TABS = [
  { key: 'preset', label: 'Colors' },
  { key: 'photos', label: 'Photos' },
  { key: 'image',  label: 'URL' },
];

const BgPickerInline = ({ value, onChange }) => {
  const [tab, setTab] = useState('preset');
  const [imgUrl, setImgUrl] = useState('');

  return (
    <div>
      <div className="flex gap-1 mb-2">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${tab === t.key ? 'bg-[#9E2FD0] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
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
              <button key={bg.value} type="button" title={bg.label} onClick={() => onChange(bg.value)}
                className="h-7 w-7 rounded-lg transition-transform hover:scale-110 relative"
                style={{ ...getBgStyle(bg.value), boxShadow: isActive ? '0 0 0 2px white, 0 0 0 4px #9E2FD0' : 'none' }}
              >
                {isActive && <span className="absolute inset-0 flex items-center justify-center text-white text-xs">✓</span>}
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
              <button key={photo.id} type="button" title={photo.label} onClick={() => onChange(fullUrl)}
                className="relative rounded-lg overflow-hidden transition-transform hover:scale-105"
                style={{ height: '52px', boxShadow: isActive ? '0 0 0 2px white, 0 0 0 4px #9E2FD0' : 'none' }}
              >
                <img src={thumbUrl} alt={photo.label} className="w-full h-full object-cover" loading="lazy" />
                {isActive && <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-sm">✓</span>}
                <span className="absolute bottom-0 left-0 right-0 text-[9px] text-white font-medium px-1 py-0.5 bg-black/40 truncate">{photo.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'image' && (
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

// ─── Small icons ──────────────────────────────────────────────────────────────
const ClockIcon = () => (
  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const ChecklistIcon = () => (
  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const CommentIcon = () => (
  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
const GripIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
    <circle cx="6" cy="5" r="1.3" /><circle cx="14" cy="5" r="1.3" />
    <circle cx="6" cy="10" r="1.3" /><circle cx="14" cy="10" r="1.3" />
    <circle cx="6" cy="15" r="1.3" /><circle cx="14" cy="15" r="1.3" />
  </svg>
);

const parseJSONArr = (v) => { try { return v ? JSON.parse(v) : []; } catch { return []; } };

// ─── Card ─────────────────────────────────────────────────────────────────────
// The whole card is the drag handle (matches real Trello) — dnd-kit's pointer
// activation constraint (see `sensors` in TrelloBoard) means a plain click
// with no real movement still opens the detail modal instead of eating every
// click as a drag.
const TrelloCardItem = ({ card, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', listId: card.listId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const cardLabels = parseCardLabels(card.label);
  const checklist = parseJSONArr(card.checklist);
  const comments = parseJSONArr(card.comments);
  const checklistDone = checklist.filter((i) => i.done).length;
  const checklistComplete = checklist.length > 0 && checklistDone === checklist.length;
  const isOverdue = card.dueDate && !checklistComplete && new Date(card.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && onClick()}
      className="bg-white dark:bg-[#212a3a] rounded-xl border border-gray-100 dark:border-white/5 shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-[#9E2FD0]/30 hover:-translate-y-0.5 transition-all duration-150 touch-none"
    >
      {cardLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {cardLabels.map((lbl) => (
            <span
              key={lbl.name}
              className="h-1.5 w-8 rounded-full"
              style={{ backgroundColor: lbl.color }}
              title={lbl.name}
            />
          ))}
        </div>
      )}
      <p className="text-sm text-gray-800 dark:text-gray-100 font-medium leading-snug line-clamp-3">{card.name}</p>
      {card.description && (
        <p
          className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2"
          dangerouslySetInnerHTML={{ __html: card.description }}
        />
      )}
      {(card.dueDate || checklist.length > 0 || comments.length > 0) && (
        <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
          {card.dueDate && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                isOverdue
                  ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                  : checklistComplete
                  ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <ClockIcon />
              {new Date(card.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </span>
          )}
          {checklist.length > 0 && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                checklistComplete
                  ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <ChecklistIcon />
              {checklistDone}/{checklist.length}
            </span>
          )}
          {comments.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500 px-1.5 py-0.5 rounded-md">
              <CommentIcon />
              {comments.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Inert visual clone rendered inside DragOverlay — no useSortable hook here,
// DragOverlay portals a floating copy that isn't itself part of the sortable
// tree.
const CardGhost = ({ card }) => {
  const cardLabels = parseCardLabels(card.label);
  return (
    <div className="bg-white dark:bg-[#212a3a] rounded-xl border border-[#9E2FD0]/40 shadow-2xl p-3 w-72 rotate-2 cursor-grabbing">
      {cardLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {cardLabels.map((lbl) => <span key={lbl.name} className="h-1.5 w-8 rounded-full" style={{ backgroundColor: lbl.color }} />)}
        </div>
      )}
      <p className="text-sm text-gray-800 dark:text-gray-100 font-medium leading-snug line-clamp-3">{card.name}</p>
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
  fontFamily,
}) => {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [listName, setListName] = useState(list.name);
  const inputRef = useRef(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    data: { type: 'list' },
  });

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

  const cards = list.cards || [];
  const cardIds = useMemo(() => cards.map((c) => c.id), [cards]);

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-72 flex flex-col rounded-2xl max-h-full"
      style={{
        fontFamily,
        background: 'rgba(235,236,240,0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        border: '1px solid rgba(255,255,255,0.4)',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {/* List header */}
      <div className="px-2 py-2.5 flex items-center gap-1">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
          title="Drag to reorder list"
        >
          <GripIcon />
        </button>
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
        <div className="flex items-center gap-1 ml-1">
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
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <TrelloCardItem
              key={card.id}
              card={{ ...card, listId: list.id }}
              onClick={() => onCardClick(card, list)}
            />
          ))}
        </SortableContext>
        {cards.length === 0 && !addingCard && (
          <div className="text-center py-3 text-xs text-gray-400 dark:text-gray-500 select-none">No cards yet</div>
        )}
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
  const [activeCard, setActiveCard] = useState(null);
  const [activeList, setActiveList] = useState(null);
  // Snapshot of the card's origin list + that list's card-id order taken at
  // drag start — onDragOver already mutates `lists` live as the pointer
  // crosses between lists (for the visual "cards shuffle as you drag" feel),
  // so by dragEnd this is the only way left to know whether a cross-list
  // move happened and what the source list needs re-persisted as.
  const dragStartRef = useRef(null);

  const sensors = useSensors(
    // A small movement threshold so a plain click (open the card) doesn't
    // get eaten as a drag — only real pointer movement starts one.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

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
    const result = await Swal.fire({
      title: 'Delete list?',
      text: 'All cards in this list will be permanently deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#e53e3e',
      background: '#1a1a2e',
      color: '#fff',
    });
    if (!result.isConfirmed) return;
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

  // ─── Drag and drop (dnd-kit) ──────────────────────────────────────────────
  const findListIdForCard = (cardId, source = lists) =>
    source.find((l) => (l.cards || []).some((c) => c.id === cardId))?.id;

  const handleDragStart = (event) => {
    const { active } = event;
    if (active.data.current?.type === 'list') {
      setActiveList(lists.find((l) => l.id === active.id) || null);
      dragStartRef.current = null;
      return;
    }
    const listId = findListIdForCard(active.id);
    const list = lists.find((l) => l.id === listId);
    setActiveCard(list?.cards.find((c) => c.id === active.id) || null);
    // Snapshot the origin list + its card order so dragEnd can tell whether
    // a cross-list move happened and re-persist the source list's positions.
    dragStartRef.current = list ? { listId, cardIds: (list.cards || []).map((c) => c.id) } : null;
  };

  // Only relevant for cards — moves the dragged card into whatever list the
  // pointer is currently over so the board visually reshuffles live as you
  // drag, the same way Trello itself behaves. List reordering doesn't need
  // this: they all share one row/SortableContext, so dnd-kit handles the
  // live preview itself and the actual reorder happens in dragEnd.
  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || active.data.current?.type === 'list') return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const activeListId = findListIdForCard(activeId);
    const overListId = findListIdForCard(overId) || (lists.some((l) => l.id === overId) ? overId : null);
    if (!activeListId || !overListId || activeListId === overListId) return;

    setLists((prev) => {
      const activeListIdx = prev.findIndex((l) => l.id === activeListId);
      const overListIdx = prev.findIndex((l) => l.id === overListId);
      if (activeListIdx === -1 || overListIdx === -1) return prev;
      const activeCards = [...(prev[activeListIdx].cards || [])];
      const overCards = [...(prev[overListIdx].cards || [])];
      const activeCardIdx = activeCards.findIndex((c) => c.id === activeId);
      if (activeCardIdx === -1) return prev;
      const [movedCard] = activeCards.splice(activeCardIdx, 1);
      const overCardIdx = overCards.findIndex((c) => c.id === overId);
      const insertAt = overCardIdx >= 0 ? overCardIdx : overCards.length;
      overCards.splice(insertAt, 0, movedCard);
      const next = [...prev];
      next[activeListIdx] = { ...next[activeListIdx], cards: activeCards };
      next[overListIdx] = { ...next[overListIdx], cards: overCards };
      return next;
    });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveCard(null);
    setActiveList(null);
    if (!over) { dragStartRef.current = null; return; }

    // ── List reordering ──
    if (active.data.current?.type === 'list') {
      // Collision detection doesn't know a list drag should only ever land on
      // another list — it considers every registered droppable, cards
      // included, so dropping anywhere over a list's card area resolves
      // `over.id` to that CARD's id instead of the list's. Same fallback the
      // card branch above already uses: resolve back to the parent list.
      const overListId = lists.some((l) => l.id === over.id) ? over.id : findListIdForCard(over.id);
      if (!overListId || active.id === overListId) return;
      const oldIndex = lists.findIndex((l) => l.id === active.id);
      const newIndex = lists.findIndex((l) => l.id === overListId);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(lists, oldIndex, newIndex);
      setLists(reordered);
      try {
        await reorderLists(board.id, reordered.map((l) => l.id));
      } catch (err) {
        toast.error('Failed to reorder lists: ' + (err?.response?.data?.message || err.message));
      }
      return;
    }

    // ── Card reordering / cross-list move ──
    const activeId = active.id;
    const startedAt = dragStartRef.current;
    dragStartRef.current = null;
    const currentListId = findListIdForCard(activeId);
    if (!currentListId) return;

    const currentCards = lists.find((l) => l.id === currentListId)?.cards || [];
    const oldIndex = currentCards.findIndex((c) => c.id === activeId);
    let newIndex = currentCards.findIndex((c) => c.id === over.id);
    if (newIndex === -1) newIndex = currentCards.length - 1;
    const finalCards = oldIndex !== -1 && oldIndex !== newIndex
      ? arrayMove(currentCards, oldIndex, newIndex)
      : currentCards;

    setLists((prev) => prev.map((l) => (l.id === currentListId ? { ...l, cards: finalCards } : l)));

    const crossListMove = startedAt && startedAt.listId !== currentListId;
    if (!crossListMove && oldIndex === newIndex) return; // nothing actually changed

    try {
      if (crossListMove) {
        const finalIndex = finalCards.findIndex((c) => c.id === activeId);
        await moveCard(activeId, currentListId, finalIndex);
        await reorderCards(currentListId, finalCards.map((c) => c.id));
        const remainingSourceIds = startedAt.cardIds.filter((id) => id !== activeId);
        if (remainingSourceIds.length) await reorderCards(startedAt.listId, remainingSourceIds);
      } else {
        await reorderCards(currentListId, finalCards.map((c) => c.id));
      }
    } catch (err) {
      toast.error('Failed to save new order: ' + (err?.response?.data?.message || err.message));
      loadLists(); // resync with the server if persisting the drag failed
    }
  };

  const bgStyle = {
    ...getBgStyle(board.background),
    fontFamily: board.fontFamily || 'Inter, sans-serif',
  };

  return (
    <div className="relative flex flex-col h-full min-h-screen overflow-hidden" style={bgStyle}>
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-4 p-6 items-start min-h-full h-full">
              <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
                {lists.map((list) => (
                  <TrelloListColumn
                    key={list.id}
                    list={list}
                    onAddCard={handleAddCard}
                    onCardClick={handleCardClick}
                    onDeleteList={handleDeleteList}
                    onRenameList={handleRenameList}
                    fontFamily={board.fontFamily}
                  />
                ))}
              </SortableContext>

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

          <DragOverlay>
            {activeCard ? <CardGhost card={activeCard} /> : null}
            {activeList ? (
              <div className="w-72 rounded-2xl rotate-1 shadow-2xl opacity-90" style={{ background: 'rgba(235,236,240,0.98)', border: '1px solid rgba(158,47,208,0.4)' }}>
                <div className="px-3 py-2.5">
                  <h4 className="font-bold text-gray-800 text-sm truncate">{activeList.name}</h4>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
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
