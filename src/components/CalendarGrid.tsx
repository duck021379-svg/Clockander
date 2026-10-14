import React, { useState } from 'react';
import { CalendarEvent, WidgetSettings } from '../types';
import {
  generateCalendarGrid,
  MONTH_NAMES,
  WEEKDAY_NAMES_MON,
  WEEKDAY_NAMES_SUN,
  formatDateKey,
} from '../utils/calendar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface CalendarGridProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateKey: string) => void;
  events: CalendarEvent[];
  settings: WidgetSettings;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  selectedDate,
  onSelectDate,
  events,
  settings,
}) => {
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const gridCells = generateCalendarGrid(
    viewYear,
    viewMonth,
    selectedDate,
    settings.startOnMonday
  );

  const weekdayNames = settings.startOnMonday ? WEEKDAY_NAMES_MON : WEEKDAY_NAMES_SUN;

  const handlePrevMonth = () => {
    if (settings.hapticsEnabled) soundManager.playClick();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (settings.hapticsEnabled) soundManager.playClick();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    if (settings.hapticsEnabled) soundManager.playSuccess();
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onSelectDate(formatDateKey(today));
  };

  // Group events by date key for rapid O(1) lookup
  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const evt of events) {
      const list = map.get(evt.date) || [];
      list.push(evt);
      map.set(evt.date, list);
    }
    return map;
  }, [events]);

  return (
    <div className="p-3.5 sm:p-4 rounded-3xl transition-all">
      {/* Month Header Controls */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-cyan-400" />
          <h3 className="font-['Outfit'] font-bold text-base sm:text-lg text-white">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleJumpToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-white/10 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 transition-colors border border-white/10 active:scale-95 cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-colors active:scale-95 cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-colors active:scale-95 cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        {weekdayNames.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* 42-Cell Fixed Grid (6 Rows x 7 Cols) */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {gridCells.map((cell, idx) => {
          const dayEvents = eventsByDate.get(cell.dateKey) || [];
          const hasEvents = dayEvents.length > 0;
          const isSelected = cell.dateKey === selectedDate;

          return (
            <button
              key={`${cell.dateKey}-${idx}`}
              onClick={() => {
                if (settings.hapticsEnabled) soundManager.playClick();
                onSelectDate(cell.dateKey);
              }}
              className={`
                relative h-9 sm:h-10 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer text-xs
                ${!cell.isCurrentMonth ? 'text-slate-500/60' : 'text-slate-200'}
                ${cell.isToday ? 'font-bold text-cyan-300 ring-1 ring-cyan-400/50 bg-cyan-500/10' : ''}
                ${isSelected ? 'bg-cyan-500 text-white font-extrabold shadow-lg shadow-cyan-500/30 scale-105 z-10 ring-2 ring-white/50' : 'hover:bg-white/10'}
              `}
            >
              <span>{cell.dayNumber}</span>

              {/* Event Dots */}
              {hasEvents && (
                <div className="absolute bottom-1 flex items-center justify-center gap-0.5">
                  {dayEvents.slice(0, 3).map((evt, i) => {
                    const dotColor =
                      evt.category === 'google'
                        ? 'bg-blue-400'
                        : evt.category === 'meeting'
                        ? 'bg-purple-400'
                        : evt.category === 'fitness'
                        ? 'bg-emerald-400'
                        : evt.category === 'personal'
                        ? 'bg-amber-400'
                        : 'bg-cyan-400';

                    return (
                      <span
                        key={i}
                        className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : dotColor}`}
                      />
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <span className={`w-0.5 h-0.5 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-300'}`} />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
