import React, { useState } from 'react';
import { CalendarEvent } from '../types';
import {
  Bell,
  CheckCircle2,
  Circle,
  Trash2,
  Star,
  Plus,
  Volume2,
  Clock,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { speechManager } from '../utils/speech';

interface RemindersCardProps {
  reminders: CalendarEvent[];
  selectedDate: string;
  onAddReminder: (reminder: {
    title: string;
    startTime: string;
    date: string;
    isStarred?: boolean;
  }) => void;
  onToggleComplete?: (reminderId: string) => void;
  onDeleteReminder: (reminderId: string) => void;
  onToggleStar?: (reminderId: string) => void;
  haptics?: boolean;
}

export const RemindersCard: React.FC<RemindersCardProps> = ({
  reminders,
  selectedDate,
  onAddReminder,
  onToggleComplete,
  onDeleteReminder,
  onToggleStar,
  haptics = true,
}) => {
  const [filter, setFilter] = useState<'today' | 'all' | 'completed'>('today');
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('10:00');
  const [newStarred, setNewStarred] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set());

  // Handle reminder completion
  const handleToggleCheck = (id: string) => {
    if (haptics) soundManager.playSuccess();
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    if (onToggleComplete) onToggleComplete(id);
  };

  // Add reminder from inline form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (haptics) soundManager.playClick();

    onAddReminder({
      title: newTitle.trim(),
      startTime: newTime || '10:00',
      date: selectedDate,
      isStarred: newStarred,
    });

    setNewTitle('');
    setNewStarred(false);
  };

  // Vocalize reminder
  const handleSpeakReminder = (reminder: CalendarEvent) => {
    if (haptics) soundManager.playClick();
    const [h, m] = reminder.startTime.split(':');
    const hNum = parseInt(h, 10);
    const period = hNum >= 12 ? 'PM' : 'AM';
    const formattedH = hNum % 12 || 12;
    const speechTime = m === '00' ? `${formattedH} ${period}` : `${formattedH}:${m} ${period}`;
    speechManager.speak(`Reminder: ${reminder.title} at ${speechTime}.`);
  };

  // Filter reminders
  const filteredReminders = reminders.filter((r) => {
    const isDone = completedIds.has(r.id);
    if (filter === 'completed') return isDone;
    if (filter === 'today') return (r.date === selectedDate || r.isStarred) && !isDone;
    return !isDone;
  });

  const todayCount = reminders.filter((r) => (r.date === selectedDate || r.isStarred) && !completedIds.has(r.id)).length;

  return (
    <div className="w-full flex flex-col gap-3 rounded-3xl bg-white/5 border border-white/10 p-3.5 sm:p-4.5 text-slate-100 shadow-xl backdrop-blur-md">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-400">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-['Outfit'] font-bold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
              Reminders
              {todayCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  {todayCount} active
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => {
              if (haptics) soundManager.playClick();
              setFilter('today');
            }}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              filter === 'today'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => {
              if (haptics) soundManager.playClick();
              setFilter('all');
            }}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => {
              if (haptics) soundManager.playClick();
              setFilter('completed');
            }}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              filter === 'completed'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Done
          </button>
        </div>
      </div>

      {/* Quick Add Reminder Input Form */}
      <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-2xl bg-black/30 border border-white/10">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a reminder (e.g. Call dentist, Grocery run, Pay bill)..."
          className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 font-sans"
        />

        <div className="flex items-center gap-1.5">
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
            title="Reminder Time"
          />

          <button
            type="button"
            onClick={() => {
              if (haptics) soundManager.playClick();
              setNewStarred((prev) => !prev);
            }}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              newStarred
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title={newStarred ? 'Priority Starred' : 'Mark as Priority'}
          >
            <Star className={`w-3.5 h-3.5 ${newStarred ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            type="submit"
            disabled={!newTitle.trim()}
            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm shadow-cyan-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </form>

      {/* Reminders List */}
      <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-0.5">
        {filteredReminders.length === 0 ? (
          <div className="p-6 rounded-2xl bg-black/20 border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-2 text-slate-400">
            <Bell className="w-6 h-6 text-slate-500 stroke-[1.5]" />
            <p className="text-xs font-medium">
              {filter === 'completed'
                ? 'No completed reminders yet.'
                : 'No reminders set for today.'}
            </p>
            <p className="text-[11px] text-slate-500">
              Tap the microphone above and say <span className="text-cyan-300">"Remind me to call Mom at 4pm"</span> or use the box above.
            </p>
          </div>
        ) : (
          filteredReminders.map((reminder) => {
            const isCompleted = completedIds.has(reminder.id);

            // Format time display
            const [h, m] = (reminder.startTime || '10:00').split(':');
            const hNum = parseInt(h, 10);
            const period = hNum >= 12 ? 'pm' : 'am';
            const formattedH = hNum % 12 || 12;
            const timeDisplay = m === '00' ? `${formattedH}${period}` : `${formattedH}:${m}${period}`;

            return (
              <div
                key={reminder.id}
                className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                  isCompleted
                    ? 'bg-black/20 border-white/5 opacity-60'
                    : reminder.isStarred
                    ? 'bg-amber-500/10 border-amber-400/30'
                    : 'bg-black/40 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Left: Checkbox & Title */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleCheck(reminder.id)}
                    className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer shrink-0"
                    title={isCompleted ? 'Mark uncompleted' : 'Mark completed'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex flex-col min-w-0">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isCompleted
                          ? 'line-through text-slate-500'
                          : reminder.isStarred
                          ? 'text-amber-200'
                          : 'text-slate-100'
                      }`}
                    >
                      {reminder.title}
                    </span>
                    {reminder.description && reminder.description !== reminder.title && (
                      <span className="text-[10px] text-slate-400 truncate">
                        {reminder.description}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Time badge, Speak, Star, Delete */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/10 text-[10px] font-mono text-cyan-300">
                    {timeDisplay}
                  </span>

                  {/* Vocal Speak Button */}
                  <button
                    type="button"
                    onClick={() => handleSpeakReminder(reminder)}
                    className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-colors cursor-pointer"
                    title="Speak reminder aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Star priority button */}
                  {onToggleStar && (
                    <button
                      type="button"
                      onClick={() => {
                        if (haptics) soundManager.playClick();
                        onToggleStar(reminder.id);
                      }}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        reminder.isStarred
                          ? 'text-amber-400 hover:text-amber-300'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={reminder.isStarred ? 'Priority starred' : 'Star reminder'}
                    >
                      <Star className={`w-3.5 h-3.5 ${reminder.isStarred ? 'fill-amber-400' : ''}`} />
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (haptics) soundManager.playClick();
                      onDeleteReminder(reminder.id);
                    }}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete reminder"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
