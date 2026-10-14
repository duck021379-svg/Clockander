import { CalendarEvent } from '../types';
import { getAccessToken } from './googleAuth';

export async function fetchGoogleCalendarEvents(): Promise<CalendarEvent[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google');
  }

  // Fetch from 1 month ago to 3 months into the future
  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 28).toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=100`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Google Calendar API error (${res.status})`);
  }

  const data = await res.json();
  const items = data.items || [];

  return items.map((item: any): CalendarEvent => {
    let dateStr = '';
    let startTime = '09:00';
    let endTime = '10:00';

    if (item.start?.dateTime) {
      const startD = new Date(item.start.dateTime);
      dateStr = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-${String(startD.getDate()).padStart(2, '0')}`;
      startTime = `${String(startD.getHours()).padStart(2, '0')}:${String(startD.getMinutes()).padStart(2, '0')}`;
    } else if (item.start?.date) {
      dateStr = item.start.date;
      startTime = 'All Day';
      endTime = 'All Day';
    }

    if (item.end?.dateTime) {
      const endD = new Date(item.end.dateTime);
      endTime = `${String(endD.getHours()).padStart(2, '0')}:${String(endD.getMinutes()).padStart(2, '0')}`;
    }

    return {
      id: `gcal-${item.id}`,
      googleEventId: item.id,
      title: item.summary || 'Google Calendar Event',
      date: dateStr,
      startTime,
      endTime,
      category: 'google',
      description: item.description || '',
      isGoogleEvent: true,
      color: '#4285F4',
    };
  });
}

export async function createGoogleCalendarEvent(payload: {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
}): Promise<CalendarEvent> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const startIso = `${payload.date}T${payload.startTime.length === 5 ? payload.startTime : '09:00'}:00`;
  const endIso = `${payload.date}T${payload.endTime.length === 5 ? payload.endTime : '10:00'}:00`;

  const body = {
    summary: payload.title,
    description: payload.description || 'Created via Clockander Widget',
    start: {
      dateTime: new Date(startIso).toISOString(),
    },
    end: {
      dateTime: new Date(endIso).toISOString(),
    },
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to create Google Calendar event');
  }

  const created = await res.json();
  return {
    id: `gcal-${created.id}`,
    googleEventId: created.id,
    title: created.summary || payload.title,
    date: payload.date,
    startTime: payload.startTime,
    endTime: payload.endTime,
    category: 'google',
    description: payload.description,
    isGoogleEvent: true,
    color: '#4285F4',
  };
}

export async function deleteGoogleCalendarEvent(googleEventId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 404) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to delete event from Google Calendar');
  }
}
