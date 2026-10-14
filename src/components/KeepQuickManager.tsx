import React, { useState } from 'react';
import { KeepNote, KeepTaskItem } from '../types';
import {
  Pin,
  CheckSquare,
  Square,
  Plus,
  ExternalLink,
  Trash2,
  Calendar,
  CloudUpload,
  Tag as TagIcon,
  Search,
  Bell,
} from 'lucide-react';
import { openGoogleKeepWeb } from '../services/googleTasks';
import { soundManager } from '../utils/audio';

interface KeepQuickManagerProps {
  notes: KeepNote[];
  onAddNote: (note: Omit<KeepNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateNote: (note: KeepNote) => void;
  onDeleteNote: (noteId: string) => void;
  onConvertToEvent?: (note: KeepNote) => void;
  onSyncGoogleTask?: (note: KeepNote) => Promise<void>;
  onOpenQuickKeep?: () => void;
  isGoogleConnected?: boolean;
  haptics?: boolean;
}

export const KeepQuickManager: React.FC<KeepQuickManagerProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onConvertToEvent,
  onSyncGoogleTask,
  onOpenQuickKeep,
  isGoogleConnected = false,
  haptics = true,
}) => {
  const [activeTag, setActiveTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Note Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newColor, setNewColor] = useState<KeepNote['color']>('yellow');
  const [isChecklist, setIsChecklist] = useState(true);
  const [newItems, setNewItems] = useState<string[]>(['']);
  const [newTagInput, setNewTagInput] = useState('');

  // Extract all unique tags
  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [notes]);

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (activeTag !== 'all' && !n.tags.includes(activeTag)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchContent = n.content?.toLowerCase().includes(q);
      const matchItems = n.items.some((i) => i.text.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchItems) return false;
    }
    return true;
  });

  // Sort: pinned first, then newest updated
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });

  const handleToggleItem = (note: KeepNote, itemId: string) => {
    if (haptics) soundManager.playClick();
    const updatedItems = note.items.map((it) =>
      it.id === itemId ? { ...it, completed: !it.completed } : it
    );
    onUpdateNote({
      ...note,
      items: updatedItems,
      updatedAt: Date.now(),
    });
  };

  const handleTogglePin = (note: KeepNote) => {
    if (haptics) soundManager.playClick();
    onUpdateNote({
      ...note,
      pinned: !note.pinned,
      updatedAt: Date.now(),
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (haptics) soundManager.playSuccess();
    const items: KeepTaskItem[] = isChecklist
      ? newItems
          .filter((t) => t.trim().length > 0)
          .map((t, i) => ({
            id: `item-${Date.now()}-${i}`,
            text: t.trim(),
            completed: false,
          }))
      : [];

    const tags = newTagInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    onAddNote({
      title: newTitle.trim(),
      content: newContent.trim(),
      items,
      color: newColor,
      tags: tags.length > 0 ? tags : ['quicknote'],
      pinned: false,
    });

    // Reset Form
    setNewTitle('');
    setNewContent('');
    setNewItems(['']);
    setNewTagInput('');
    setIsModalOpen(false);
  };

  const getColorClasses = (color: KeepNote['color']) => {
    switch (color) {
      case 'yellow':
        return 'bg-amber-400/15 border-amber-400/30 text-amber-100 hover:border-amber-400/50';
      case 'coral':
        return 'bg-rose-400/15 border-rose-400/30 text-rose-100 hover:border-rose-400/50';
      case 'teal':
        return 'bg-teal-400/15 border-teal-400/30 text-teal-100 hover:border-teal-400/50';
      case 'lavender':
        return 'bg-purple-400/15 border-purple-400/30 text-purple-100 hover:border-purple-400/50';
      case 'mint':
        return 'bg-emerald-400/15 border-emerald-400/30 text-emerald-100 hover:border-emerald-400/50';
      default:
        return 'bg-slate-800/40 border-white/15 text-slate-100 hover:border-white/30';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header and Actions */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
            <span className="text-amber-300 font-bold text-xs">K</span>
          </div>
          <div>
            <h4 className="font-['Outfit'] font-bold text-sm text-white">Google Keep Tasks</h4>
            <p className="text-[11px] text-slate-400">Quick sticky notes & checklists</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              if (haptics) soundManager.playClick();
              openGoogleKeepWeb();
            }}
            title="Open Keep on Web"
            className="p-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/15 text-amber-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keep Web</span>
          </button>

          <button
            onClick={() => {
              if (haptics) soundManager.playClick();
              if (onOpenQuickKeep) {
                onOpenQuickKeep();
              } else {
                setIsModalOpen(true);
              }
            }}
            className="p-1.5 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md shadow-amber-400/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Note</span>
          </button>
        </div>
      </div>

      {/* Search and Tag Chips */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Keep tasks & notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          <button
            onClick={() => {
              if (haptics) soundManager.playClick();
              setActiveTag('all');
            }}
            className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTag === 'all'
                ? 'bg-amber-400/20 text-amber-200 font-semibold border border-amber-400/40'
                : 'bg-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Notes
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                if (haptics) soundManager.playClick();
                setActiveTag(tag);
              }}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                activeTag === tag
                  ? 'bg-amber-400/20 text-amber-200 font-semibold border border-amber-400/40'
                  : 'bg-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>#{tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Keep Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
        {sortedNotes.length === 0 ? (
          <div className="col-span-full p-4 rounded-2xl bg-white/5 border border-white/10 text-center flex flex-col items-center justify-center gap-1.5">
            <span className="text-xl">📝</span>
            <div className="text-xs font-medium text-slate-300">No Keep notes found</div>
            <div className="text-[11px] text-slate-500">Tap + Note to create a quick task checklist</div>
          </div>
        ) : (
          sortedNotes.map((note) => {
            const completedCount = note.items.filter((i) => i.completed).length;
            const totalCount = note.items.length;
            const hasChecklist = totalCount > 0;

            return (
              <div
                key={note.id}
                className={`p-3 rounded-2xl border backdrop-blur-md transition-all flex flex-col justify-between gap-2.5 shadow-sm ${getColorClasses(
                  note.color
                )}`}
              >
                <div>
                  {/* Top Note Row: Title and Pin */}
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-bold text-xs sm:text-sm text-white line-clamp-1">
                      {note.title}
                    </h5>
                    <button
                      onClick={() => handleTogglePin(note)}
                      title={note.pinned ? 'Unpin note' : 'Pin note'}
                      className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                        note.pinned
                          ? 'text-amber-300 bg-amber-400/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'fill-amber-300' : ''}`} />
                    </button>
                  </div>

                  {/* Note Content Text */}
                  {note.content && (
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {note.content}
                    </p>
                  )}

                  {/* Reminder & Due Date Badge */}
                  {note.reminderDate && (
                    <div className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-200 border border-amber-400/30 mt-1.5 font-mono">
                      <Bell className="w-3 h-3 text-amber-300 shrink-0" />
                      <span>Due {note.reminderDate}{note.reminderTime ? ` @ ${note.reminderTime}` : ''}</span>
                      {note.syncWithCalendar && (
                        <span className="text-[9px] px-1 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 ml-auto font-sans font-semibold">
                          Calendar Synced
                        </span>
                      )}
                    </div>
                  )}

                  {/* Checklist Items */}
                  {hasChecklist && (
                    <div className="flex flex-col gap-1 mt-2">
                      {note.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleItem(note, item.id)}
                          className="flex items-center gap-2 text-[11px] cursor-pointer hover:bg-white/10 p-1 rounded-lg transition-colors"
                        >
                          {item.completed ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span
                            className={`truncate ${
                              item.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-200 font-medium'
                            }`}
                          >
                            {item.text}
                          </span>
                        </div>
                      ))}

                      {/* Progress Bar */}
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                        <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 transition-all duration-300"
                            style={{
                              width: `${(completedCount / totalCount) * 100}%`,
                            }}
                          />
                        </div>
                        <span>
                          {completedCount}/{totalCount}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions Row */}
                <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px]">
                  {/* Tags */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {note.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Quick Action Icons */}
                  <div className="flex items-center gap-1">
                    {onConvertToEvent && (
                      <button
                        onClick={() => {
                          if (haptics) soundManager.playClick();
                          onConvertToEvent(note);
                        }}
                        title="Convert to Calendar Event"
                        className="p-1 rounded hover:bg-white/20 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        <Calendar className="w-3 h-3" />
                      </button>
                    )}

                    {onSyncGoogleTask && isGoogleConnected && (
                      <button
                        onClick={() => {
                          if (haptics) soundManager.playClick();
                          onSyncGoogleTask(note);
                        }}
                        title="Sync to Google Tasks"
                        className="p-1 rounded hover:bg-white/20 text-slate-300 hover:text-blue-300 transition-colors cursor-pointer"
                      >
                        <CloudUpload className="w-3 h-3" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (haptics) soundManager.playClick();
                        onDeleteNote(note.id);
                      }}
                      title="Delete Keep note"
                      className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create New Keep Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/20 p-5 shadow-2xl text-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-['Outfit'] font-bold text-base text-white">Create Keep Note</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Title</label>
                <input
                  type="text"
                  required
                  placeholder="Note or task title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Note Body (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Quick thoughts, details, or meeting notes"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>

              {/* Checklist Option */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-medium">Checklist Tasks</label>
                  <button
                    type="button"
                    onClick={() => setIsChecklist(!isChecklist)}
                    className="text-[11px] text-amber-300 hover:underline"
                  >
                    {isChecklist ? 'Disable Checklist' : 'Enable Checklist'}
                  </button>
                </div>

                {isChecklist && (
                  <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {newItems.map((itemStr, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <Square className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <input
                          type="text"
                          placeholder={`Task ${idx + 1}`}
                          value={itemStr}
                          onChange={(e) => {
                            const updated = [...newItems];
                            updated[idx] = e.target.value;
                            setNewItems(updated);
                          }}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                        {newItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setNewItems(newItems.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-400 hover:text-rose-400"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setNewItems([...newItems, ''])}
                      className="text-left text-amber-300 hover:text-amber-200 text-[11px] font-semibold flex items-center gap-1 mt-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Item</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Keep Note Tint</label>
                <div className="flex items-center gap-2">
                  {(['yellow', 'coral', 'teal', 'lavender', 'mint', 'dark'] as const).map(
                    (col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setNewColor(col)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                          newColor === col ? 'scale-125 border-white ring-2 ring-white/50' : 'border-transparent'
                        } ${
                          col === 'yellow'
                            ? 'bg-amber-400'
                            : col === 'coral'
                            ? 'bg-rose-400'
                            : col === 'teal'
                            ? 'bg-cyan-400'
                            : col === 'lavender'
                            ? 'bg-purple-400'
                            : col === 'mint'
                            ? 'bg-emerald-400'
                            : 'bg-slate-700'
                        }`}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Tags Input */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="moto, ideas, groceries"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 hover:bg-white/15 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-all shadow-md shadow-amber-400/20 active:scale-95 cursor-pointer"
                >
                  Save to Keep
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
