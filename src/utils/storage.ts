import { CalendarEvent, KeepNote, WidgetSettings } from '../types';
import { formatDateKey } from './calendar';

const today = new Date();
const todayKey = formatDateKey(today);
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const tomorrowKey = formatDateKey(tomorrow);

const DEFAULT_SETTINGS: WidgetSettings = {
  clockStyle: 'text-glance',
  is24Hour: false,
  showSeconds: false,
  startOnMonday: true,
  glassOpacity: 0.35,
  glassBlur: 12,
  glassTint: 'obsidian',
  edgeLighting: 'cyan',
  hapticsEnabled: true,
  viewMode: 'phone',
  isLocked: false,
  weatherTemp: 72,
  weatherCondition: 'Partly Cloudy',
  batteryLevel: 88,
  wallpaper: 'cyan-nebula',
  layoutPreset: 'simple',
  textOpacity: 0.95,
  textColor: '#b6ff00',
  fontFamily: 'sketch-serif',
  textScale: 1.0,
  transparentBgOnly: true,
  widgetPosition: { x: 0, y: 0 },
  showHomeDock: false,
  showDate: true,
  showDueEntries: false,
};

const DEFAULT_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-pdv',
    title: 'Pdv101',
    date: todayKey,
    startTime: '21:00',
    endTime: '22:00',
    category: 'work',
    description: 'Pdv101 - 9:00pm class session',
    color: '#b6ff00',
    isStarred: true,
  },
  {
    id: 'evt-psy',
    title: 'Psy',
    date: todayKey,
    startTime: '23:59',
    endTime: '23:59',
    category: 'reminder',
    description: 'Psychology assignment deadline at 11:59pm',
    color: '#b6ff00',
    isStarred: false,
  },
  {
    id: 'evt-1',
    title: 'Motorola Edge+ 144Hz Calibration',
    date: todayKey,
    startTime: '10:00',
    endTime: '11:00',
    category: 'work',
    description: 'Verify HDR10+ OLED color profiles and 144Hz refresh rate responsiveness.',
    color: '#06b6d4',
  },
  {
    id: 'evt-2',
    title: 'Product Sprint & Calendar Sync Review',
    date: todayKey,
    startTime: '14:30',
    endTime: '15:30',
    category: 'meeting',
    description: 'Sync roadmap milestones and Google Calendar team agenda.',
    color: '#8b5cf6',
  },
  {
    id: 'evt-3',
    title: 'Evening Run & Recovery Session',
    date: todayKey,
    startTime: '18:15',
    endTime: '19:00',
    category: 'fitness',
    description: '5km outdoor run tracking with Motorola Moto Watch / Health.',
    color: '#10b981',
  },
  {
    id: 'evt-4',
    title: 'Weekly Team Planning',
    date: tomorrowKey,
    startTime: '11:00',
    endTime: '12:00',
    category: 'work',
    description: 'Sprint planning and review of upcoming deliverables.',
    color: '#3b82f6',
  },
];

const DEFAULT_KEEP_NOTES: KeepNote[] = [
  {
    id: 'note-1',
    title: 'Moto Edge+ 22 Setup Checklist',
    content: 'Essential Android 12/13/14 configurations for peak performance',
    items: [
      { id: 'item-1', text: 'Enable 144Hz High Refresh Rate in Display Settings', completed: true },
      { id: 'item-2', text: 'Configure Motorola Edge Lighting for incoming alerts', completed: true },
      { id: 'item-3', text: 'Set Clockander glassmorphic widget to primary home screen', completed: false },
      { id: 'item-4', text: 'Sync Google Keep quick notes with Google Tasks', completed: false },
    ],
    color: 'teal',
    tags: ['moto', 'edgeplus', 'setup'],
    pinned: true,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 1800000,
  },
  {
    id: 'note-2',
    title: 'Weekly Groceries & Supplies',
    content: 'Pick up before Friday dinner',
    items: [
      { id: 'item-5', text: 'Organic oat milk & cold brew', completed: false },
      { id: 'item-6', text: 'Greek yogurt & honey', completed: true },
      { id: 'item-7', text: 'Avocados & sourdough bread', completed: false },
      { id: 'item-8', text: 'Dark chocolate 85%', completed: false },
    ],
    color: 'yellow',
    tags: ['groceries', 'home'],
    pinned: true,
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'note-3',
    title: 'Creative Project Ideas',
    content: 'Explore futuristic glassmorphic UI concepts with dynamic Android Material You accents.',
    items: [],
    color: 'lavender',
    tags: ['ideas', 'design'],
    pinned: false,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
];

export function loadSettings(): WidgetSettings {
  try {
    const raw = localStorage.getItem('clockander_settings');
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: WidgetSettings) {
  try {
    localStorage.setItem('clockander_settings', JSON.stringify(settings));
    localStorage.setItem('widget_locked', settings.isLocked ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export function loadEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem('clockander_events');
    if (!raw) return DEFAULT_EVENTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_EVENTS;
  } catch {
    return DEFAULT_EVENTS;
  }
}

export function saveEvents(events: CalendarEvent[]) {
  try {
    localStorage.setItem('clockander_events', JSON.stringify(events));
  } catch {
    // ignore
  }
}

export function loadKeepNotes(): KeepNote[] {
  try {
    const raw = localStorage.getItem('clockander_keep_notes');
    if (!raw) return DEFAULT_KEEP_NOTES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_KEEP_NOTES;
  } catch {
    return DEFAULT_KEEP_NOTES;
  }
}

export function saveKeepNotes(notes: KeepNote[]) {
  try {
    localStorage.setItem('clockander_keep_notes', JSON.stringify(notes));
  } catch {
    // ignore
  }
}

export function exportBackupData(): string {
  const data = {
    settings: loadSettings(),
    events: loadEvents(),
    keepNotes: loadKeepNotes(),
    exportDate: new Date().toISOString(),
    version: '1.0',
  };
  return JSON.stringify(data, null, 2);
}

export function importBackupData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.settings) saveSettings(data.settings);
    if (Array.isArray(data.events)) saveEvents(data.events);
    if (Array.isArray(data.keepNotes)) saveKeepNotes(data.keepNotes);
    return true;
  } catch {
    return false;
  }
}
