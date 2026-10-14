import React, { useState } from 'react';
import { CalendarEvent } from '../types';
import {
  Plus,
  Clock,
  Trash2,
  CalendarCheck,
  Sparkles,
  ArrowDownUp,
  Target,
  Zap,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface AgendaListProps {
  selectedDate: string; // YYYY-MM-DD
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onDeleteEvent: (eventId: string, isGoogleEvent?: boolean, googleEventId?: string) => void;
  haptics?: boolean;
  onOpenGemini?: () => void;
}

export const AgendaList: React.FC<AgendaListProps> = ({
  selectedDate,
  events,
  onAddEvent,
  onDeleteEvent,
  haptics = true,
  onOpenGemini,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [smartSort, setSmartSort] = useState<boolean>(true);

  // Form state for adding an event
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [category, setCategory] = useState<CalendarEvent['category']>('work');
  const [description, setDescription] = useState('');
  const [isStarred, setIsStarred] = useState(false);

  // Helper to convert HH:MM to minutes from midnight
  const getTimeMinutes = (timeStr?: string): number => {
    if (!timeStr) return 9999;
    const [h, m] = timeStr.split(':').map((num) => parseInt(num, 10) || 0);
    return h * 60 + m;
  };

  // Helper to format date label
  const parsedDate = new Date(`${selectedDate}T00:00:00`);
  const dateFormatted = parsedDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const isToday = selectedDate === todayKey;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Filter events for the selected day and category
  const rawDayEvents = events.filter((evt) => {
    const matchesDate = evt.date === selectedDate;
    if (!matchesDate) return false;
    if (filterCategory === 'all') return true;
    return evt.category === filterCategory;
  });

  // SMART SORT: Automatically prioritizes events by chronological time, with starred/priority handling
  const dayEvents = smartSort
    ? [...rawDayEvents].sort((a, b) => {
        const timeDiff = getTimeMinutes(a.startTime) - getTimeMinutes(b.startTime);
        if (timeDiff !== 0) return timeDiff;
        return getTimeMinutes(a.endTime) - getTimeMinutes(b.endTime);
      })
    : rawDayEvents;

  // TODAY'S FOCUS: Identify the first upcoming or currently active event of the day
  const sortedByTime = [...rawDayEvents].sort(
    (a, b) => getTimeMinutes(a.startTime) - getTimeMinutes(b.startTime)
  );

  let focusEvent: CalendarEvent | null = null;
  let focusStatus: { label: string; color: string; pulse?: boolean } = {
    label: 'Up Next',
    color: 'text-cyan-300 bg-cyan-500/20 border-cyan-400/30',
  };

  if (sortedByTime.length > 0) {
    if (isToday) {
      // Find event currently ongoing or starting next
      const activeEvent = sortedByTime.find((evt) => {
        const start = getTimeMinutes(evt.startTime);
        const end = getTimeMinutes(evt.endTime);
        return currentMinutes >= start && currentMinutes <= end;
      });

      if (activeEvent) {
        focusEvent = activeEvent;
        focusStatus = {
          label: 'Happening Now',
          color: 'text-emerald-300 bg-emerald-500/20 border-emerald-400/40',
          pulse: true,
        };
      } else {
        const upcomingEvent = sortedByTime.find(
          (evt) => getTimeMinutes(evt.startTime) > currentMinutes
        );

        if (upcomingEvent) {
          focusEvent = upcomingEvent;
          const diffMinutes = getTimeMinutes(upcomingEvent.startTime) - currentMinutes;
          const timeLabel =
            diffMinutes < 60
              ? `Starts in ${diffMinutes}m`
              : `Starts in ${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;
          focusStatus = {
            label: timeLabel,
            color: 'text-lime-300 bg-lime-500/20 border-lime-400/40',
          };
        } else {
          // All events finished today, focus on the last or most significant
          focusEvent = sortedByTime[sortedByTime.length - 1];
          focusStatus = {
            label: 'All Done for Today',
            color: 'text-slate-300 bg-white/10 border-white/20',
          };
        }
      }
    } else {
      // For selected dates other than today, highlight the day's first primary event
      focusEvent = sortedByTime[0];
      focusStatus = {
        label: 'First Up',
        color: 'text-cyan-300 bg-cyan-500/20 border-cyan-400/30',
      };
    }
  }

  const handleOpenAdd = () => {
    if (haptics) soundManager.playClick();
    setIsModalOpen(true);
  };

  const handleCloseAdd = () => {
    if (haptics) soundManager.playClick();
    setIsModalOpen(false);
    setTitle('');
    setDescription('');
    setIsStarred(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (haptics) soundManager.playSuccess();
    onAddEvent({
      title: title.trim(),
      date: selectedDate,
      startTime,
      endTime,
      category,
      description: description.trim(),
      isStarred,
    });

    handleCloseAdd();
  };

  const toggleSmartSort = () => {
    if (haptics) soundManager.playClick();
    setSmartSort((prev) => !prev);
  };

  const getCategoryBadge = (cat: CalendarEvent['category']) => {
    switch (cat) {
      case 'google':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'meeting':
        return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
      case 'fitness':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
      case 'personal':
        return 'bg-amber-500/20 text-amber-300 border-amber-400/30';
      case 'reminder':
        return 'bg-rose-500/20 text-rose-300 border-rose-400/30';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header & Controls */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h4 className="font-['Outfit'] font-bold text-sm text-white flex items-center gap-1.5">
            <CalendarCheck className="w-4 h-4 text-cyan-400" />
            <span>Schedule for {dateFormatted}</span>
          </h4>
          <p className="text-[11px] text-slate-400">
            {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'} planned
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Smart Sort Toggle Button */}
          <button
            type="button"
            onClick={toggleSmartSort}
            title={
              smartSort
                ? 'Smart Sort Active: Events automatically ordered chronologically by time'
                : 'Click to enable Smart Sort'
            }
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
              smartSort
                ? 'bg-lime-500/20 text-lime-300 border-lime-400/40 shadow-lime-500/10'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Smart Sort</span>
            {smartSort && <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />}
          </button>

          {onOpenGemini && (
            <button
              onClick={() => {
                if (haptics) soundManager.playClick();
                onOpenGemini();
              }}
              title="Schedule with Gemini AI"
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 text-cyan-200 border border-cyan-400/30 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden sm:inline">AI Assist</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="p-1.5 px-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md shadow-cyan-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Event</span>
          </button>
        </div>
      </div>

      {/* TODAY'S FOCUS HEADER CARD (Highlighting the first upcoming event of the day) */}
      {focusEvent && (
        <div className="relative overflow-hidden p-3.5 rounded-2xl bg-gradient-to-r from-lime-500/15 via-cyan-500/15 to-purple-500/10 border border-lime-400/35 shadow-lg flex flex-col gap-1.5 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-lime-300 tracking-wide">
              <Target className="w-4 h-4 text-lime-400 animate-pulse" />
              <span className="uppercase text-[11px] font-mono tracking-wider">
                {isToday ? "Today's Focus" : "Day's Focus"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${focusStatus.color}`}
              >
                {focusStatus.pulse && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
                <span>{focusStatus.label}</span>
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border uppercase tracking-wider ${getCategoryBadge(
                  focusEvent.category
                )}`}
              >
                {focusEvent.category}
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-2 mt-0.5">
            <div className="text-sm sm:text-base font-bold text-white tracking-tight truncate flex items-center gap-1.5">
              <span>{focusEvent.title}</span>
              {focusEvent.isStarred && (
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
              )}
            </div>
            <div className="text-xs font-mono font-semibold text-lime-300/90 shrink-0 flex items-center gap-1">
              <Clock className="w-3 h-3 text-lime-400" />
              <span>
                {focusEvent.startTime} - {focusEvent.endTime}
              </span>
            </div>
          </div>

          {focusEvent.description && (
            <p className="text-[11px] text-slate-300/90 line-clamp-1 italic">
              {focusEvent.description}
            </p>
          )}
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        {['all', 'work', 'meeting', 'personal', 'fitness', 'reminder', 'google'].map((cat) => (
          <button
            key={cat}
            onClick={() => {
              if (haptics) soundManager.playClick();
              setFilterCategory(cat);
            }}
            className={`px-2.5 py-0.5 rounded-lg capitalize transition-colors cursor-pointer shrink-0 ${
              filterCategory === cat
                ? 'bg-white/20 text-white font-semibold border border-white/30'
                : 'bg-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Event Items List */}
      <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
        {dayEvents.length === 0 ? (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center flex flex-col items-center justify-center gap-1.5">
            <Clock className="w-6 h-6 text-slate-500" />
            <div className="text-xs font-medium text-slate-300">No events on this day</div>
            <div className="text-[11px] text-slate-500">
              Tap + Event or use Gemini AI to add one
            </div>
          </div>
        ) : (
          dayEvents.map((evt) => {
            const isFocus = focusEvent?.id === evt.id;
            return (
              <div
                key={evt.id}
                className={`group p-3 rounded-2xl border transition-all flex items-start justify-between gap-2.5 ${
                  isFocus
                    ? 'bg-white/10 border-lime-400/40 ring-1 ring-lime-400/30'
                    : 'bg-white/5 hover:bg-white/10 border-white/10'
                }`}
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border uppercase tracking-wider ${getCategoryBadge(
                        evt.category
                      )}`}
                    >
                      {evt.category}
                    </span>
                    <span className="text-[11px] text-cyan-300/90 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {evt.startTime} - {evt.endTime}
                    </span>
                    {isFocus && (
                      <span className="text-[10px] font-bold text-lime-400 bg-lime-400/10 px-1.5 py-0.2 rounded-md border border-lime-400/30">
                        Focus
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-xs sm:text-sm text-white truncate flex items-center gap-1.5">
                    <span>{evt.title}</span>
                    {evt.isStarred && (
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                    )}
                  </div>
                  {evt.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-1">{evt.description}</p>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (haptics) soundManager.playClick();
                    onDeleteEvent(evt.id, evt.isGoogleEvent, evt.googleEventId);
                  }}
                  title="Delete event"
                  className="opacity-60 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Add Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/20 p-5 shadow-2xl text-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-['Outfit'] font-bold text-base text-white">Add Schedule Event</h3>
              <button
                onClick={handleCloseAdd}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Psychology 101 Lecture or Team Sync"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="work">Work</option>
                    <option value="meeting">Meeting</option>
                    <option value="personal">Personal</option>
                    <option value="fitness">Fitness / Health</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Priority Focus (*)</label>
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isStarred}
                      onChange={(e) => setIsStarred(e.target.checked)}
                      className="rounded text-amber-400 focus:ring-amber-400"
                    />
                    <span className="text-amber-300 font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>Starred</span>
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Description (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Details, location, or notes"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseAdd}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 hover:bg-white/15 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
