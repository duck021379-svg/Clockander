import React, { useEffect, useState, useRef } from 'react';
import { WidgetSettings, CalendarEvent } from '../types';
import { PrecisionClockEngine, computeClockAngles } from '../utils/clock';
import { CloudSun, BatteryCharging, Zap, Settings, BellPlus } from 'lucide-react';
import { MONTH_NAMES, WEEKDAY_NAMES_SUN } from '../utils/calendar';
import { soundManager } from '../utils/audio';

interface ClockWidgetProps {
  settings: WidgetSettings;
  events?: CalendarEvent[];
  onStyleToggle?: () => void;
  onOpenSettings?: () => void;
  onSetReminder?: () => void;
}

export const ClockWidget: React.FC<ClockWidgetProps> = ({
  settings,
  events = [],
  onStyleToggle,
  onOpenSettings,
  onSetReminder,
}) => {
  const [time, setTime] = useState<Date>(new Date());
  const [angles, setAngles] = useState({ hourAngle: 0, minuteAngle: 0, secondAngle: 0 });
  const animFrameRef = useRef<number | null>(null);

  // Setup drift-free clock engine
  useEffect(() => {
    const engine = new PrecisionClockEngine(
      (now) => setTime(now),
      settings.showSeconds ? 'second' : 'minute'
    );
    engine.start();

    return () => {
      engine.stop();
    };
  }, [settings.showSeconds]);

  // Smooth continuous analog sweep when analog style is active
  useEffect(() => {
    if (settings.clockStyle !== 'analog') return;

    let active = true;
    const loop = () => {
      if (!active) return;
      setAngles(computeClockAngles(new Date()));
      animFrameRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [settings.clockStyle]);

  // Formatting helpers
  const hoursRaw = time.getHours();
  const hoursFormatted = settings.is24Hour
    ? String(hoursRaw).padStart(2, '0')
    : String(hoursRaw % 12 || 12);
  const minutesFormatted = String(time.getMinutes()).padStart(2, '0');
  const secondsFormatted = String(time.getSeconds()).padStart(2, '0');
  const ampm = hoursRaw >= 12 ? 'pm' : 'am';
  const weekday = WEEKDAY_NAMES_SUN[time.getDay()];
  const monthName = MONTH_NAMES[time.getMonth()];
  const dayOfMonth = time.getDate();

  // Month abbreviation, e.g. "Oct"
  const monthShort = time.toLocaleDateString('en-US', { month: 'short' });
  const weekdayShort = time.toLocaleDateString('en-US', { weekday: 'short' });
  const conciseDateLine = `${monthShort}.${dayOfMonth}/${weekdayShort}`;
  const conciseTimeLine = `${hoursFormatted}:${minutesFormatted}${ampm}`;

  // Font family class resolver
  const getFontFamilyClass = () => {
    switch (settings.fontFamily) {
      case 'jakarta':
        return 'font-[\'Plus_Jakarta_Sans\']';
      case 'mono':
        return 'font-mono';
      case 'serif':
        return 'font-serif';
      case 'display':
        return 'font-[\'Outfit\'] font-black tracking-tight';
      case 'outfit':
      default:
        return 'font-[\'Outfit\']';
    }
  };

  const textCustomStyle: React.CSSProperties = {
    color: settings.textColor || '#ffffff',
    opacity: settings.textOpacity ?? 0.88,
  };

  // Battery & weather from settings or simulated
  const batteryPct = settings.batteryLevel;
  const tempF = settings.weatherTemp;

  // Render STYLE 1: User's Requested "Translucent Text Glance"
  // Example:
  // Oct.11/Tues
  // 10:00pm
  // Pdv101-9pm
  // Psy-11:59pm*
  // Setting      set reminder
  if (settings.clockStyle === 'text-glance') {
    // Format upcoming events for the date
    const displayEvents = events.slice(0, 3);

    const formatEventTime = (timeStr: string) => {
      if (!timeStr) return '';
      const [h, m] = timeStr.split(':');
      const hourNum = parseInt(h, 10);
      if (isNaN(hourNum)) return timeStr;
      const period = hourNum >= 12 ? 'pm' : 'am';
      const formattedH = hourNum % 12 || 12;
      return m === '00' ? `${formattedH}${period}` : `${formattedH}:${m}${period}`;
    };

    return (
      <div
        className={`p-4 sm:p-5 flex flex-col gap-3.5 transition-all select-none ${getFontFamilyClass()}`}
        style={{
          transform: `scale(${settings.textScale || 1.0})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Date Line: e.g. Oct.11/Tues */}
        {settings.showDate !== false && (
          <div
            onClick={onStyleToggle}
            title="Click to toggle clock style"
            className="text-lg sm:text-xl font-bold tracking-tight cursor-pointer hover:opacity-100 transition-opacity"
            style={textCustomStyle}
          >
            {conciseDateLine}
          </div>
        )}

        {/* Time Line: e.g. 10:00pm */}
        <div
          onClick={onStyleToggle}
          title="Click to toggle clock style"
          className="text-4xl sm:text-5xl font-extrabold tracking-tight cursor-pointer hover:opacity-100 transition-opacity leading-none"
          style={textCustomStyle}
        >
          {conciseTimeLine}
          {settings.showSeconds && (
            <span className="text-xl font-normal ml-1.5 opacity-70">
              :{secondsFormatted}
            </span>
          )}
        </div>

        {/* Event Lines: e.g. Pdv101-9pm, Psy-11:59pm* */}
        <div className="flex flex-col gap-1.5 text-base sm:text-lg font-medium leading-tight">
          {displayEvents.length > 0 ? (
            displayEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center gap-1.5 hover:opacity-100 transition-opacity cursor-pointer"
                style={textCustomStyle}
              >
                <span>{evt.title}-{formatEventTime(evt.startTime)}</span>
                {evt.isStarred && <span className="text-amber-400 font-bold">*</span>}
              </div>
            ))
          ) : (
            <>
              <div className="hover:opacity-100 transition-opacity" style={textCustomStyle}>
                Pdv101-9pm
              </div>
              <div className="hover:opacity-100 transition-opacity" style={textCustomStyle}>
                Psy-11:59pm<span className="text-amber-400 font-bold">*</span>
              </div>
            </>
          )}
        </div>

        {/* Action Row: Setting      set reminder */}
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/10 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => {
              if (settings.hapticsEnabled) soundManager.playClick();
              if (onOpenSettings) onOpenSettings();
            }}
            className="hover:underline flex items-center gap-1.5 transition-opacity cursor-pointer"
            style={textCustomStyle}
          >
            <Settings className="w-3.5 h-3.5 opacity-80" />
            <span>Setting</span>
          </button>

          <button
            onClick={() => {
              if (settings.hapticsEnabled) soundManager.playClick();
              if (onSetReminder) onSetReminder();
            }}
            className="hover:underline flex items-center gap-1.5 transition-opacity cursor-pointer"
            style={textCustomStyle}
          >
            <BellPlus className="w-3.5 h-3.5 opacity-80" />
            <span>set reminder</span>
          </button>
        </div>
      </div>
    );
  }

  // Render STYLE 2: Motorola Orbit Ring Dial
  if (settings.clockStyle === 'orbit') {
    const strokeDashoffset = 283 - (283 * batteryPct) / 100;

    return (
      <div
        onClick={onStyleToggle}
        className="relative group cursor-pointer p-4 rounded-3xl transition-transform active:scale-[0.98]"
        title="Click to toggle clock style"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Main Dial */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            {/* Outer Glow Ring */}
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-white/10"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="url(#motoGradient)"
                strokeWidth="4.5"
                strokeDasharray="276"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="motoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div
                className="text-3xl font-extrabold tracking-tight flex items-baseline font-['Outfit']"
                style={textCustomStyle}
              >
                <span>{hoursFormatted}</span>
                <span className="text-cyan-400 animate-pulse mx-0.5">:</span>
                <span>{minutesFormatted}</span>
              </div>
              {!settings.is24Hour && (
                <div className="text-[10px] font-semibold text-cyan-300 tracking-wider">
                  {ampm.toUpperCase()}
                </div>
              )}
              {settings.showSeconds && (
                <div className="text-[11px] font-mono opacity-80" style={textCustomStyle}>
                  :{secondsFormatted}
                </div>
              )}
            </div>
          </div>

          {/* Moto Glance Metadata Column */}
          <div className="flex flex-col justify-center gap-2 text-left">
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>Moto Glance</span>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-white/10 text-[11px] text-slate-300 flex items-center gap-1">
                <BatteryCharging className="w-3 h-3 text-emerald-400" />
                <span>{batteryPct}%</span>
              </div>
            </div>

            <div className="text-sm font-semibold" style={textCustomStyle}>
              {weekday}, {monthName} {dayOfMonth}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CloudSun className="w-4 h-4 text-amber-400" />
              <span>{tempF}°F • {settings.weatherCondition}</span>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Live Synced</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render STYLE 3: Clean Digital Glance
  if (settings.clockStyle === 'digital') {
    return (
      <div
        onClick={onStyleToggle}
        className="group cursor-pointer p-4 rounded-3xl transition-transform active:scale-[0.98]"
        title="Click to toggle clock style"
      >
        <div className="flex items-baseline justify-between gap-2">
          <div
            className={`flex items-baseline font-extrabold text-5xl sm:text-6xl tracking-tight ${getFontFamilyClass()}`}
            style={textCustomStyle}
          >
            <span>{hoursFormatted}</span>
            <span className="text-cyan-400/90 mx-1">:</span>
            <span>{minutesFormatted}</span>
            {settings.showSeconds && (
              <span className="text-xl sm:text-2xl font-mono opacity-60 ml-2 font-normal">
                {secondsFormatted}
              </span>
            )}
          </div>
          {!settings.is24Hour && (
            <span className="text-sm font-bold text-cyan-400 px-2 py-0.5 rounded-md bg-cyan-400/10 border border-cyan-400/20">
              {ampm.toUpperCase()}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
          <span className="font-medium" style={textCustomStyle}>
            {weekday}, {monthName} {dayOfMonth}
          </span>
          <span className="flex items-center gap-1.5 text-amber-300">
            <CloudSun className="w-3.5 h-3.5" />
            {tempF}°F {settings.weatherCondition}
          </span>
        </div>
      </div>
    );
  }

  // Render STYLE 4: Neo-Glass Analog Watch Face
  if (settings.clockStyle === 'analog') {
    return (
      <div
        onClick={onStyleToggle}
        className="group cursor-pointer p-3 rounded-3xl flex flex-col items-center justify-center transition-transform active:scale-[0.98]"
        title="Click to toggle clock style"
      >
        <div className="relative w-40 h-40 rounded-full border border-white/20 bg-slate-900/60 shadow-inner flex items-center justify-center">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 bg-white/40"
              style={{
                height: i % 3 === 0 ? '8px' : '4px',
                transform: `rotate(${i * 30}deg) translateY(-68px)`,
                backgroundColor: i % 3 === 0 ? '#38bdf8' : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}

          <div
            className="absolute w-1.5 rounded-full bg-white origin-bottom shadow-md"
            style={{
              height: '38px',
              bottom: '50%',
              transform: `rotate(${angles.hourAngle}deg)`,
              transformOrigin: '50% 100%',
            }}
          />

          <div
            className="absolute w-1 rounded-full bg-cyan-300 origin-bottom shadow-md"
            style={{
              height: '52px',
              bottom: '50%',
              transform: `rotate(${angles.minuteAngle}deg)`,
              transformOrigin: '50% 100%',
            }}
          />

          <div
            className="absolute w-0.5 rounded-full bg-rose-500 origin-bottom shadow-sm"
            style={{
              height: '62px',
              bottom: '50%',
              transform: `rotate(${angles.secondAngle}deg)`,
              transformOrigin: '50% 100%',
            }}
          />

          <div className="absolute w-3 h-3 rounded-full bg-cyan-400 border-2 border-slate-900 shadow-md z-10" />
        </div>

        <div className="mt-3 text-center">
          <div className="text-xs font-semibold" style={textCustomStyle}>
            {weekday}, {monthName} {dayOfMonth}
          </div>
          <div className="text-[11px] text-cyan-300 font-mono">
            {hoursFormatted}:{minutesFormatted} {ampm.toUpperCase()}
          </div>
        </div>
      </div>
    );
  }

  // Render STYLE 5: Material You Dual-Stack (Android 12/13/14)
  return (
    <div
      onClick={onStyleToggle}
      className="group cursor-pointer p-4 rounded-3xl flex items-center justify-between transition-transform active:scale-[0.98]"
      title="Click to toggle clock style"
    >
      <div className="flex flex-col leading-none font-['Outfit'] font-black text-4xl sm:text-5xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-200 via-teal-300 to-blue-400">
        <div>{hoursFormatted}</div>
        <div className="text-white/80">{minutesFormatted}</div>
      </div>

      <div className="flex flex-col items-end gap-1.5 text-right">
        <div className="px-3 py-1 rounded-2xl bg-cyan-400/20 text-cyan-200 font-semibold text-xs border border-cyan-400/30">
          Material You
        </div>
        <div className="text-sm font-semibold" style={textCustomStyle}>
          {weekday}, {monthName} {dayOfMonth}
        </div>
        <div className="text-xs text-slate-300 flex items-center gap-1">
          <CloudSun className="w-3.5 h-3.5 text-amber-300" />
          <span>{tempF}°F</span>
        </div>
      </div>
    </div>
  );
};
