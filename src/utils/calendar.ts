export interface CalendarCell {
  date: Date;
  dateKey: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function generateCalendarGrid(
  year: number,
  monthIndex: number,
  selectedDateKey: string,
  startOnMonday = false
): CalendarCell[] {
  const grid: CalendarCell[] = [];
  const firstDay = new Date(year, monthIndex, 1);
  const totalDaysCurrent = new Date(year, monthIndex + 1, 0).getDate();
  const totalDaysPrev = new Date(year, monthIndex, 0).getDate();

  const baseOffset = startOnMonday ? 1 : 0;
  const startDayOfWeek = firstDay.getDay(); // 0 is Sunday
  const leadingPadding = (startDayOfWeek - baseOffset + 7) % 7;

  const today = new Date();
  const todayKey = formatDateKey(today);

  // 1. Previous month trailing days
  for (let i = leadingPadding - 1; i >= 0; i--) {
    const day = totalDaysPrev - i;
    const d = new Date(year, monthIndex - 1, day);
    const dateKey = formatDateKey(d);
    grid.push({
      date: d,
      dateKey,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: dateKey === todayKey,
      isSelected: dateKey === selectedDateKey,
    });
  }

  // 2. Current month days
  for (let day = 1; day <= totalDaysCurrent; day++) {
    const d = new Date(year, monthIndex, day);
    const dateKey = formatDateKey(d);
    grid.push({
      date: d,
      dateKey,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateKey === todayKey,
      isSelected: dateKey === selectedDateKey,
    });
  }

  // 3. Next month leading days (fill remainder up to 42 cells)
  const trailingPadding = 42 - grid.length;
  for (let day = 1; day <= trailingPadding; day++) {
    const d = new Date(year, monthIndex + 1, day);
    const dateKey = formatDateKey(d);
    grid.push({
      date: d,
      dateKey,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: dateKey === todayKey,
      isSelected: dateKey === selectedDateKey,
    });
  }

  return grid;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const WEEKDAY_NAMES_SUN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_NAMES_MON = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
