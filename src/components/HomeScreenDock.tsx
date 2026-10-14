import React from 'react';
import {
  Phone,
  MessageSquare,
  Globe,
  Camera,
  Search,
  Mic,
} from 'lucide-react';
import { openGoogleKeepWeb } from '../services/googleTasks';
import { soundManager } from '../utils/audio';

interface HomeScreenDockProps {
  onOpenKeep?: () => void;
  haptics?: boolean;
}

export const HomeScreenDock: React.FC<HomeScreenDockProps> = ({
  onOpenKeep,
  haptics = true,
}) => {
  const handleAppClick = (appName: string, action?: () => void) => {
    if (haptics) soundManager.playClick();
    if (action) {
      action();
    }
  };

  return (
    <div className="w-full flex flex-col gap-2.5 pt-2 select-none">
      {/* Motorola / Google Quick Search Pill */}
      <div className="mx-1 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 backdrop-blur-md flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2 text-slate-300 text-xs">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span className="text-slate-400">Search apps & web...</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Mic className="w-3.5 h-3.5 hover:text-cyan-400 cursor-pointer" />
          <Search className="w-3.5 h-3.5 hover:text-cyan-400 cursor-pointer" />
        </div>
      </div>

      {/* Android Favorite Apps Dock */}
      <div className="grid grid-cols-5 gap-2 px-1">
        {/* Phone */}
        <button
          onClick={() => handleAppClick('Phone')}
          className="flex flex-col items-center gap-1 group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-active:scale-90 transition-transform">
            <Phone className="w-5 h-5 fill-white" />
          </div>
          <span className="text-[10px] text-slate-300 font-medium truncate">Phone</span>
        </button>

        {/* Messages */}
        <button
          onClick={() => handleAppClick('Messages')}
          className="flex flex-col items-center gap-1 group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 group-active:scale-90 transition-transform">
            <MessageSquare className="w-5 h-5 fill-white" />
          </div>
          <span className="text-[10px] text-slate-300 font-medium truncate">Messages</span>
        </button>

        {/* Google Keep Tasks */}
        <button
          onClick={() => {
            if (onOpenKeep) onOpenKeep();
            else openGoogleKeepWeb();
          }}
          className="flex flex-col items-center gap-1 group cursor-pointer"
          title="Open Google Keep Tasks"
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-amber-400/20 group-active:scale-90 transition-transform">
            K
          </div>
          <span className="text-[10px] text-slate-300 font-medium truncate">Keep</span>
        </button>

        {/* Chrome Browser */}
        <button
          onClick={() => handleAppClick('Chrome')}
          className="flex flex-col items-center gap-1 group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-blue-500 text-white flex items-center justify-center shadow-lg group-active:scale-90 transition-transform">
            <Globe className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-slate-300 font-medium truncate">Chrome</span>
        </button>

        {/* Camera */}
        <button
          onClick={() => handleAppClick('Camera')}
          className="flex flex-col items-center gap-1 group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center shadow-lg group-active:scale-90 transition-transform border border-white/10">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-slate-300 font-medium truncate">Camera</span>
        </button>
      </div>
    </div>
  );
};
