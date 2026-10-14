import React, { useState, useEffect } from 'react';
import { googleSignIn, logoutGoogle, initAuth, getCurrentUser } from '../services/googleAuth';
import { RefreshCw, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface GoogleSyncBarProps {
  onSyncTriggered: () => Promise<void>;
  isSyncing: boolean;
  haptics: boolean;
}

export const GoogleSyncBar: React.FC<GoogleSyncBarProps> = ({
  onSyncTriggered,
  isSyncing,
  haptics,
}) => {
  const [user, setUser] = useState<any>(getCurrentUser());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser) => {
        setUser(authedUser);
        setErrorMsg(null);
      },
      () => {
        setUser(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    if (haptics) soundManager.playClick();
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        if (haptics) soundManager.playSuccess();
        await onSyncTriggered();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to sign in with Google');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (haptics) soundManager.playClick();
    try {
      await logoutGoogle();
      setUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualSync = async () => {
    if (haptics) soundManager.playClick();
    try {
      await onSyncTriggered();
      if (haptics) soundManager.playSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Sync failed');
    }
  };

  if (!user) {
    return (
      <div className="rounded-2xl p-3.5 bg-white/5 border border-white/10 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </div>
          <div>
            <div className="font-medium text-white">Google Integration</div>
            <div className="text-slate-400">Sync Google Calendar & Google Tasks live</div>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-black/20 cursor-pointer disabled:opacity-50"
        >
          {isLoggingIn ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          )}
          <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
        </button>

        {errorMsg && (
          <div className="w-full text-rose-400 flex items-center gap-1.5 text-[11px] mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-2.5 px-3.5 bg-blue-500/10 border border-blue-500/20 backdrop-blur-md flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Google User'}
            className="w-7 h-7 rounded-full border border-blue-400/40 object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-blue-500/30 text-blue-300 font-bold flex items-center justify-center text-[11px]">
            {user.displayName ? user.displayName[0].toUpperCase() : 'G'}
          </div>
        )}
        <div className="truncate">
          <div className="flex items-center gap-1.5 font-medium text-white truncate">
            <span className="truncate">{user.displayName || user.email}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </div>
          <div className="text-[11px] text-blue-300/80">Google Calendar & Tasks Connected</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          title="Sync Calendar & Tasks"
          className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={handleLogout}
          title="Sign out of Google"
          className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
