import React, { useState, useEffect } from 'react';
import { KeepNote, KeepTaskItem, CalendarEvent } from '../types';
import {
  X,
  Plus,
  CheckSquare,
  Square,
  Calendar,
  Clock,
  Bell,
  Sparkles,
  ExternalLink,
  Volume2,
  Tag,
  Check,
} from 'lucide-react';
import { openGoogleKeepWeb } from '../services/googleTasks';
import { soundManager } from '../utils/audio';

interface QuickKeepModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  onSaveKeepNote: (note: Omit<KeepNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onSyncCalendarEvent?: (event: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent | void>;
  isGoogleConnected?: boolean;
  haptics?: boolean;
  defaultMode?: 'checklist' | 'note';
}

export const QuickKeepModal: React.FC<QuickKeepModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSaveKeepNote,
  onSyncCalendarEvent,
  isGoogleConnected = false,
  haptics = true,
  defaultMode = 'checklist',
}) => {
  const [mode, setMode] = useState<'checklist' | 'note'>(defaultMode);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [items, setItems] = useState<string[]>(['', '']);
  const [color, setColor] = useState<KeepNote['color']>('yellow');
  const [tagsInput, setTagsInput] = useState('');
  const [pinned, setPinned] = useState(false);

  // Reminder & Due Date Sync
  const [hasReminder, setHasReminder] = useState(true);
  const [reminderDate, setReminderDate] = useState(selectedDate);
  const [reminderTime, setReminderTime] = useState('18:00');
  const [syncWithCalendar, setSyncWithCalendar] = useState(true);
  const [vocalAlert, setVocalAlert] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReminderDate(selectedDate || new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  // Preset quick titles
  const quickPresets = [
    { label: '🛒 Groceries', title: 'Grocery Shopping', mode: 'checklist' as const, items: ['Milk', 'Eggs', 'Fresh produce'] },
    { label: '📚 Study Tasks', title: 'Study Session', mode: 'checklist' as const, items: ['Review slides', 'Practice questions', 'Summary notes'] },
    { label: '💼 Work Sync', title: 'Meeting Action Items', mode: 'checklist' as const, items: ['Email recap', 'Send calendar invites'] },
    { label: '💡 Quick Idea', title: 'Project Idea', mode: 'note' as const, items: [] },
  ];

  const handleApplyPreset = (preset: typeof quickPresets[0]) => {
    if (haptics) soundManager.playClick();
    setTitle(preset.title);
    setMode(preset.mode);
    if (preset.items.length > 0) {
      setItems([...preset.items, '']);
    }
  };

  const setDatePreset = (daysAhead: number) => {
    if (haptics) soundManager.playClick();
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setReminderDate(d.toISOString().split('T')[0]);
  };

  const setTimePreset = (timeStr: string) => {
    if (haptics) soundManager.playClick();
    setReminderTime(timeStr);
  };

  const handleAddItem = () => {
    if (haptics) soundManager.playClick();
    setItems((prev) => [...prev, '']);
  };

  const handleRemoveItem = (index: number) => {
    if (haptics) soundManager.playClick();
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, val: string) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    if (haptics) soundManager.playSuccess();

    try {
      const checklistItems: KeepTaskItem[] =
        mode === 'checklist'
          ? items
              .filter((it) => it.trim().length > 0)
              .map((it, idx) => ({
                id: `item-${Date.now()}-${idx}`,
                text: it.trim(),
                completed: false,
              }))
          : [];

      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter((t) => t.length > 0);

      // 1. If reminder is set and syncWithCalendar is active, create calendar event first to get ID
      let createdEventId: string | undefined = undefined;

      if (hasReminder && syncWithCalendar && onSyncCalendarEvent) {
        const eventSummary = checklistItems.length > 0
          ? checklistItems.map((it) => `• ${it.text}`).join('\n')
          : content.trim();

        // Calculate 1-hour event block
        const [h, m] = reminderTime.split(':').map(Number);
        const endH = String((h + 1) % 24).padStart(2, '0');
        const endM = String(m || 0).padStart(2, '0');

        const createdEvt = await onSyncCalendarEvent({
          title: `[Keep] ${title.trim()}`,
          date: reminderDate,
          startTime: reminderTime,
          endTime: `${endH}:${endM}`,
          category: 'reminder',
          description: eventSummary || 'Created from Google Keep Task',
          isStarred: true,
          color: '#f59e0b',
        });

        if (createdEvt && typeof createdEvt === 'object' && createdEvt.id) {
          createdEventId = createdEvt.id;
        }
      }

      // 2. Save the Keep Note
      onSaveKeepNote({
        title: title.trim(),
        content: content.trim(),
        items: checklistItems,
        color,
        tags: parsedTags.length > 0 ? parsedTags : ['keep', mode],
        pinned,
        reminderDate: hasReminder ? reminderDate : undefined,
        reminderTime: hasReminder ? reminderTime : undefined,
        syncWithCalendar: hasReminder ? syncWithCalendar : false,
        calendarEventId: createdEventId,
        vocalAlert: hasReminder ? vocalAlert : false,
      });

      // Reset and close
      setTitle('');
      setContent('');
      setItems(['', '']);
      setTagsInput('');
      onClose();
    } catch (err) {
      console.error('Failed to create Keep note with reminder:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl bg-slate-900/95 border border-amber-400/30 text-slate-100 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        style={{
          boxShadow: '0 25px 50px -12px rgba(245, 158, 11, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-md shadow-amber-400/30">
              <span className="text-sm">K</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-['Outfit'] font-extrabold text-base sm:text-lg text-white">
                  Add to Google Keep
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/40 font-mono">
                  Sync Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Create a quick task checklist or note linked to your Calendar
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto text-xs">
          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Presets:
            </span>
            {quickPresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-[11px] font-medium border border-white/10 transition-all shrink-0 cursor-pointer hover:border-amber-400/40"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Mode Switcher: Checklist vs Text Note */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => {
                if (haptics) soundManager.playClick();
                setMode('checklist');
              }}
              className={`py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'checklist'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Checklist Tasks</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (haptics) soundManager.playClick();
                setMode('note');
              }}
              className={`py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'note'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Quick Note / Memo</span>
            </button>
          </div>

          {/* Title Field */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Title <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Psychology Exam Prep or Weekly Groceries"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Dynamic Content: Checklist Items or Note Text */}
          {mode === 'checklist' ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold">Checklist Items</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-amber-300 hover:text-amber-200 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
              </div>

              <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Square className="w-3.5 h-3.5 text-amber-400/60 shrink-0" />
                    <input
                      type="text"
                      placeholder={`Item ${idx + 1}`}
                      value={item}
                      onChange={(e) => handleItemChange(idx, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddItem();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-white/10 cursor-pointer"
                        title="Remove item"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Note Details</label>
              <textarea
                rows={3}
                placeholder="Write your note, thoughts, ideas, or meeting takeaways here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none leading-relaxed"
              />
            </div>
          )}

          {/* Color Tint & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 text-[11px]">
                Keep Note Tint
              </label>
              <div className="flex items-center gap-1.5">
                {(['yellow', 'coral', 'teal', 'lavender', 'mint', 'dark'] as const).map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => {
                      if (haptics) soundManager.playClick();
                      setColor(col);
                    }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                      color === col ? 'scale-125 border-white ring-2 ring-white/50' : 'border-transparent'
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
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 text-[11px] flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>Tags (comma separated)</span>
              </label>
              <input
                type="text"
                placeholder="groceries, study, urgent"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* KEY SECTION: REMINDER & CALENDAR SYNC */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-400/10 via-amber-400/5 to-transparent border border-amber-400/25 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-200">
                <input
                  type="checkbox"
                  checked={hasReminder}
                  onChange={(e) => setHasReminder(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1.5 text-xs">
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span>Set Reminder & Due Date</span>
                </span>
              </label>

              {hasReminder && (
                <span className="text-[10px] text-amber-300/80 font-mono">
                  {reminderDate} @ {reminderTime}
                </span>
              )}
            </div>

            {hasReminder && (
              <div className="flex flex-col gap-3 pt-1 border-t border-amber-400/15 animate-in fade-in duration-150">
                {/* Date & Time Selectors */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 mb-1 text-[11px] font-semibold">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                    />
                    <div className="flex items-center gap-1 mt-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setDatePreset(0)}
                        className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setDatePreset(1)}
                        className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
                      >
                        Tomorrow
                      </button>
                      <button
                        type="button"
                        onClick={() => setDatePreset(7)}
                        className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
                      >
                        +7 Days
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 text-[11px] font-semibold">
                      Due Time
                    </label>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                    />
                    <div className="flex items-center gap-1 mt-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setTimePreset('09:00')}
                        className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
                      >
                        9am
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimePreset('14:00')}
                        className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
                      >
                        2pm
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimePreset('20:00')}
                        className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
                      >
                        8pm
                      </button>
                    </div>
                  </div>
                </div>

                {/* Calendar Sync Toggle */}
                <label className="flex items-start gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncWithCalendar}
                    onChange={(e) => setSyncWithCalendar(e.target.checked)}
                    className="rounded text-cyan-400 focus:ring-cyan-300 w-4 h-4 mt-0.5 cursor-pointer"
                  />
                  <div>
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Sync with Calendar Schedule</span>
                      {isGoogleConnected && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                          Google Calendar & Tasks
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      Automatically schedules an event block on your calendar and displays in Clockander agendas
                    </p>
                  </div>
                </label>

                {/* Spoken Vocal Alert Toggle */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-rose-300" />
                    <div>
                      <div className="font-semibold text-slate-200">Vocal Reminder Speech Alert</div>
                      <div className="text-[10px] text-slate-400">Speaks out loud with Kokoro / voice when due</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={vocalAlert}
                    onChange={(e) => setVocalAlert(e.target.checked)}
                    className="rounded text-rose-400 focus:ring-rose-300 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                if (haptics) soundManager.playClick();
                openGoogleKeepWeb(title || undefined);
              }}
              className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>keep.google.com</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-400/20 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{hasReminder && syncWithCalendar ? 'Save & Sync Calendar' : 'Save to Keep'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
