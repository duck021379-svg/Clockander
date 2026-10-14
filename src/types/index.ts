export type ClockStyle = 'orbit' | 'digital' | 'analog' | 'material' | 'text-glance';
export type GlassTint = 'obsidian' | 'frost' | 'moto-blue' | 'emerald' | 'amber' | 'amethyst';
export type EdgeLightingColor = 'cyan' | 'moto-blue' | 'purple' | 'emerald' | 'gold' | 'off';
export type WallpaperTheme = 'cyan-nebula' | 'obsidian' | 'aurora' | 'cyber-sunset' | 'frost-crystal' | 'custom';
export type LayoutPreset = 'simple' | 'unified' | 'calendar-focus' | 'keep-focus';
export type FontFamilyOption = 'sketch-serif' | 'outfit' | 'jakarta' | 'mono' | 'serif' | 'display';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  category: 'work' | 'personal' | 'meeting' | 'fitness' | 'reminder' | 'google';
  description?: string;
  isGoogleEvent?: boolean;
  googleEventId?: string;
  color?: string;
  isStarred?: boolean;
  keepNoteId?: string; // linked Google Keep note
}

export interface KeepTaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface KeepNote {
  id: string;
  title: string;
  content?: string;
  items: KeepTaskItem[];
  color: 'yellow' | 'coral' | 'teal' | 'lavender' | 'mint' | 'dark';
  tags: string[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  googleTaskId?: string;
  reminderDate?: string; // YYYY-MM-DD
  reminderTime?: string; // HH:MM
  syncWithCalendar?: boolean;
  calendarEventId?: string;
  vocalAlert?: boolean;
}

export interface WidgetSettings {
  clockStyle: ClockStyle;
  is24Hour: boolean;
  showSeconds: boolean;
  startOnMonday: boolean;
  glassOpacity: number; // 0.1 to 0.95
  glassBlur: number; // 4 to 32
  glassTint: GlassTint;
  edgeLighting: EdgeLightingColor;
  hapticsEnabled: boolean;
  viewMode: 'phone' | 'desktop' | 'fullscreen';
  isLocked: boolean; // desktop drag lock state
  weatherTemp: number;
  weatherCondition: string;
  batteryLevel: number;
  wallpaper: WallpaperTheme;
  customWallpaperUrl?: string;
  layoutPreset: LayoutPreset;
  textOpacity: number; // 0.2 to 1.0 (translucent text)
  textColor: string; // hex color for text
  fontFamily: FontFamilyOption;
  textScale: number; // 0.75 to 1.5
  transparentBgOnly: boolean; // true = background transparent, only text shows
  widgetPosition: { x: number; y: number }; // BeWidgets draggable positioning
  showHomeDock: boolean; // Motorola home screen dock
  showDate: boolean; // BeWidgets show date toggle
  showDueEntries: boolean; // Show due entries list below clock
}
