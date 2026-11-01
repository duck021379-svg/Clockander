import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Download,
  Share,
  PlusSquare,
  X,
  Laptop,
  Smartphone,
  Monitor,
  Terminal,
  FileCode2,
  Pin,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface PWAInstallButtonProps {
  compact?: boolean;
  className?: string;
  haptics?: boolean;
  textStyle?: React.CSSProperties;
  minimalText?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  className = '',
  haptics = true,
  textStyle,
  minimalText = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<'windows' | 'mobile'>('windows');
  const [copiedCmd, setCopiedCmd] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000';

  const handleInstallClick = async () => {
    if (haptics) soundManager.playClick();
    if (isInstallable) {
      const outcome = await install();
      if (outcome && haptics) {
        soundManager.playSuccess();
      } else {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  // Generate & download a Windows Desktop Widget Launcher (.bat) that opens the app in frameless Windows App Mode
  const handleDownloadWindowsLauncher = () => {
    if (haptics) soundManager.playSuccess();
    const batContent = [
      '@echo off',
      'title Clockander Windows Desktop Widget Launcher',
      'echo Launching Clockander Desktop Widget...',
      'REM Try Microsoft Edge in native frameless app-widget mode first (pre-installed on Windows 10/11)',
      'start "" msedge --app="' + appUrl + '" --window-size=440,760 --window-position=80,80',
      'if %errorlevel% neq 0 (',
      '  start "" chrome --app="' + appUrl + '" --window-size=440,760 --window-position=80,80',
      ')',
      'exit',
    ].join('\r\n');

    const blob = new Blob([batContent], { type: 'application/x-bat;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Clockander_Windows_Widget.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate & download a standard Windows Internet Shortcut (.url) for Desktop / Startup folder
  const handleDownloadWindowsShortcut = () => {
    if (haptics) soundManager.playSuccess();
    const urlContent = [
      '[InternetShortcut]',
      'URL=' + appUrl,
      'IconIndex=0',
    ].join('\r\n');

    const blob = new Blob([urlContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Clockander_Desktop_Shortcut.url';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyEdgeCommand = () => {
    if (haptics) soundManager.playClick();
    const cmd = `msedge --app="${appUrl}" --window-size=440,760`;
    navigator.clipboard.writeText(cmd).catch(() => {});
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <>
      {minimalText ? (
        <button
          onClick={() => {
            if (haptics) soundManager.playClick();
            setShowGuide(true);
          }}
          className={`text-xs sm:text-sm opacity-85 hover:opacity-100 hover:underline flex items-center gap-1 cursor-pointer ${className}`}
          style={textStyle}
          title="Install or Download for Windows 10/11 Desktop"
        >
          <Monitor className="w-3.5 h-3.5 text-emerald-400" />
          <span>Windows App</span>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          title="Put on Windows 10/11 Desktop or Install App"
          className={`flex items-center gap-1.5 rounded-xl border font-semibold transition-all active:scale-95 cursor-pointer shadow-sm ${
            compact
              ? 'p-1.5 px-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/40 text-emerald-300 text-xs'
              : 'px-3 py-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border-emerald-400/40 text-emerald-300 text-xs'
          } ${className}`}
        >
          <Monitor className="w-3.5 h-3.5 text-emerald-400" />
          <span>{compact ? 'Windows App' : 'Get for Windows'}</span>
        </button>
      )}

      {/* Windows & Device Installation Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/15 p-5 text-slate-100 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 shadow-md">
                  <Monitor className="w-4 h-4 font-bold" />
                </div>
                <div>
                  <h3 className="font-['Outfit'] font-bold text-sm sm:text-base text-white">
                    Put Clockander on Windows
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Run as a native Windows 10 / 11 Desktop Widget
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Platform Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('windows')}
                className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'windows'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Windows 10 / 11 PC</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mobile')}
                className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'mobile'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone / Tablet</span>
              </button>
            </div>

            {activeTab === 'windows' ? (
              <div className="flex flex-col gap-3 text-xs text-slate-300">
                {/* Option 1: Direct Native Install if prompt available */}
                {isInstallable && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/40 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Monitor className="w-4 h-4 text-emerald-400" />
                        One-Click Windows App Install
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-semibold">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Installs Clockander directly to your Windows Start Menu, Desktop, and Taskbar.
                    </p>
                    <button
                      onClick={async () => {
                        await install();
                        setShowGuide(false);
                      }}
                      className="mt-1 w-full py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Install Windows App Now</span>
                    </button>
                  </div>
                )}

                {/* Option 2: Download Windows Desktop Widget Launcher (.bat) */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shrink-0">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">
                          1. Download Windows Widget Launcher (.bat)
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Opens Clockander in a frameless Windows widget window
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Save this file to your <strong>Windows Desktop</strong>. Double-clicking it opens Clockander in a clean, compact widget window without browser address bars or tabs.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                    <button
                      onClick={handleDownloadWindowsLauncher}
                      className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .BAT Widget</span>
                    </button>
                    <button
                      onClick={handleDownloadWindowsShortcut}
                      className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Download .URL Shortcut</span>
                    </button>
                  </div>
                </div>

                {/* Option 3: Edge / Chrome Native Windows Taskbar & Start Menu App */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-400 flex items-center justify-center shrink-0">
                      <Pin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">
                        2. Install via Microsoft Edge / Chrome on Windows
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Pins to Windows Taskbar, Start Menu & Auto-Start
                      </div>
                    </div>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300 pl-1">
                    <li>
                      Look at the right side of your address bar and click the <strong>App Available / Install</strong> icon <Download className="inline w-3 h-3 text-cyan-300" />.
                    </li>
                    <li>
                      Or in <strong>Microsoft Edge</strong>: click <strong>Menu (⋯) → Apps → Install this site as an app</strong>.
                    </li>
                    <li>
                      In <strong>Google Chrome</strong>: click <strong>Menu (⋮) → Cast, save, and share → Install page as app</strong>.
                    </li>
                    <li>
                      Check <strong>"Pin to taskbar"</strong> and <strong>"Auto-start on device login"</strong> so your clock & reminders widget is always on your Windows desktop.
                    </li>
                  </ol>
                </div>

                {/* Option 4: Windows Run Command (Win + R) */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300">
                      Quick Windows Run Command (<kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">Win + R</kbd>)
                    </span>
                    <button
                      onClick={handleCopyEdgeCommand}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd ? 'Copied!' : 'Copy Command'}</span>
                    </button>
                  </div>
                  <code className="text-[10px] font-mono text-emerald-300 bg-black/60 p-2 rounded-lg overflow-x-auto whitespace-nowrap border border-white/5">
                    msedge --app="{appUrl}" --window-size=440,760
                  </code>
                </div>
              </div>
            ) : (
              /* Mobile / iOS / Android Instructions */
              <div className="flex flex-col gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">iPhone / iPad (Safari)</span>
                    <p className="text-[11px] text-slate-400">
                      Tap the <strong>Share</strong> button at the bottom of Safari, then select <strong>"Add to Home Screen"</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">Android (Chrome / Edge)</span>
                    <p className="text-[11px] text-slate-400">
                      Tap the three dots menu (⋮) in the top-right and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all active:scale-98 shadow-md cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
