import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, Check, Laptop, Smartphone } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface PWAInstallButtonProps {
  compact?: boolean;
  className?: string;
  haptics?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  className = '',
  haptics = true,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already installed and running standalone, do not clutter the UI
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (haptics) soundManager.playClick();
    if (isInstallable) {
      const outcome = await install();
      if (outcome && haptics) {
        soundManager.playSuccess();
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Download / Install Clockander App on your device"
        className={`flex items-center gap-1.5 rounded-xl border font-semibold transition-all active:scale-95 cursor-pointer shadow-sm ${
          compact
            ? 'p-1.5 px-2 bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-400/30 text-emerald-300 text-xs'
            : 'px-3 py-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border-emerald-400/40 text-emerald-300 text-xs'
        } ${className}`}
      >
        <Download className="w-3.5 h-3.5 text-emerald-400" />
        <span>{compact ? 'Install' : 'Download Applet'}</span>
      </button>

      {/* Install Guidance Modal for iOS Safari / Manual Installation */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/15 p-5 text-slate-100 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950">
                  <Download className="w-4 h-4 font-bold" />
                </div>
                <div>
                  <h3 className="font-['Outfit'] font-bold text-sm text-white">
                    Download & Install Clockander
                  </h3>
                  <p className="text-[10px] text-slate-400">Add to your Home Screen or Desktop</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="flex flex-col gap-3 text-xs text-slate-300">
                <p className="font-medium text-white">To install on iPhone or iPad:</p>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">1. Tap Share</span>
                    <p className="text-[11px] text-slate-400">In Safari, tap the Share icon at the bottom of the screen.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">2. Add to Home Screen</span>
                    <p className="text-[11px] text-slate-400">Scroll down and select "Add to Home Screen".</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-xs text-slate-300">
                <p className="font-medium text-white">To install on your computer or Android device:</p>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">Desktop (Chrome / Edge / Brave)</span>
                    <p className="text-[11px] text-slate-400">Click the install icon <Download className="inline w-3 h-3 text-cyan-300" /> on the right side of the address bar.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">Android (Chrome / Samsung)</span>
                    <p className="text-[11px] text-slate-400">Tap the three dots menu (⋮) in the top-right and select "Install app" or "Add to Home screen".</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all active:scale-98 shadow-md"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
