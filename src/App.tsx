/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CalendarEvent, KeepNote, WidgetSettings } from './types';
import {
  loadSettings,
  saveSettings,
  loadEvents,
  saveEvents,
  loadKeepNotes,
  saveKeepNotes,
} from './utils/storage';
import { formatDateKey } from './utils/calendar';
import { PhoneFrame } from './components/PhoneFrame';
import { ClockWidget } from './components/ClockWidget';
import { CalendarGrid } from './components/CalendarGrid';
import { AgendaList } from './components/AgendaList';
import { KeepQuickManager } from './components/KeepQuickManager';
import { CustomizeDrawer } from './components/CustomizeDrawer';
import { GeminiAssistantModal } from './components/GeminiAssistantModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { GoogleSyncBar } from './components/GoogleSyncBar';
import { DesignReferenceModal } from './components/DesignReferenceModal';
import { SetReminderModal } from './components/SetReminderModal';
import { QuickCalendarShade } from './components/QuickCalendarShade';
import { SimpleWidget } from './components/SimpleWidget';
import { WeatherWidget } from './components/WeatherWidget';
import { VoiceAssistantBar } from './components/VoiceAssistantBar';
import { RemindersCard } from './components/RemindersCard';
import { PWAInstallButton } from './components/PWAInstallButton';
import {
  fetchGoogleCalendarEvents,
  deleteGoogleCalendarEvent,
  createGoogleCalendarEvent,
} from './services/googleCalendar';
import {
  createGoogleTask,
  openGoogleKeepWeb,
} from './services/googleTasks';
import { getCurrentUser, googleSignIn } from './services/googleAuth';
import {
  Calendar as CalendarIcon,
  CheckSquare,
  Sliders,
  Sparkles,
  Lock,
  Unlock,
  ExternalLink,
  Plus,
  Image as ImageIcon,
  Mic,
  Bell,
} from 'lucide-react';
import { soundManager } from './utils/audio';

export default function App() {
  const [settings, setSettings] = useState<WidgetSettings>(() => loadSettings());
  const [events, setEvents] = useState<CalendarEvent[]>(() => loadEvents());
  const [keepNotes, setKeepNotes] = useState<KeepNote[]>(() => loadKeepNotes());
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateKey(new Date()));

  // Navigation tab: 'calendar' | 'keep'
  const [activeTab, setActiveTab] = useState<'calendar' | 'keep'>('calendar');

  // Modals & Drawers
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isGeminiOpen, setIsGeminiOpen] = useState(false);
  const [isDesignRefOpen, setIsDesignRefOpen] = useState(false);
  const [isSetReminderOpen, setIsSetReminderOpen] = useState(false);
  const [isShadeOpen, setIsShadeOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Shortcut for Windows 11 Win + N equivalent on phone (notification & calendar panel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle on Win + N / Meta + N / Alt + N
      if ((e.key === 'n' || e.key === 'N') && (e.metaKey || e.altKey || e.ctrlKey)) {
        e.preventDefault();
        setIsShadeOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Design Visual Reference & Live Overlay
  const [referenceImage, setReferenceImage] = useState<string | null>(() => {
    try {
      return localStorage.getItem('clockander_reference_image');
    } catch {
      return null;
    }
  });
  const [isOverlayActive, setIsOverlayActive] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.45);

  const handleSetReferenceImage = (img: string | null) => {
    setReferenceImage(img);
    try {
      if (img) {
        localStorage.setItem('clockander_reference_image', img);
      } else {
        localStorage.removeItem('clockander_reference_image');
      }
    } catch {
      // ignore
    }
  };

  // Confirmation Modal State (required for destructive operations per workspace skill)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void | Promise<void>;
    isDestructive: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
    isDestructive: true,
  });

  // Persist state updates to local storage
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveEvents(events);
  }, [events]);

  useEffect(() => {
    saveKeepNotes(keepNotes);
  }, [keepNotes]);

  // Request browser Notification permission for reminder toasts if supported
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Google Calendar & Tasks Sync
  const handleSyncGoogle = useCallback(async () => {
    const user = getCurrentUser();
    if (!user) return;
    setIsSyncing(true);
    try {
      const gcalEvents = await fetchGoogleCalendarEvents();
      // Merge with local non-google events
      setEvents((prev) => {
        const localEvents = prev.filter((e) => !e.isGoogleEvent);
        return [...localEvents, ...gcalEvents];
      });
    } catch (err) {
      console.error('Failed to sync Google Calendar:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn();
      handleSyncGoogle();
    } catch (err) {
      console.error('Failed to sign in with Google Workspace:', err);
    }
  };

  // Event Handlers
  const handleAddEvent = async (newEventData: Omit<CalendarEvent, 'id'>) => {
    const user = getCurrentUser();
    let createdEvent: CalendarEvent;

    if (user && newEventData.category === 'google') {
      // Sync directly to Google Calendar with API
      try {
        createdEvent = await createGoogleCalendarEvent({
          title: newEventData.title,
          date: newEventData.date,
          startTime: newEventData.startTime,
          endTime: newEventData.endTime,
          description: newEventData.description,
        });
      } catch {
        // Fallback to local
        createdEvent = {
          ...newEventData,
          id: `evt-${Date.now()}`,
        };
      }
    } else {
      createdEvent = {
        ...newEventData,
        id: `evt-${Date.now()}`,
      };
    }

    setEvents((prev) => [...prev, createdEvent]);
  };

  const handleDeleteEvent = (eventId: string, isGoogleEvent?: boolean, googleEventId?: string) => {
    const targetEvent = events.find((e) => e.id === eventId);
    const eventName = targetEvent ? `"${targetEvent.title}"` : 'this event';

    setConfirmDialog({
      isOpen: true,
      title: isGoogleEvent ? 'Delete Google Calendar Event' : 'Delete Local Event',
      message: isGoogleEvent
        ? `Are you sure you want to delete ${eventName} from Google Calendar? This action will permanently remove the event from your Google account.`
        : `Are you sure you want to remove ${eventName} from your Clockander schedule?`,
      isDestructive: true,
      action: async () => {
        if (isGoogleEvent && googleEventId) {
          try {
            await deleteGoogleCalendarEvent(googleEventId);
          } catch (err) {
            console.error('Failed to delete Google event:', err);
          }
        }
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Keep Notes Handlers
  const handleAddKeepNote = (newNoteData: Omit<KeepNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created: KeepNote = {
      ...newNoteData,
      id: `note-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setKeepNotes((prev) => [created, ...prev]);
  };

  const handleUpdateKeepNote = (updatedNote: KeepNote) => {
    setKeepNotes((prev) =>
      prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
    );
  };

  const handleDeleteKeepNote = (noteId: string) => {
    const target = keepNotes.find((n) => n.id === noteId);
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Keep Note',
      message: `Delete "${target?.title || 'this note'}"? This task list will be removed from Clockander.`,
      isDestructive: true,
      action: () => {
        setKeepNotes((prev) => prev.filter((n) => n.id !== noteId));
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Convert Keep Note to Calendar Event
  const handleConvertNoteToEvent = (note: KeepNote) => {
    handleAddEvent({
      title: note.title,
      date: selectedDate,
      startTime: '10:00',
      endTime: '11:00',
      category: 'personal',
      description: note.content || note.items.map((i) => i.text).join(', '),
    });
    setActiveTab('calendar');
  };

  // Export Keep note to Google Tasks
  const handleSyncGoogleTask = async (note: KeepNote) => {
    try {
      const summaryText = note.items.length > 0
        ? note.items.map((it) => `${it.completed ? '[x]' : '[ ]'} ${it.text}`).join('\n')
        : note.content || '';
      await createGoogleTask(note.title, summaryText);
      if (settings.hapticsEnabled) soundManager.playSuccess();
    } catch (err: any) {
      console.error(err);
    }
  };

  // Toggle Clock Style quickly on click
  const handleClockStyleToggle = () => {
    if (settings.hapticsEnabled) soundManager.playClick();
    const styles: WidgetSettings['clockStyle'][] = ['orbit', 'digital', 'analog', 'material'];
    const nextIdx = (styles.indexOf(settings.clockStyle) + 1) % styles.length;
    setSettings((s) => ({ ...s, clockStyle: styles[nextIdx] }));
  };

  // Toggle Drag Lock (BeWidgets style)
  const handleToggleLock = () => {
    if (settings.hapticsEnabled) soundManager.playClick();
    setSettings((s) => ({ ...s, isLocked: !s.isLocked }));
  };

  // Glassmorphic Theme background color based on tint
  const getGlassTintBackground = () => {
    const opacity = settings.glassOpacity;
    switch (settings.glassTint) {
      case 'obsidian':
        return `rgba(15, 23, 42, ${opacity})`;
      case 'frost':
        return `rgba(241, 245, 249, ${opacity * 0.25})`;
      case 'moto-blue':
        return `rgba(15, 23, 42, ${opacity * 0.85}), rgba(2, 132, 199, ${opacity * 0.25})`;
      case 'emerald':
        return `rgba(6, 78, 59, ${opacity * 0.35}), rgba(15, 23, 42, ${opacity * 0.85})`;
      case 'amber':
        return `rgba(120, 53, 15, ${opacity * 0.35}), rgba(15, 23, 42, ${opacity * 0.85})`;
      case 'amethyst':
        return `rgba(88, 28, 135, ${opacity * 0.35}), rgba(15, 23, 42, ${opacity * 0.85})`;
      default:
        return `rgba(15, 23, 42, ${opacity})`;
    }
  };

  const glassStyle: React.CSSProperties = settings.transparentBgOnly
    ? {
        background: 'rgba(0, 0, 0, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'none',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      }
    : {
        backdropFilter: `blur(${settings.glassBlur}px)`,
        WebkitBackdropFilter: `blur(${settings.glassBlur}px)`,
        background: settings.glassTint === 'moto-blue' || settings.glassTint === 'emerald' || settings.glassTint === 'amber' || settings.glassTint === 'amethyst'
          ? `linear-gradient(145deg, ${getGlassTintBackground()})`
          : getGlassTintBackground(),
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
      };

  return (
    <PhoneFrame
      settings={settings}
      onOpenCustomizer={() => setIsCustomizerOpen(true)}
      onOpenGemini={() => setIsGeminiOpen(true)}
      onOpenShade={() => setIsShadeOpen(true)}
      onOpenKeep={() => setActiveTab('keep')}
      referenceImage={referenceImage}
      isOverlayActive={isOverlayActive}
      overlayOpacity={overlayOpacity}
    >
      {/* Quick Slide-Down Win+N Calendar & Notification Shade */}
      <QuickCalendarShade
        isOpen={isShadeOpen}
        onClose={() => setIsShadeOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        events={events}
        settings={settings}
      />

      {/* Main Glassmorphic Clockander Widget Card */}
      <div
        style={glassStyle}
        className={`relative w-full max-w-full overflow-hidden rounded-[32px] sm:rounded-[36px] transition-all text-slate-100 box-border ${
          settings.transparentBgOnly ? '' : 'border border-white/20'
        } ${settings.isLocked ? 'locked select-text' : 'select-none'}`}
      >
        {settings.layoutPreset === 'simple' ? (
          /* Simple Widget: ONLY displays CLOCK, Month/date, 3 Entry due, Settings/L on left, Reminder entry on right */
          <SimpleWidget
            settings={settings}
            events={events}
            selectedDate={selectedDate}
            onOpenSettings={() => setIsCustomizerOpen(true)}
            onToggleLock={handleToggleLock}
            onOpenReminderEntry={() => setIsSetReminderOpen(true)}
            onOpenGemini={() => setIsGeminiOpen(true)}
            onEventClick={() => setIsShadeOpen(true)}
            onQuickAddReminder={(title, time, isStarred) => {
              handleAddEvent({
                title,
                startTime: time,
                endTime: time,
                date: selectedDate,
                category: 'reminder',
                isStarred,
              });
            }}
          />
        ) : (
          <div className="p-3 sm:p-4.5 flex flex-col gap-3.5">
            {/* Widget Top Header Bar */}
        <div className="flex items-center justify-between px-1">
          {/* Brand & Moto Glance title */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-sm">
              <span className="font-['Outfit'] font-black text-slate-950 text-xs">C</span>
            </div>
            <div>
              <h1 className="font-['Outfit'] font-extrabold text-sm sm:text-base text-white tracking-tight">
                Clockander
              </h1>
            </div>
          </div>

          {/* Header Action Buttons & Weather Component */}
          <div className="flex items-center gap-1.5">
            {/* Top Right Header Weather Component */}
            <WeatherWidget settings={settings} compact className="mr-1" />

            {/* Download / Install Applet Button */}
            <PWAInstallButton compact haptics={settings.hapticsEnabled} />

            {/* Quick Calendar Shade (Win + N Shortcut) */}
            <button
              onClick={() => {
                if (settings.hapticsEnabled) soundManager.playClick();
                setIsShadeOpen(true);
              }}
              title="Quick Slide-Down Calendar Panel (Shortcut: Win + N or tap top status bar)"
              className="p-1.5 px-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 flex items-center gap-1 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline font-mono">Win+N</span>
            </button>

            {/* Design Visual Reference & Shares Button */}
            <button
              onClick={() => {
                if (settings.hapticsEnabled) soundManager.playClick();
                setIsDesignRefOpen(true);
              }}
              title="Design Visuals & Gemini Shares"
              className="p-1.5 px-2 rounded-xl bg-white/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 flex items-center gap-1 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Visuals</span>
            </button>

            {/* Lock / Unlock Toggle Button */}
            <button
              onClick={handleToggleLock}
              title={settings.isLocked ? 'Widget Locked (Click to Unlock)' : 'Widget Movable (Click to Lock)'}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                settings.isLocked
                  ? 'bg-rose-500/20 border-rose-400/30 text-rose-300'
                  : 'bg-white/10 border-white/15 text-slate-300 hover:text-white'
              }`}
            >
              {settings.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>

            {/* Voice Talk / Gemini Assistant Button */}
            <button
              onClick={() => {
                if (settings.hapticsEnabled) soundManager.playClick();
                setIsGeminiOpen(true);
              }}
              title="Voice & Gemini AI Assistant (Set reminders, check day, check weather)"
              className="p-1.5 px-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-400/40 text-cyan-300 flex items-center gap-1 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline">Talk AI</span>
            </button>

            {/* Customizer Settings Button */}
            <button
              onClick={() => {
                if (settings.hapticsEnabled) soundManager.playClick();
                setIsCustomizerOpen(true);
              }}
              title="Widget Customization & Options"
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Google Workspace Authentication & Live Sync Bar */}
        <GoogleSyncBar
          onSyncTriggered={handleSyncGoogle}
          isSyncing={isSyncing}
          haptics={settings.hapticsEnabled}
        />

        {/* 1. Multi-Style Clock, Day & Date Widget */}
        <div className={`transition-all ${settings.transparentBgOnly ? '' : 'rounded-3xl bg-white/5 border border-white/10 shadow-inner'}`}>
          <ClockWidget
            settings={settings}
            events={events.filter((e) => e.date === selectedDate || e.isStarred)}
            onStyleToggle={handleClockStyleToggle}
            onOpenSettings={() => setIsCustomizerOpen(true)}
            onSetReminder={() => setIsSetReminderOpen(true)}
          />
        </div>

        {/* 2. Voice Assistant: Talk to set reminders, check what day it is, ask weather */}
        <VoiceAssistantBar
          onAddReminder={(r) => {
            handleAddEvent({
              title: r.title,
              startTime: r.startTime,
              endTime: r.startTime,
              date: r.date,
              category: 'reminder',
              isStarred: r.isStarred,
            });
          }}
          onAddKeepNote={(k) => {
            handleAddKeepNote({
              title: k.title,
              content: k.content || '',
              color: 'yellow',
              items: [],
              tags: ['voice', 'keep'],
              pinned: false,
            });
          }}
          onOpenKeep={() => setActiveTab('keep')}
          selectedDate={selectedDate}
          weatherTemp={settings.weatherTemp}
          weatherCondition={settings.weatherCondition}
          haptics={settings.hapticsEnabled}
        />

        {/* 3. Dedicated Reminders Manager Card */}
        <RemindersCard
          reminders={events.filter((e) => e.category === 'reminder' || e.date === selectedDate || e.isStarred)}
          selectedDate={selectedDate}
          onAddReminder={(r) => {
            handleAddEvent({
              title: r.title,
              startTime: r.startTime,
              endTime: r.startTime,
              date: r.date,
              category: 'reminder',
              isStarred: r.isStarred,
            });
          }}
          onDeleteReminder={handleDeleteEvent}
          onToggleStar={(id) => {
            setEvents((prev) =>
              prev.map((e) => (e.id === id ? { ...e, isStarred: !e.isStarred } : e))
            );
          }}
          haptics={settings.hapticsEnabled}
        />

        {/* Tab Switcher: Calendar Schedule vs Google Keep Tasks */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-black/30 border border-white/10 text-xs font-semibold">
          <button
            onClick={() => {
              if (settings.hapticsEnabled) soundManager.playClick();
              setActiveTab('calendar');
            }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Calendar Schedule</span>
          </button>

          <button
            onClick={() => {
              if (settings.hapticsEnabled) soundManager.playClick();
              setActiveTab('keep');
            }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'keep'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Google Keep Tasks</span>
          </button>
        </div>

        {/* Tab 1: Calendar Grid + Agenda Schedule Feed */}
        {activeTab === 'calendar' && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-150">
            {/* 42-Cell Monthly Matrix Grid */}
            <div className="rounded-3xl bg-white/5 border border-white/10">
              <CalendarGrid
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                events={events}
                settings={settings}
              />
            </div>

            {/* Agenda List for Selected Date */}
            <div className="rounded-3xl bg-white/5 border border-white/10 p-3 sm:p-4">
              <AgendaList
                selectedDate={selectedDate}
                events={events}
                onAddEvent={handleAddEvent}
                onDeleteEvent={handleDeleteEvent}
                haptics={settings.hapticsEnabled}
                onOpenGemini={() => setIsGeminiOpen(true)}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Google Keep Tasks & Quick Notes */}
        {activeTab === 'keep' && (
          <div className="rounded-3xl bg-white/5 border border-white/10 p-3 sm:p-4 animate-in fade-in duration-150">
            <KeepQuickManager
              notes={keepNotes}
              onAddNote={handleAddKeepNote}
              onUpdateNote={handleUpdateKeepNote}
              onDeleteNote={handleDeleteKeepNote}
              onConvertToEvent={handleConvertNoteToEvent}
              onSyncGoogleTask={handleSyncGoogleTask}
              isGoogleConnected={!!getCurrentUser()}
              haptics={settings.hapticsEnabled}
            />
          </div>
        )}

        {/* Quick Footer Action Row */}
        <div className="pt-1 flex items-center justify-end text-[11px] text-slate-400 px-1">
          <button
            onClick={() => {
              if (settings.hapticsEnabled) soundManager.playClick();
              openGoogleKeepWeb();
            }}
            className="flex items-center gap-1 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <span>keep.google.com</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
          </div>
        )}
      </div>

      {/* Set Quick Reminder Modal */}
      <SetReminderModal
        isOpen={isSetReminderOpen}
        onClose={() => setIsSetReminderOpen(false)}
        selectedDate={selectedDate}
        onSaveReminder={handleAddEvent}
        haptics={settings.hapticsEnabled}
      />

      {/* Design Reference & Visual Comparison Modal */}
      <DesignReferenceModal
        isOpen={isDesignRefOpen}
        onClose={() => setIsDesignRefOpen(false)}
        referenceImage={referenceImage}
        onSetReferenceImage={handleSetReferenceImage}
        overlayOpacity={overlayOpacity}
        onSetOverlayOpacity={setOverlayOpacity}
        isOverlayActive={isOverlayActive}
        onToggleOverlay={() => setIsOverlayActive((prev) => !prev)}
        haptics={settings.hapticsEnabled}
      />

      {/* Gemini AI Scheduling & Keep Assistant Modal */}
      <GeminiAssistantModal
        isOpen={isGeminiOpen}
        onClose={() => setIsGeminiOpen(false)}
        onApplyEvent={handleAddEvent}
        onApplyKeepNote={handleAddKeepNote}
        selectedDate={selectedDate}
        currentEvents={events}
        currentNotes={keepNotes}
        isGoogleConnected={!!getCurrentUser()}
        onConnectGoogle={handleGoogleSignIn}
        haptics={settings.hapticsEnabled}
      />

      {/* Widget Settings & Glassmorphism Customizer Drawer */}
      <CustomizeDrawer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onOpenReminderModal={() => setIsSetReminderOpen(true)}
        onOpenCalendarShade={() => setIsShadeOpen(true)}
        onOpenGemini={() => setIsGeminiOpen(true)}
        onDataReload={() => {
          setSettings(loadSettings());
          setEvents(loadEvents());
          setKeepNotes(loadKeepNotes());
        }}
      />

      {/* Required Confirmation Modal for Destructive Data Changes */}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDestructive={confirmDialog.isDestructive}
        confirmLabel="Confirm Delete"
        cancelLabel="Keep"
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        haptics={settings.hapticsEnabled}
      />
    </PhoneFrame>
  );
}
