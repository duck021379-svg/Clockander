import React, { useState, useEffect } from 'react';
import { CalendarEvent, WidgetSettings } from '../types';
import { PrecisionClockEngine } from '../utils/clock';
import { soundManager } from '../utils/audio';
import { Calendar, Plus, ExternalLink, X, Check, Sparkles } from 'lucide-react';
import { WeatherWidget } from './WeatherWidget';

interface SimpleWidgetProps {
  settings: WidgetSettings;
  events: CalendarEvent[];
  selectedDate: string;
  onOpenSettings: () => void;
  onToggleLock: () => void;
  onOpenReminderEntry: () => void;
  onOpenGemini?: () => void;
  onEventClick?: (event: CalendarEvent) => void;
  onQuickAddReminder?: (title: string, time: string, isStarred: boolean) => void;
}

export const SimpleWidget: React.FC<SimpleWidgetProps> = ({
  settings,
  events,
  selectedDate,
  onOpenSettings,
  onToggleLock,
  onOpenReminderEntry,
  onOpenGemini,
  onEventClick,
  onQuickAddReminder,
}) => {
  const [time, setTime] = useState<Date>(new Date());
  const [isInlineEntryOpen, setIsInlineEntryOpen] = useState(false);
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineTime, setInlineTime] = useState('21:00');
  const [inlineStarred, setInlineStarred] = useState(false);

  // Precision clock engine for smooth timekeeping
  useEffect(() => {
    const engine = new PrecisionClockEngine(
      (now) => setTime(now),
      settings.showSeconds ? 'second' : 'minute'
    );
    engine.start();
    return () => engine.stop();
  }, [settings.showSeconds]);

  // 1. CLOCK (as in picture: 10:01)
  const hoursRaw = time.getHours();
  const hours = settings.is24Hour
    ? String(hoursRaw).padStart(2, '0')
    : String(hoursRaw % 12 || 12);
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');

  // 2. Month/date (as in picture: "Oct. 16/Tue")
  const monthShort = time.toLocaleDateString('en-US', { month: 'short' });
  const day = time.getDate();
  const weekday = time.toLocaleDateString('en-US', { weekday: 'short' });
  const monthDateString = `${monthShort}. ${day}/${weekday}`;

  // 3 & 4. Due entries (as in picture: Pdv101-9pm*, Psy-11:59pm)
  const displayEvents = events.filter((e) => e.date === selectedDate || e.isStarred);
  const dueEntries = displayEvents.length > 0 ? displayEvents.slice(0, 3) : [
    {
      id: 'default-1',
      title: 'Pdv101',
      startTime: '21:00',
      endTime: '22:00',
      date: selectedDate,
      category: 'work' as const,
      isStarred: true,
    },
    {
      id: 'default-2',
      title: 'Psy',
      startTime: '23:59',
      endTime: '23:59',
      date: selectedDate,
      category: 'reminder' as const,
      isStarred: false,
    },
  ];

  // Format event due time concisely as in picture: "9pm" or "11:59pm"
  const formatDueTime = (timeStr?: string, isStarred?: boolean) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hNum = parseInt(h, 10);
    if (isNaN(hNum)) return timeStr;
    const period = hNum >= 12 ? 'pm' : 'am';
    const formattedH = hNum % 12 || 12;
    const timeFormatted = m === '00' ? `${formattedH}${period}` : `${formattedH}:${m}${period}`;
    return `${timeFormatted}${isStarred ? '*' : ''}`;
  };

  // Font family resolver matching the hand-drawn serif italic typography
  const getFontFamilyClass = () => {
    switch (settings.fontFamily) {
      case 'sketch-serif':
        return "font-['Fraunces',serif] italic font-black";
      case 'serif':
        return "font-['Playfair_Display',serif] italic font-bold";
      case 'jakarta':
        return "font-['Plus_Jakarta_Sans',sans-serif] italic font-bold";
      case 'mono':
        return 'font-mono italic font-bold';
      case 'display':
        return "font-['Fraunces',serif] italic font-extrabold";
      case 'outfit':
      default:
        return "font-['Outfit',sans-serif] italic font-extrabold";
    }
  };

  // Electric lime neon glowing color matching the sketch
  const activeColor = settings.textColor || '#b6ff00';
  const textCustomStyle: React.CSSProperties = {
    color: activeColor,
    opacity: settings.textOpacity ?? 0.95,
    textShadow: `0 0 14px ${activeColor}55, 0 1px 3px rgba(0,0,0,0.85)`,
  };

  const handleOpenCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (settings.hapticsEnabled) soundManager.playClick();
    if (onEventClick) {
      onEventClick({} as any);
    }
  };

  const handleInlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTitle.trim()) return;
    if (settings.hapticsEnabled) soundManager.playSuccess();
    if (onQuickAddReminder) {
      onQuickAddReminder(inlineTitle.trim(), inlineTime, inlineStarred);
    }
    setInlineTitle('');
    setIsInlineEntryOpen(false);
  };

  return (
    <div
      className={`w-full max-w-full flex flex-col justify-between ${
        settings.showDueEntries ? 'min-h-[360px] sm:min-h-[400px]' : 'min-h-[160px] sm:min-h-[185px]'
      } p-4.5 sm:p-6 select-none transition-all box-border overflow-hidden ${getFontFamilyClass()}`}
      style={{
        transform: `scale(${Math.min(settings.textScale || 1.0, 1.15)})`,
        transformOrigin: 'top center',
      }}
    >
      {/* Top Header Area: CLOCK & Month/date on Left, Weather Widget on Top Right */}
      <div className="flex items-start justify-between gap-3 max-w-full">
        <div className="flex flex-col gap-1 min-w-0 shrink">
          {/* 1. CLOCK (e.g. 10:01) */}
          <div
            onClick={onOpenSettings}
            title="Click to open settings"
            className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none cursor-pointer hover:opacity-100 transition-opacity truncate max-w-full"
            style={textCustomStyle}
          >
            <span>{hours}:{minutes}</span>
            {settings.showSeconds && (
              <span className="text-xl sm:text-2xl font-mono opacity-70 ml-1.5 font-normal">
                :{seconds}
              </span>
            )}
          </div>

          {/* 2. Month/date (e.g. Oct. 16/Tue) - Also links to Calendar */}
          {settings.showDate !== false && (
            <div
              onClick={handleOpenCalendar}
              title="Click to open Calendar"
              className="text-2xl sm:text-3xl font-extrabold tracking-wide mt-1.5 cursor-pointer hover:opacity-100 transition-opacity flex items-center gap-2 group truncate max-w-full"
              style={textCustomStyle}
            >
              <span className="truncate">{monthDateString}</span>
              <ExternalLink className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-80 transition-opacity" />
            </div>
          )}
        </div>

        {/* Top Right Header: Weather Widget Component */}
        <div className="pt-1 shrink-0">
          <WeatherWidget
            settings={settings}
            textStyle={textCustomStyle}
          />
        </div>
      </div>

      {/* Optional Middle Section: Due Entries (shown only if enabled in settings) */}
      {settings.showDueEntries && (
        <div className="flex flex-col gap-2.5 sm:gap-3 py-4 sm:py-6 max-w-full overflow-hidden">
          {dueEntries.map((entry, idx) => (
            <div
              key={entry.id || idx}
              onClick={() => onEventClick && onEventClick(entry as any)}
              className="text-xl sm:text-2xl font-bold tracking-tight cursor-pointer hover:opacity-100 transition-opacity flex items-center gap-1.5 max-w-full min-w-0"
              style={textCustomStyle}
            >
              <span className="truncate block max-w-full">
                {entry.title}-{formatDueTime(entry.startTime, entry.isStarred)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Inline Reminder Entry Bar (if expanded on bottom right) */}
      {isInlineEntryOpen && (
        <form
          onSubmit={handleInlineSubmit}
          className="mb-3 p-3 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/20 flex flex-col gap-2 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Quick Reminder Entry</span>
            <button
              type="button"
              onClick={() => setIsInlineEntryOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Pdv101 or Psy"
              value={inlineTitle}
              onChange={(e) => setInlineTitle(e.target.value)}
              autoFocus
              className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
            <input
              type="time"
              value={inlineTime}
              onChange={(e) => setInlineTime(e.target.value)}
              className="bg-white/10 border border-white/15 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
            <button
              type="button"
              onClick={() => setInlineStarred((prev) => !prev)}
              className={`px-2 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                inlineStarred
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-white/5 text-slate-300 border-white/10'
              }`}
              title="Toggle priority deadline asterisk (*)"
            >
              *
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-transform active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* Bottom Section: Settings       ▪ Calendar       Gemini */}
      <div
        className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs sm:text-sm font-bold pt-2.5 mt-1 border-t border-white/10 transition-opacity max-w-full"
        style={textCustomStyle}
      >
        {/* Settings (Left) */}
        <button
          onClick={() => {
            if (settings.hapticsEnabled) soundManager.playClick();
            onOpenSettings();
          }}
          className="hover:underline transition-all cursor-pointer opacity-85 hover:opacity-100"
          style={textCustomStyle}
          title="Open Widget Settings"
        >
          Settings
        </button>

        {/* Center: Indicator & Link to Calendar */}
        <div className="flex items-center gap-2">
          {/* ▪ Dot indicator from sketch (Also toggles lock state) */}
          <button
            onClick={() => {
              if (settings.hapticsEnabled) soundManager.playClick();
              onToggleLock();
            }}
            className="w-2.5 h-2.5 rounded-xs transition-transform active:scale-75 cursor-pointer opacity-75 hover:opacity-100"
            style={{ backgroundColor: activeColor }}
            title={settings.isLocked ? 'Widget is Locked (Click to Unlock)' : 'Widget is Movable (Click to Lock)'}
          />

          {/* Direct Link to Calendar */}
          <button
            onClick={handleOpenCalendar}
            className="text-xs sm:text-sm opacity-85 hover:opacity-100 hover:underline flex items-center gap-1 cursor-pointer"
            style={textCustomStyle}
            title="Open Calendar Panel"
          >
            <span>Calendar</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Gemini AI Workspace Chat Button */}
        {onOpenGemini && (
          <button
            onClick={() => {
              if (settings.hapticsEnabled) soundManager.playClick();
              onOpenGemini();
            }}
            className="text-xs sm:text-sm opacity-85 hover:opacity-100 hover:underline flex items-center gap-1 cursor-pointer"
            style={textCustomStyle}
            title="Open Gemini Workspace AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Gemini</span>
          </button>
        )}

        {/* Reminder (only shown when due entries section is enabled) */}
        {settings.showDueEntries && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (settings.hapticsEnabled) soundManager.playClick();
                setIsInlineEntryOpen((prev) => !prev);
              }}
              className="hover:underline transition-all cursor-pointer flex items-center gap-1"
              style={textCustomStyle}
              title="Quick entry for reminders"
            >
              <span>Reminder</span>
              <Plus className="w-4 h-4 opacity-80" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
