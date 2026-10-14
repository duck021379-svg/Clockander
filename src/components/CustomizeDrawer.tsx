import React from 'react';
import { WidgetSettings } from '../types';
import {
  X,
  Palette,
  Type,
  Clock,
  Sliders,
  ExternalLink,
  Plus,
  Calendar,
  Lock,
  Unlock,
  RotateCcw,
  Sparkles,
  CloudSun,
  Volume2,
  Mic,
  Bot,
  Radio,
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { speechManager, SpeechSettings, ALL_KOKORO_VOICES, KOKORO_FEMALE_VOICES } from '../utils/speech';
import { PWAInstallButton } from './PWAInstallButton';

interface CustomizeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WidgetSettings;
  onUpdateSettings: (newSettings: WidgetSettings) => void;
  onDataReload?: () => void;
  onOpenReminderModal?: () => void;
  onOpenCalendarShade?: () => void;
  onOpenGemini?: () => void;
}

export const CustomizeDrawer: React.FC<CustomizeDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onDataReload,
  onOpenReminderModal,
  onOpenCalendarShade,
  onOpenGemini,
}) => {
  if (!isOpen) return null;

  const [speechSettings, setSpeechSettings] = React.useState<SpeechSettings>(speechManager.getSettings());
  const voices = speechManager.getVoices();

  const handleUpdateSpeech = (partial: Partial<SpeechSettings>) => {
    const updated = { ...speechSettings, ...partial };
    setSpeechSettings(updated);
    speechManager.updateSettings(partial);
  };

  const handleTestVoice = (customVoiceURI?: string | React.MouseEvent) => {
    if (settings.hapticsEnabled) soundManager.playClick();
    if (speechSettings.engine === 'kokoro') {
      speechManager.speakKokoro(
        `Testing Kokoro vocal reminder. This is the ${speechSettings.kokoroVoice} female voice on Clockander.`,
        {
          voice: speechSettings.kokoroVoice,
          endpoint: speechSettings.kokoroEndpoint,
          speed: speechSettings.rate,
        }
      );
    } else {
      const uri = typeof customVoiceURI === 'string' ? customVoiceURI : speechSettings.voiceURI;
      speechManager.speak(
        'Testing vocal reminder. Your schedule is up to date with Gemini and Google Workspace.',
        {
          voiceURI: uri,
          rate: speechSettings.rate,
          pitch: speechSettings.pitch,
          forceBrowser: true,
        }
      );
    }
  };

  const update = (partial: Partial<WidgetSettings>) => {
    if (settings.hapticsEnabled) soundManager.playClick();
    onUpdateSettings({ ...settings, ...partial });
  };

  const handleResetToSketchDefaults = () => {
    if (settings.hapticsEnabled) soundManager.playSuccess();
    update({
      textColor: '#b6ff00',
      fontFamily: 'sketch-serif',
      textOpacity: 0.95,
      transparentBgOnly: true,
      clockStyle: 'text-glance',
      layoutPreset: 'simple',
      textScale: 1.0,
      showDate: true,
      is24Hour: false,
      showSeconds: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-slate-950/95 border-l border-white/10 p-5 flex flex-col justify-between overflow-y-auto text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="font-['Outfit'] font-bold text-base text-white">
              Widget Settings & Appearance
            </h2>
          </div>
          <button
            onClick={() => {
              if (settings.hapticsEnabled) soundManager.playClick();
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="flex-1 py-4 flex flex-col gap-5 text-xs">
          {/* Quick Action: Reset to Picture Style */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-lime-500/20 to-cyan-500/20 border border-lime-400/30">
            <div>
              <div className="text-white font-bold text-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                <span>Reset to Picture Style</span>
              </div>
              <div className="text-[10px] text-slate-300">
                Electric Lime, Fraunces Serif Italic, Floating
              </div>
            </div>
            <button
              onClick={handleResetToSketchDefaults}
              className="px-3 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Apply Preset
            </button>
          </div>

          {/* Download Applet / PWA Install */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border border-emerald-400/30">
            <div>
              <div className="text-white font-bold text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Download & Install Applet</span>
              </div>
              <div className="text-[10px] text-slate-300">
                Install as a standalone app on your Home Screen or Desktop
              </div>
            </div>
            <PWAInstallButton />
          </div>

          {/* 1. SLIDER FOR SOLID / OPAQUE */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
            <div className="flex justify-between items-center text-slate-200 font-semibold">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Slider for Solid / Opaque</span>
              </span>
              <span className="font-mono text-cyan-300 font-bold">
                {Math.round((settings.textOpacity ?? 0.95) * 100)}% {settings.textOpacity === 1 ? 'Solid' : 'Opaque'}
              </span>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>15% (Translucent)</span>
                <span>50%</span>
                <span>100% (Solid)</span>
              </div>
              <input
                type="range"
                min="0.15"
                max="1.0"
                step="0.05"
                value={settings.textOpacity ?? 0.95}
                onChange={(e) => update({ textOpacity: parseFloat(e.target.value) })}
                className="w-full accent-lime-400 cursor-pointer"
              />
            </div>

            {/* Background Transparency Mode Toggle */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer mt-1">
              <div>
                <div className="text-slate-200 font-medium text-xs">Translucent Background (Floating Text)</div>
                <div className="text-[10px] text-slate-400">Pure text floating directly on wallpaper (as in picture)</div>
              </div>
              <input
                type="checkbox"
                checked={settings.transparentBgOnly}
                onChange={(e) => update({ transparentBgOnly: e.target.checked })}
                className="rounded text-cyan-500 focus:ring-cyan-400 cursor-pointer"
              />
            </label>
          </div>

          {/* 2. LIST OF CHOICES FOR COLOR */}
          <div className="flex flex-col gap-2">
            <label className="text-slate-300 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-cyan-400" />
                <span>Choice of Colors</span>
              </span>
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/30"
                style={{ backgroundColor: settings.textColor || '#b6ff00' }}
              />
            </label>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Electric Lime (Picture)', color: '#b6ff00' },
                { label: 'Pure White', color: '#ffffff' },
                { label: 'Glacier Cyan', color: '#38bdf8' },
                { label: 'Soft Mint', color: '#34d399' },
                { label: 'Amber Gold', color: '#fbbf24' },
                { label: 'Lavender', color: '#c084fc' },
                { label: 'Rose Quartz', color: '#f43f5e' },
                { label: 'Sunset Orange', color: '#f97316' },
              ].map((tc) => (
                <button
                  key={tc.color}
                  onClick={() => update({ textColor: tc.color })}
                  className={`py-2 px-2 rounded-xl border text-[10px] flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    settings.textColor === tc.color
                      ? 'border-white font-bold text-white bg-white/15 ring-2 ring-white/50'
                      : 'border-white/10 text-slate-400 hover:text-white bg-white/5'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 shadow-md"
                    style={{ backgroundColor: tc.color }}
                  />
                  <span className="truncate text-center w-full">{tc.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. LIST OF CHOICES FOR FONT */}
          <div className="flex flex-col gap-2">
            <label className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Type className="w-4 h-4 text-cyan-400" />
              <span>Choice of Fonts</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'sketch-serif', label: 'Sketch Serif (Fraunces Heavy)', style: "font-['Fraunces',serif] italic font-bold" },
                { id: 'serif', label: 'Playfair Classic Serif', style: "font-['Playfair_Display',serif] italic" },
                { id: 'outfit', label: 'Outfit Modern Rounded', style: "font-['Outfit',sans-serif] italic" },
                { id: 'jakarta', label: 'Plus Jakarta Android Clean', style: "font-['Plus_Jakarta_Sans',sans-serif] italic" },
                { id: 'mono', label: 'JetBrains Tech Mono', style: 'font-mono italic' },
                { id: 'display', label: 'Bold Heavy Display', style: "font-['Fraunces',serif] italic font-black" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => update({ fontFamily: f.id as any })}
                  className={`py-2 px-3 rounded-xl border text-left transition-all cursor-pointer ${
                    settings.fontFamily === f.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold ring-1 ring-cyan-400/50'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className={`text-xs ${f.style}`}>{f.label}</div>
                </button>
              ))}
            </div>

            {/* Font Size Scale Slider */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 mt-1">
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Font Size / Scale</span>
                <span className="font-mono text-cyan-300">
                  {Math.round((settings.textScale ?? 1.0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.05"
                value={settings.textScale ?? 1.0}
                onChange={(e) => update({ textScale: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* 4. 5 OR SO CLOCK STYLES */}
          <div className="flex flex-col gap-2">
            <label className="text-slate-300 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>5 Clock Styles</span>
              </span>
              <span className="text-[10px] text-cyan-300 uppercase">{settings.clockStyle}</span>
            </label>

            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  id: 'text-glance',
                  title: '1. Text Glance (Picture Style: 10:01 / Oct. 16)',
                  desc: 'Clean slanted text with electric glowing numbers and due entries',
                },
                {
                  id: 'orbit',
                  title: '2. Moto Edge Orbit Ring',
                  desc: 'Motorola chronometer dial with battery and weather arc indicators',
                },
                {
                  id: 'digital',
                  title: '3. Clean Digital Clock',
                  desc: 'Bold stacked hours and minutes with high-contrast digits',
                },
                {
                  id: 'analog',
                  title: '4. Neo-Glass Analog Clock',
                  desc: 'Circular glass watchface with live sweep hour and minute hands',
                },
                {
                  id: 'material',
                  title: '5. Material You Stack',
                  desc: 'Android 14 pill-shaped clock widget with soft corners',
                },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => update({ clockStyle: st.id as any })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    settings.clockStyle === st.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold shadow-sm'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-semibold text-white">{st.title}</div>
                  <div className="text-[10px] text-slate-400">{st.desc}</div>
                </button>
              ))}
            </div>

            {/* Time Format Toggles */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                <span>24-Hour Format</span>
                <input
                  type="checkbox"
                  checked={settings.is24Hour}
                  onChange={(e) => update({ is24Hour: e.target.checked })}
                  className="rounded text-cyan-500 focus:ring-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                <span>Show Live Seconds</span>
                <input
                  type="checkbox"
                  checked={settings.showSeconds}
                  onChange={(e) => update({ showSeconds: e.target.checked })}
                  className="rounded text-cyan-500 focus:ring-cyan-400"
                />
              </label>
            </div>
          </div>

          {/* 5. WEATHER WIDGET HEADER SETTINGS */}
          <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-white font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CloudSun className="w-4 h-4 text-amber-400" />
                <span>Weather Component (Top Right)</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Live API Synced</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Pulls live local temperature and weather conditions using the Open-Meteo API. Click temperature directly on the widget to toggle between °F and °C.
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <label className="block text-[10px] text-slate-300 mb-1">Fallback Temp (°F)</label>
                <input
                  type="number"
                  value={settings.weatherTemp || 72}
                  onChange={(e) => update({ weatherTemp: parseInt(e.target.value, 10) || 72 })}
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-300 mb-1">Fallback Condition</label>
                <select
                  value={settings.weatherCondition || 'Partly Cloudy'}
                  onChange={(e) => update({ weatherCondition: e.target.value })}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Clear Sky">Clear Sky</option>
                  <option value="Partly Cloudy">Partly Cloudy</option>
                  <option value="Overcast">Overcast</option>
                  <option value="Rain">Rain</option>
                  <option value="Thunderstorm">Thunderstorm</option>
                  <option value="Snow">Snow</option>
                </select>
              </div>
            </div>
          </div>

          {/* 6. VOCAL REMINDERS & SPEECH CONFIGURATION */}
          <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-white font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>Vocal Reminder Options</span>
              </span>
              <button
                type="button"
                onClick={handleTestVoice}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-[11px] font-bold transition-colors cursor-pointer"
              >
                Test Voice
              </button>
            </div>

            {/* TTS Engine Switcher (Kokoro TTS vs Browser) */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => {
                  handleUpdateSpeech({ engine: 'kokoro' });
                  speechManager.speakKokoro('Kokoro model selected.', {
                    voice: speechSettings.kokoroVoice,
                    endpoint: speechSettings.kokoroEndpoint,
                  });
                }}
                className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  speechSettings.engine === 'kokoro'
                    ? 'bg-gradient-to-r from-rose-500/30 to-pink-500/30 text-pink-200 border border-pink-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🌸 Kokoro (Downloaded)</span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateSpeech({ engine: 'browser' })}
                className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  speechSettings.engine === 'browser'
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🌐 Browser Speech</span>
              </button>
            </div>

            {/* KOKORO FEMALE VOICES ONLY (When Kokoro Engine Active) */}
            {speechSettings.engine === 'kokoro' ? (
              <div className="flex flex-col gap-2.5 p-2.5 rounded-xl bg-rose-500/5 border border-rose-400/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-300 flex items-center gap-1">
                    <span>Female Voice Selection</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-200 border border-pink-400/30">
                      Female Only
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTestVoice()}
                    className="text-[10px] text-pink-300 hover:text-pink-100 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Hear Sample</span>
                  </button>
                </div>

                {/* Dropdown with 13 strictly female voices */}
                <select
                  value={speechSettings.kokoroVoice || 'af_heart'}
                  onChange={(e) => {
                    const chosen = e.target.value;
                    handleUpdateSpeech({ kokoroVoice: chosen });
                    speechManager.speakKokoro(`Voice changed to ${chosen}.`, {
                      voice: chosen,
                      endpoint: speechSettings.kokoroEndpoint,
                      speed: speechSettings.rate,
                    });
                  }}
                  className="w-full bg-slate-900 border border-rose-400/30 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-pink-400"
                >
                  <optgroup label="🇺🇸 American English Female (af_)">
                    {ALL_KOKORO_VOICES.filter((v) => v.gender === 'female' && v.accent === 'American').map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.id}) — {v.description}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🇬🇧 British English Female (bf_)">
                    {ALL_KOKORO_VOICES.filter((v) => v.gender === 'female' && v.accent === 'British').map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.id}) — {v.description}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🇺🇸 American English Male (am_)">
                    {ALL_KOKORO_VOICES.filter((v) => v.gender === 'male' && v.accent === 'American').map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.id}) — {v.description}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🇬🇧 British English Male (bm_)">
                    {ALL_KOKORO_VOICES.filter((v) => v.gender === 'male' && v.accent === 'British').map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.id}) — {v.description}
                      </option>
                    ))}
                  </optgroup>
                </select>

                {/* Selected Voice Details Chip */}
                {(() => {
                  const curr = ALL_KOKORO_VOICES.find((v) => v.id === speechSettings.kokoroVoice);
                  return (
                    curr && (
                      <div className="text-[11px] text-pink-200/90 flex items-center justify-between px-1">
                        <span>{curr.accent} {curr.gender || 'voice'}</span>
                        <span className="italic">{curr.description}</span>
                      </div>
                    )
                  );
                })()}

                {/* Local Kokoro Server URL Endpoint */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-300 font-medium">
                      Downloaded Kokoro Endpoint
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateSpeech({ kokoroEndpoint: 'http://localhost:8880/v1/audio/speech' })}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300"
                      >
                        :8880
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateSpeech({ kokoroEndpoint: 'http://127.0.0.1:8880/v1/audio/speech' })}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300"
                      >
                        127.0.0.1
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={speechSettings.kokoroEndpoint}
                    onChange={(e) => handleUpdateSpeech({ kokoroEndpoint: e.target.value })}
                    placeholder="http://localhost:8880/v1/audio/speech"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-pink-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Points to your downloaded local Kokoro instance (with automatic browser fallback if offline).
                  </p>
                </div>
              </div>
            ) : (
              /* BROWSER SPEECH FALLBACK OPTIONS */
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-slate-300 font-medium">Preferred System Voice</label>
                  <button
                    type="button"
                    onClick={() => handleTestVoice(speechSettings.voiceURI)}
                    className="text-[10px] text-cyan-300 hover:text-cyan-200 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Preview Voice</span>
                  </button>
                </div>
                <select
                  value={speechSettings.voiceURI || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleUpdateSpeech({ voiceURI: val });
                    speechManager.speak('Voice updated.', {
                      voiceURI: val,
                      rate: speechSettings.rate,
                      pitch: speechSettings.pitch,
                      forceBrowser: true,
                    });
                  }}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">Default English Voice (Auto)</option>
                  <option value="en-GB">British English (en-GB Standard)</option>
                  {voices
                    .filter((v) => v.lang.startsWith('en'))
                    .map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang}){v.localService ? ' - Offline' : ''}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Vocal Alerts on Due Toggle */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
              <div>
                <div className="text-slate-200 font-medium text-xs">Vocal Alerts on Due</div>
                <div className="text-[10px] text-slate-400">Speaks out loud when a reminder or deadline occurs</div>
              </div>
              <input
                type="checkbox"
                checked={speechSettings.vocalAlertsOnDue}
                onChange={(e) => handleUpdateSpeech({ vocalAlertsOnDue: e.target.checked })}
                className="rounded text-cyan-500 focus:ring-cyan-400 cursor-pointer"
              />
            </label>

            {/* Auto-speak Gemini Response */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
              <div>
                <div className="text-slate-200 font-medium text-xs">Auto-Speak Gemini Chat</div>
                <div className="text-[10px] text-slate-400">Automatically vocalizes AI responses in chat</div>
              </div>
              <input
                type="checkbox"
                checked={speechSettings.autoSpeakGemini}
                onChange={(e) => handleUpdateSpeech({ autoSpeakGemini: e.target.checked })}
                className="rounded text-cyan-500 focus:ring-cyan-400 cursor-pointer"
              />
            </label>

            {/* Speech Speed / Pace slider */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                <span>Speed / Rate</span>
                <span className="font-mono text-cyan-300">{speechSettings.rate}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={speechSettings.rate}
                onChange={(e) => handleUpdateSpeech({ rate: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* 7. WIDGET DISPLAY LAYOUT */}
          <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-white font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Display Layout</span>
              </span>
              <span className="text-[10px] text-cyan-300 font-mono">
                {settings.showDueEntries ? 'Clock + Due' : 'Clock / Cal / Weather'}
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Configure whether to display just the top part (Clock, Calendar, and Weather) or include the scheduled due entries.
            </p>

            <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
              <div>
                <div className="text-slate-200 font-medium text-xs">Show Schedule Due Entries</div>
                <div className="text-[10px] text-slate-400">Display upcoming due entries below the clock</div>
              </div>
              <input
                type="checkbox"
                checked={!!settings.showDueEntries}
                onChange={(e) => update({ showDueEntries: e.target.checked })}
                className="rounded text-cyan-500 focus:ring-cyan-400 cursor-pointer"
              />
            </label>
          </div>

          {/* 8. GEMINI WORKSPACE AI CHAT & SHORTCUTS */}
          <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-white font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-purple-400" />
                <span>Gemini Workspace Assistant</span>
              </span>
              <span className="text-[10px] text-purple-300 font-mono">Workspace Synced</span>
            </div>

            {onOpenGemini && (
              <button
                type="button"
                onClick={() => {
                  if (settings.hapticsEnabled) soundManager.playClick();
                  onOpenGemini();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/25 to-purple-600/25 hover:from-cyan-500/35 hover:to-purple-600/35 border border-cyan-400/40 text-cyan-200 font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                <span>Open Gemini Workspace Chat</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => {
                  if (settings.hapticsEnabled) soundManager.playClick();
                  if (onOpenReminderModal) onOpenReminderModal();
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-300 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Reminder</span>
              </button>

              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold flex items-center justify-center gap-1.5 transition-colors text-center"
              >
                <span>Google Calendar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {onOpenCalendarShade && (
              <button
                onClick={() => {
                  if (settings.hapticsEnabled) soundManager.playClick();
                  onOpenCalendarShade();
                  onClose();
                }}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Slide Down Win + N Monthly Calendar</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <button
              onClick={() => update({ isLocked: !settings.isLocked })}
              className="flex items-center gap-1 text-slate-300 hover:text-white"
            >
              {settings.isLocked ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{settings.isLocked ? 'Locked' : 'Unlocked'}</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (settings.hapticsEnabled) soundManager.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all active:scale-95 cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
