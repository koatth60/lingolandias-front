import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { toast } from 'react-toastify';
import { FONT_OPTIONS } from './trelloConfig';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const LABELS = [
  { color: '#61BD4F', name: 'Green' },
  { color: '#F2D600', name: 'Yellow' },
  { color: '#FF9F1A', name: 'Orange' },
  { color: '#EB5A46', name: 'Red' },
  { color: '#C377E0', name: 'Purple' },
  { color: '#0079BF', name: 'Blue' },
  { color: '#00C2E0', name: 'Cyan' },
  { color: '#51E898', name: 'Lime' },
  { color: '#FF78CB', name: 'Pink' },
  { color: '#344563', name: 'Dark' },
];

const FONT_SIZES = ['12px','14px','16px','18px','20px','24px','28px','32px'];
const FONT_FAMILIES = [
  'Inter, sans-serif',
  'Roboto, sans-serif',
  'Poppins, sans-serif',
  "'Playfair Display', serif",
  'Merriweather, serif',
  "'Source Code Pro', monospace",
  'Georgia, serif',
  'Arial, sans-serif',
];

const TEXT_COLORS = [
  '#000000','#374151','#6B7280','#EF4444','#F59E0B',
  '#10B981','#3B82F6','#8B5CF6','#EC4899','#0079BF','#9E2FD0','#F6B82E',
];

// ─── RICH TEXT EDITOR ─────────────────────────────────────────────────────────
const RichEditor = forwardRef(({ html, onChange, placeholder }, ref) => {
  const editorRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const [selectionActive, setSelectionActive] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showFontFamily, setShowFontFamily] = useState(false);

  // Expose getHTML() to parent via ref
  useImperativeHandle(ref, () => ({
    getHTML: () => editorRef.current?.innerHTML || '',
  }));

  // Keep onChange stable in a ref to avoid stale closures in native listener
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Sync html prop → editor on mount only
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== html) {
      editorRef.current.innerHTML = html || '';
    }
  }, []);

  // Native input event listener — more reliable than React's onInput for contentEditable
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const handler = () => onChangeRef.current(el.innerHTML || '');
    el.addEventListener('input', handler);
    return () => el.removeEventListener('input', handler);
  }, []);

  const exec = (cmd, value = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    onChange(editorRef.current?.innerHTML || '');
    setShowColorPicker(false);
    setShowFontSize(false);
    setShowFontFamily(false);
  };

  const checkSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setSelectionActive(false);
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const edRect = editorRef.current?.getBoundingClientRect();
    if (!edRect) return;
    setToolbarPos({
      top: rect.top - edRect.top - 48,
      left: Math.min(rect.left - edRect.left, edRect.width - 280),
    });
    setSelectionActive(true);
  }, []);

  const handleMouseUp = () => setTimeout(checkSelection, 10);
  const handleKeyUp = () => setTimeout(checkSelection, 10);

  const isEmpty = !html || html === '<br>' || html.trim() === '';

  return (
    <div className="relative">
      {/* Fixed toolbar (always visible when focused) */}
      {focused && (
        <div className="flex flex-wrap items-center gap-0.5 mb-2 p-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
          {/* Bold */}
          <ToolBtn onClick={() => exec('bold')} title="Bold (Ctrl+B)">
            <b className="text-xs">B</b>
          </ToolBtn>
          {/* Italic */}
          <ToolBtn onClick={() => exec('italic')} title="Italic (Ctrl+I)">
            <i className="text-xs">I</i>
          </ToolBtn>
          {/* Underline */}
          <ToolBtn onClick={() => exec('underline')} title="Underline (Ctrl+U)">
            <u className="text-xs">U</u>
          </ToolBtn>
          {/* Strikethrough */}
          <ToolBtn onClick={() => exec('strikeThrough')} title="Strikethrough">
            <s className="text-xs">S</s>
          </ToolBtn>

          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5" />

          {/* Text color */}
          <div className="relative">
            <ToolBtn onClick={() => { setShowColorPicker(!showColorPicker); setShowFontSize(false); setShowFontFamily(false); }} title="Text color">
              <span className="text-xs font-bold" style={{ color: '#000' }}>A</span>
              <div className="w-3 h-0.5 mt-0.5 bg-red-500 rounded" />
            </ToolBtn>
            {showColorPicker && (
              <div className="absolute top-9 left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-2 shadow-xl grid grid-cols-6 gap-1 w-44">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    onMouseDown={(e) => { e.preventDefault(); exec('foreColor', c); }}
                    className="h-5 w-5 rounded border border-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Highlight */}
          <div className="relative">
            <ToolBtn onClick={() => exec('hiliteColor', '#FFF176')} title="Highlight">
              <span className="text-xs font-bold px-0.5" style={{ backgroundColor: '#FFF176' }}>H</span>
            </ToolBtn>
          </div>

          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5" />

          {/* Font size */}
          <div className="relative">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setShowFontSize(!showFontSize); setShowColorPicker(false); setShowFontFamily(false); }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Font size"
            >
              Size
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showFontSize && (
              <div className="absolute top-9 left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl overflow-hidden w-24">
                {FONT_SIZES.map((s) => (
                  <button
                    key={s}
                    onMouseDown={(e) => { e.preventDefault(); exec('fontSize', '7'); const sel = window.getSelection(); if (sel && !sel.isCollapsed) { const els = editorRef.current?.querySelectorAll('font[size="7"]'); els?.forEach(el => el.style.fontSize = s); } onChange(editorRef.current?.innerHTML || ''); setShowFontSize(false); }}
                    className="w-full px-3 py-1.5 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    style={{ fontSize: s }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Font family */}
          <div className="relative">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setShowFontFamily(!showFontFamily); setShowColorPicker(false); setShowFontSize(false); }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Font family"
            >
              Font
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showFontFamily && (
              <div className="absolute top-9 left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl overflow-hidden w-48">
                {FONT_FAMILIES.map((f) => (
                  <button
                    key={f}
                    onMouseDown={(e) => { e.preventDefault(); exec('fontName', f); }}
                    className="w-full px-3 py-1.5 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    style={{ fontFamily: f }}
                  >
                    {f.split(',')[0].replace(/'/g, '')}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5" />

          {/* Lists */}
          <ToolBtn onClick={() => exec('insertUnorderedList')} title="Bullet list">•≡</ToolBtn>
          <ToolBtn onClick={() => exec('insertOrderedList')} title="Numbered list">1≡</ToolBtn>

          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5" />

          {/* Align */}
          <ToolBtn onClick={() => exec('justifyLeft')} title="Align left">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M3 5h18v2H3zm0 4h12v2H3zm0 4h18v2H3zm0 4h12v2H3z"/></svg>
          </ToolBtn>
          <ToolBtn onClick={() => exec('justifyCenter')} title="Center">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M3 5h18v2H3zm3 4h12v2H6zm-3 4h18v2H3zm3 4h12v2H6z"/></svg>
          </ToolBtn>

          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5" />

          {/* Clear formatting */}
          <ToolBtn onClick={() => exec('removeFormat')} title="Clear formatting">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </ToolBtn>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); setShowColorPicker(false); setShowFontSize(false); setShowFontFamily(false); }}
        onMouseUp={handleMouseUp}
        onKeyUp={handleKeyUp}
        className="min-h-[100px] max-h-64 overflow-y-auto w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9E2FD0] transition-colors"
        style={{ lineHeight: '1.6', wordBreak: 'break-word' }}
        data-placeholder={placeholder}
      />

      {isEmpty && !focused && (
        <div className="absolute left-3 text-sm text-gray-400 dark:text-gray-500 pointer-events-none select-none" style={{top: '10px'}}>
          {placeholder}
        </div>
      )}
    </div>
  );
});

const ToolBtn = ({ onClick, children, title }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    className="flex flex-col items-center justify-center w-7 h-7 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-xs"
  >
    {children}
  </button>
);

// ─── CHECKLIST ────────────────────────────────────────────────────────────────
const Checklist = ({ items, onChange }) => {
  const [newText, setNewText] = useState('');
  const inputRef = useRef(null);

  const toggle = (id) => onChange(items.map((i) => i.id === id ? { ...i, done: !i.done } : i));
  const remove = (id) => onChange(items.filter((i) => i.id !== id));
  const add = () => {
    if (!newText.trim()) return;
    onChange([...items, { id: Date.now().toString(), text: newText.trim(), done: false }]);
    setNewText('');
    inputRef.current?.focus();
  };

  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div>
      {items.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">{done}/{items.length}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{pct}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: pct + '%', backgroundColor: pct === 100 ? '#61BD4F' : '#9E2FD0' }}
            />
          </div>
        </div>
      )}
      <div className="space-y-1.5 mb-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-2 group">
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => toggle(item.id)}
              className="mt-0.5 h-4 w-4 rounded accent-[#9E2FD0] cursor-pointer flex-shrink-0"
            />
            <span className={`flex-1 text-sm text-gray-800 dark:text-gray-200 ${item.done ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
              {item.text}
            </span>
            <button
              onClick={() => remove(item.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition text-xs px-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
          placeholder="Add an item..."
          className="flex-1 px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#9E2FD0]"
        />
        <button onClick={add} className="px-3 py-1.5 text-xs bg-[#9E2FD0] hover:bg-[#8a27b5] text-white rounded-lg transition">Add</button>
      </div>
    </div>
  );
};

// ─── LABELS PICKER ────────────────────────────────────────────────────────────
const LabelsPicker = ({ selected, onChange }) => {
  const toggle = (color) => {
    if (selected.includes(color)) onChange(selected.filter((c) => c !== color));
    else onChange([...selected, color]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {LABELS.map((l) => {
        const active = selected.includes(l.color);
        return (
          <button
            key={l.color}
            onClick={() => toggle(l.color)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white transition-all"
            style={{
              backgroundColor: l.color,
              opacity: active ? 1 : 0.35,
              boxShadow: active ? '0 0 0 2px white, 0 0 0 4px ' + l.color : 'none',
            }}
          >
            {active && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
            {l.name}
          </button>
        );
      })}
    </div>
  );
};

// ─── SIDEBAR ACTION BTN ───────────────────────────────────────────────────────
const SideBtn = ({ icon, label, onClick, active }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
      ${active
        ? 'bg-[#9E2FD0]/15 text-[#9E2FD0] dark:text-purple-300'
        : 'bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
  >
    <span className="text-base">{icon}</span>
    {label}
  </button>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const TrelloCardDetail = ({ card, list, lists, onClose, onUpdated, onDeleted, onMoved }) => {
  const [name, setName] = useState(card.name);
  const [editingName, setEditingName] = useState(false);
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '');
  const [dueDone, setDueDone] = useState(false);

  // Multi-label: stored comma-separated in card.label
  const parseLabels = (v) => v ? v.split(',').filter(Boolean) : [];
  const [labels, setLabels] = useState(parseLabels(card.label));

  // Checklist
  const parseJSON = (v, fallback) => { try { return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
  const [checklist, setChecklist] = useState(parseJSON(card.checklist, []));
  const [comments, setComments] = useState(parseJSON(card.comments, []));
  const [newComment, setNewComment] = useState('');
  const [saving, setSaving] = useState(false);
  const richEditorRef = useRef(null);

  // Title style
  const [titleStyle, setTitleStyle] = useState(parseJSON(card.titleStyle, {}));
  const updateTitleStyle = (key, val) => setTitleStyle((prev) => ({ ...prev, [key]: val }));

  // Sidebar panel state
  const [activePanel, setActivePanel] = useState(null); // 'labels'|'checklist'|'dates'|'move'

  const isDirty =
    name !== card.name ||
    description !== (card.description || '') ||
    dueDate !== (card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '') ||
    JSON.stringify(labels) !== JSON.stringify(parseLabels(card.label)) ||
    JSON.stringify(checklist) !== JSON.stringify(parseJSON(card.checklist, [])) ||
    JSON.stringify(titleStyle) !== JSON.stringify(parseJSON(card.titleStyle, {}));

  const buildPayload = () => {
    // Read description directly from DOM — bypasses any React state sync issues
    const desc = richEditorRef.current?.getHTML() || description || null;
    return {
      name,
      description: desc || null,
      dueDate: dueDate || null,
      label: labels.join(',') || null,
      checklist: checklist.length ? JSON.stringify(checklist) : null,
      comments: comments.length ? JSON.stringify(comments) : null,
      titleStyle: Object.keys(titleStyle).length ? JSON.stringify(titleStyle) : null,
    };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdated(card.id, buildPayload());
      toast.success('Card saved');
    } catch (_) {
      // Error toast already shown by parent handleCardUpdated
    } finally {
      setSaving(false);
    }
  };

  // Always save on close — description comes from DOM so no state sync issues
  const handleClose = async () => {
    setSaving(true);
    try {
      await onUpdated(card.id, buildPayload());
    } catch (_) {
      // Error toast already shown by parent
    } finally {
      setSaving(false);
      onClose();
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const updated = [...comments, { id: Date.now().toString(), text: newComment.trim(), createdAt: new Date().toISOString() }];
    setComments(updated);
    setNewComment('');
    onUpdated(card.id, { comments: JSON.stringify(updated) }).catch((err) => {
      toast.error('Failed to save comment: ' + (err?.response?.data?.message || err.message));
    });
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this card?')) return;
    try {
      await onDeleted(card.id);
    } catch (err) {
      toast.error('Failed to delete card: ' + (err?.response?.data?.message || err.message));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="bg-white dark:bg-[#1e2a3a] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div>
                  {/* Title input */}
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingName(false); }}
                    className="w-full bg-transparent border-b-2 border-[#9E2FD0] focus:outline-none"
                    style={{
                      fontFamily: titleStyle.fontFamily || 'inherit',
                      fontSize: titleStyle.fontSize || '1.25rem',
                      fontWeight: titleStyle.fontWeight || 'bold',
                      fontStyle: titleStyle.fontStyle || 'normal',
                      color: titleStyle.color || undefined,
                    }}
                  />
                  {/* Title style toolbar */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    {/* Font family */}
                    <select
                      value={titleStyle.fontFamily || ''}
                      onChange={(e) => updateTitleStyle('fontFamily', e.target.value || undefined)}
                      className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#9E2FD0]"
                    >
                      <option value="">Default font</option>
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                    {/* Font size */}
                    <select
                      value={titleStyle.fontSize || ''}
                      onChange={(e) => updateTitleStyle('fontSize', e.target.value || undefined)}
                      className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#9E2FD0]"
                    >
                      <option value="">Default size</option>
                      {['14px','16px','18px','20px','24px','28px','32px','36px','42px'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {/* Bold */}
                    <button
                      type="button"
                      onClick={() => updateTitleStyle('fontWeight', titleStyle.fontWeight === 'bold' ? 'normal' : 'bold')}
                      className={`w-7 h-7 rounded text-xs font-bold flex items-center justify-center transition ${titleStyle.fontWeight === 'bold' ? 'bg-[#9E2FD0] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}
                    >B</button>
                    {/* Italic */}
                    <button
                      type="button"
                      onClick={() => updateTitleStyle('fontStyle', titleStyle.fontStyle === 'italic' ? 'normal' : 'italic')}
                      className={`w-7 h-7 rounded text-xs italic flex items-center justify-center transition ${titleStyle.fontStyle === 'italic' ? 'bg-[#9E2FD0] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}
                    >I</button>
                    {/* Color */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Color:</span>
                      <input
                        type="color"
                        value={titleStyle.color || '#111827'}
                        onChange={(e) => updateTitleStyle('color', e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer border border-gray-300 dark:border-gray-600 bg-transparent p-0.5"
                        title="Title color"
                      />
                    </div>
                    {/* Reset */}
                    {Object.keys(titleStyle).length > 0 && (
                      <button
                        type="button"
                        onClick={() => setTitleStyle({})}
                        className="text-xs text-gray-400 hover:text-red-500 transition px-1"
                        title="Reset title style"
                      >Reset</button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingName(false)}
                      className="ml-auto text-xs px-3 py-1 bg-[#9E2FD0] hover:bg-[#8a27b5] text-white rounded-lg transition"
                    >Done</button>
                  </div>
                </div>
              ) : (
                <h2
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded px-1 -mx-1 transition-colors"
                  style={{
                    fontFamily: titleStyle.fontFamily || 'inherit',
                    fontSize: titleStyle.fontSize || '1.25rem',
                    fontWeight: titleStyle.fontWeight || 'bold',
                    fontStyle: titleStyle.fontStyle || 'normal',
                    color: titleStyle.color || undefined,
                    lineHeight: '1.4',
                  }}
                  onClick={() => setEditingName(true)}
                  title="Click to edit title style"
                >
                  {name}
                </h2>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-1">
                In list <span className="font-semibold text-gray-600 dark:text-gray-300 underline cursor-default">{list?.name}</span>
              </p>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl leading-none flex-shrink-0 p-1">×</button>
          </div>

          {/* Active labels strip */}
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 ml-8">
              {labels.map((c) => {
                const lbl = LABELS.find((l) => l.color === c);
                return (
                  <span
                    key={c}
                    className="px-3 py-1 rounded-full text-xs font-bold text-white cursor-pointer hover:opacity-80 transition"
                    style={{ backgroundColor: c }}
                    onClick={() => setActivePanel(activePanel === 'labels' ? null : 'labels')}
                    title={lbl?.name}
                  >
                    {lbl?.name || ''}
                  </span>
                );
              })}
            </div>
          )}

          {/* Due date badge */}
          {dueDate && (
            <div className="ml-8 mt-2">
              <button
                onClick={() => setDueDone(!dueDone)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                  dueDone
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : new Date(dueDate) < new Date()
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(dueDate).toLocaleDateString(undefined, { day:'numeric', month:'short', year:'numeric' })}
                {dueDone && ' ✓'}
              </button>
            </div>
          )}
        </div>

        {/* ── BODY ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex gap-0">

            {/* Main content */}
            <div className="flex-1 px-6 py-4 space-y-6 min-w-0">

              {/* Description */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Description</h3>
                </div>
                <RichEditor
                  ref={richEditorRef}
                  html={description}
                  onChange={setDescription}
                  placeholder="Add a more detailed description... Select text to format it."
                />
              </section>

              {/* Checklist (when added) */}
              {(activePanel === 'checklist' || checklist.length > 0) && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Checklist</h3>
                    {checklist.length > 0 && (
                      <button onClick={() => setChecklist([])} className="ml-auto text-xs text-gray-400 hover:text-red-500 transition">Delete</button>
                    )}
                  </div>
                  <Checklist items={checklist} onChange={setChecklist} />
                </section>
              )}

              {/* Move to list panel */}
              {activePanel === 'move' && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Move to list</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lists.filter((l) => l.id !== list?.id).map((l) => (
                      <button
                        key={l.id}
                        onClick={() => { onMoved(card.id, l.id); }}
                        className="px-3 py-2 text-sm font-medium rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-[#9E2FD0]/15 hover:text-[#9E2FD0] transition border border-gray-200 dark:border-gray-600"
                      >
                        → {l.name}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Labels picker panel */}
              {activePanel === 'labels' && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">🏷️</span>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Labels</h3>
                  </div>
                  <LabelsPicker selected={labels} onChange={setLabels} />
                </section>
              )}

              {/* Due date picker panel */}
              {activePanel === 'dates' && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">📅</span>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Due date</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9E2FD0]"
                    />
                    {dueDate && (
                      <button onClick={() => setDueDate('')} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    )}
                  </div>
                </section>
              )}

              {/* ── COMMENTS & ACTIVITY ── */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Comments & Activity</h3>
                </div>

                {/* Add comment */}
                <div className="flex gap-2 mb-4">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#9E2FD0] to-[#F6B82E] flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                    U
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                      placeholder="Write a comment..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9E2FD0] resize-none"
                    />
                    {newComment.trim() && (
                      <button onClick={handleAddComment} className="mt-1 px-3 py-1.5 text-xs bg-[#9E2FD0] hover:bg-[#8a27b5] text-white rounded-lg transition">
                        Save
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment list */}
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#9E2FD0] to-[#F6B82E] flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                        U
                      </div>
                      <div className="flex-1">
                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-600 rounded-xl px-3 py-2">
                          <p className="text-sm text-gray-800 dark:text-gray-200">{c.text}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-1 ml-1">
                          <span className="text-[11px] text-gray-400 dark:text-gray-500">
                            {new Date(c.createdAt).toLocaleString()}
                          </span>
                          <button
                            onClick={() => {
                              const updated = comments.filter((x) => x.id !== c.id);
                              setComments(updated);
                              onUpdated(card.id, { comments: JSON.stringify(updated) }).catch((err) => {
                                toast.error('Failed to delete comment: ' + (err?.response?.data?.message || err.message));
                              });
                            }}
                            className="text-[11px] text-gray-400 hover:text-red-500 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* ── SIDEBAR ─────────────────────────────────────────── */}
            <div className="w-44 flex-shrink-0 px-3 py-4 border-l border-gray-100 dark:border-gray-700 space-y-4">
              <div>
                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Add to card</p>
                <div className="space-y-1">
                  <SideBtn icon="🏷️" label="Labels" onClick={() => setActivePanel(activePanel === 'labels' ? null : 'labels')} active={activePanel === 'labels'} />
                  <SideBtn icon="✅" label="Checklist" onClick={() => setActivePanel(activePanel === 'checklist' ? null : 'checklist')} active={activePanel === 'checklist' || checklist.length > 0} />
                  <SideBtn icon="📅" label="Dates" onClick={() => setActivePanel(activePanel === 'dates' ? null : 'dates')} active={activePanel === 'dates'} />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Actions</p>
                <div className="space-y-1">
                  <SideBtn icon="↗️" label="Move" onClick={() => setActivePanel(activePanel === 'move' ? null : 'move')} active={activePanel === 'move'} />
                  <SideBtn icon="🗑️" label="Delete" onClick={handleDelete} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 flex-shrink-0 flex items-center justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Close'}
          </button>
          {isDirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#9E2FD0] hover:bg-[#8a27b5] text-white text-sm font-medium transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrelloCardDetail;
