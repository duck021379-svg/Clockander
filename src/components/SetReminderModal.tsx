import React, { useState } from 'react';
import { CalendarEvent } from '../types';
import { BellPlus, Star, Clock, X, Volume2, Mic } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { speechManager } from '../utils/speech';

interface SetReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSaveReminder: (event: Omit<CalendarEvent, 'id'>) => void;
  haptics?: boolean;
}

export const SetReminderModal: React.FC<SetReminderModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSaveReminder,
  haptics = true,
}) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('21:00');
  const [isStarred, setIsStarred] = useState(false);
  const [vocalAlert, setVocalAlert] = useState(true);
  const [category, setCategory] = useState<CalendarEvent['category']>('reminder');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (haptics) soundManager.playSuccess();

    if (vocalAlert) {
      speechManager.speak(`Vocal reminder scheduled: ${title.trim()} at ${time}.`);
    }

    onSaveReminder({
      title: title.trim(),
      date: selectedDate,
      startTime: time,
      endTime: time,
      category,
      description: description.trim(),
      isStarred,
      color: isStarred ? '#f43f5e' : '#38bdf8',
    });

    setTitle('');
    setDescription('');
    setIsStarred(false);
    onClose();
  };

  const handleTestVocal = () => {
    if (haptics) soundManager.playClick();
    speechManager.speakVocalReminder(title || 'Psychology Assignment', time || '21:00');
  };

  const quickPresets = [
    { title: 'Pdv101', time: '21:00', starred: false },
    { title: 'Psy', time: '23:59', starred: true },
    { title: 'Study Session', time: '18:00', starred: false },
    { title: 'Project Due', time: '23:59', starred: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-cyan-400/30 p-5 shadow-2xl text-slate-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              <BellPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-['Outfit'] font-bold text-base text-white">Set Quick Reminder</h3>
              <p className="text-[11px] text-cyan-300">Fast schedule & deadline reminder</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (haptics) soundManager.playClick();
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div>
          <div className="text-[11px] text-slate-400 mb-1.5">Quick Presets:</div>
          <div className="flex flex-wrap gap-1.5">
            {quickPresets.map((qp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (haptics) soundManager.playClick();
                  setTitle(qp.title);
                  setTime(qp.time);
                  setIsStarred(qp.starred);
                }}
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 text-[11px] text-slate-300 hover:text-cyan-200 transition-colors cursor-pointer"
              >
                {qp.title} ({qp.time === '23:59' ? '11:59pm*' : qp.time})
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-medium">Reminder Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Pdv101 or Psy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Time</label>
              <div className="relative">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="reminder">Reminder</option>
                <option value="work">Work / Class</option>
                <option value="meeting">Meeting</option>
                <option value="personal">Personal</option>
                <option value="fitness">Fitness</option>
              </select>
            </div>
          </div>

          {/* Starred / Urgent Priority Toggle */}
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
            <div className="flex items-center gap-2">
              <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
              <div>
                <div className="text-white font-medium">Mark with Asterisk (*)</div>
                <div className="text-[10px] text-slate-400">Shows with deadline highlight (e.g. Psy-11:59pm*)</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isStarred}
              onChange={(e) => setIsStarred(e.target.checked)}
              className="rounded text-cyan-500 focus:ring-cyan-400 cursor-pointer"
            />
          </label>

          {/* Vocal Reminder Option */}
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={vocalAlert}
                onChange={(e) => setVocalAlert(e.target.checked)}
                className="rounded text-cyan-500 focus:ring-cyan-400 cursor-pointer"
              />
              <div>
                <div className="text-white font-medium flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Vocal Speech Alert</span>
                </div>
                <div className="text-[10px] text-slate-400">Speaks spoken announcement when due</div>
              </div>
            </label>

            <button
              type="button"
              onClick={handleTestVocal}
              className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold text-[11px] border border-cyan-400/30 transition-colors cursor-pointer"
              title="Test spoken voice alert"
            >
              Test Voice
            </button>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">Note / Location (optional)</label>
            <input
              type="text"
              placeholder="e.g. Due before midnight on portal"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 hover:bg-white/15 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
            >
              Save Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
