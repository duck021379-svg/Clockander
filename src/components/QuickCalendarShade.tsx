import React, { useEffect } from 'react';
import { CalendarEvent, WidgetSettings } from '../types';
import { CalendarGrid } from './CalendarGrid';
import {
  X,
  ChevronUp,
  Clock,
  Bell,
  Star,
  Zap,
  BatteryCharging,
  Wifi,
  Signal,
  CheckCircle2,
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface QuickCalendarShadeProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  events: CalendarEvent[];
  settings: WidgetSettings;
}

export const QuickCalendarShade: React.FC<QuickCalendarShadeProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  events,
  settings,
}) => {
  // Listen for Win + N or Alt + N or Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle or close on Escape
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const now = new Date();
  const hours = settings.is24Hour
    ? String(now.getHours()).padStart(2, '0')
    : String(now.getHours() % 12 || 12);
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  const fullDateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const todayEvents = events
    .filter((e) => e.date === selectedDate || e.isStarred)
    .sort((a, b) => {
      const toMin = (t?: string) => {
        if (!t) return 9999;
        const [h, m] = t.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
      };
      return toMin(a.startTime) - toMin(b.startTime);
    });

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col justify-between bg-slate-950/95 backdrop-blur-2xl text-slate-100 overflow-y-auto overflow-x-hidden animate-in slide-in-from-top-6 duration-300 border-b border-cyan-400/30 rounded-[32px] sm:rounded-[36px]"
      style={{
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
      }}
    >
      {/* Top Header & Status info */}
      <div className="p-4 sm:p-5 flex flex-col gap-3">
        {/* Peek status indicator bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-cyan-400">Quick Calendar</span>
            <span className="text-[10px] text-slate-500">•</span>
            <span className="text-[11px] font-mono text-slate-300">Win + N Panel</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <button
              onClick={() => {
                if (settings.hapticsEnabled) soundManager.playClick();
                onClose();
              }}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1 cursor-pointer"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Large Prominent Clock & Date (like Windows 11 / Android Notification Drawer) */}
        <div className="flex items-baseline justify-between pt-1">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2 font-['Outfit'] font-extrabold text-5xl sm:text-6xl tracking-tight text-white">
              <span>{hours}:{minutes}</span>
              {!settings.is24Hour && (
                <span className="text-xl font-bold text-cyan-400 font-sans">{ampm}</span>
              )}
            </div>
            <div className="text-sm sm:text-base font-semibold text-slate-300 mt-1">
              {fullDateStr}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-amber-300 font-medium">
              {settings.weatherTemp}°F • {settings.weatherCondition}
            </span>
          </div>
        </div>
      </div>

      {/* Middle: Full Monthly Calendar Grid */}
      <div className="px-3 sm:px-4 py-1">
        <div className="rounded-3xl bg-white/5 border border-white/10 p-2 shadow-inner">
          <CalendarGrid
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            events={events}
            settings={settings}
          />
        </div>
      </div>

      {/* Bottom: Active Notifications & Scheduled Reminders */}
      <div className="p-4 sm:p-5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 px-1">
          <span className="flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active Reminders & Alerts</span>
          </span>
          <span className="text-[11px] text-cyan-400/80 font-mono">
            {todayEvents.length} items
          </span>
        </div>

        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
          {todayEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                <div className="truncate">
                  <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
                    <span>{evt.title}</span>
                    {evt.isStarred && <Star className="w-3 h-3 text-rose-400 fill-rose-400 shrink-0" />}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>{evt.startTime}</span>
                    {evt.description && <span className="text-slate-500">• {evt.description}</span>}
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 shrink-0">
                Scheduled
              </span>
            </div>
          ))}
        </div>

        {/* Slide-Up Dismiss Handle */}
        <button
          onClick={() => {
            if (settings.hapticsEnabled) soundManager.playClick();
            onClose();
          }}
          className="mt-2 w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <ChevronUp className="w-4 h-4 animate-bounce" />
          <span>Slide Up / Close Quick View (Win + N)</span>
        </button>
      </div>
    </div>
  );
};
