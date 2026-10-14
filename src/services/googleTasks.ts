import { KeepNote } from '../types';
import { getAccessToken } from './googleAuth';

export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  updated?: string;
}

export async function fetchGoogleTasks(): Promise<GoogleTaskItem[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists/@default/tasks?showCompleted=true&maxResults=50', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Google Tasks API error (${res.status})`);
  }

  const data = await res.json();
  return (data.items || []).map((t: any) => ({
    id: t.id,
    title: t.title || 'Untitled Task',
    notes: t.notes || '',
    status: t.status,
    due: t.due,
    updated: t.updated,
  }));
}

export async function createGoogleTask(title: string, notes?: string): Promise<GoogleTaskItem> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists/@default/tasks', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      notes,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Task');
  }

  const data = await res.json();
  return {
    id: data.id,
    title: data.title,
    notes: data.notes,
    status: data.status,
  };
}

export async function toggleGoogleTaskStatus(taskId: string, currentStatus: 'needsAction' | 'completed'): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const newStatus = currentStatus === 'completed' ? 'needsAction' : 'completed';

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/users/@me/lists/@default/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: newStatus,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to update Google Task');
  }
}

export function openGoogleKeepWeb(query?: string) {
  const url = query ? `https://keep.google.com/#search/text=${encodeURIComponent(query)}` : 'https://keep.google.com';
  window.open(url, '_blank', 'noopener,noreferrer');
}
