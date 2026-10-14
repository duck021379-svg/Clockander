import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Calendar,
  CloudSun,
  BellPlus,
  Send,
  X,
  CheckCircle2,
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { speechManager } from '../utils/speech';
import { CalendarEvent } from '../types';

interface VoiceAssistantBarProps {
  onAddReminder: (reminder: {
    title: string;
    startTime: string;
    date: string;
    isStarred?: boolean;
  }) => void;
  onAddKeepNote?: (note: { title: string; content?: string; items?: string[] }) => void;
  onOpenKeep?: () => void;
  selectedDate: string;
  weatherTemp: number;
  weatherCondition: string;
  onOpenWeatherForecast?: () => void;
  haptics?: boolean;
}

export const VoiceAssistantBar: React.FC<VoiceAssistantBarProps> = ({
  onAddReminder,
  onAddKeepNote,
  onOpenKeep,
  selectedDate,
  weatherTemp,
  weatherCondition,
  onOpenWeatherForecast,
  haptics = true,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [assistantResponse, setAssistantResponse] = useState<string | null>(null);
  const [responseType, setResponseType] = useState<'reminder' | 'date' | 'weather' | 'keep' | 'general' | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          processVoiceCommand(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [weatherTemp, weatherCondition, selectedDate]);

  // Vocalize assistant message
  const speakReply = (text: string) => {
    setIsSpeaking(true);
    speechManager.speak(text, {
      onEnd: () => setIsSpeaking(false),
    });
  };

  // Stop vocal speech
  const handleStopSpeech = () => {
    if (haptics) soundManager.playClick();
    speechManager.stop();
    setIsSpeaking(false);
  };

  /**
   * Core Voice Command Processor:
   * 1. Talk to set reminders
   * 2. Talk to check what day it is
   * 3. Talk to ask what the weather is
   */
  const processVoiceCommand = (command: string) => {
    const lower = command.toLowerCase().trim();
    const now = new Date();

    // 1. Check what day / date it is
    if (
      lower.includes('what day') ||
      lower.includes('what is the day') ||
      lower.includes("what's the day") ||
      lower.includes('what date') ||
      lower.includes('what is today') ||
      lower.includes("what's today's date") ||
      lower.includes('current date') ||
      lower.includes('today date') ||
      lower === 'day' ||
      lower === 'date'
    ) {
      const weekdayLong = now.toLocaleDateString('en-US', { weekday: 'long' });
      const monthLong = now.toLocaleDateString('en-US', { month: 'long' });
      const dayNum = now.getDate();
      const year = now.getFullYear();

      const reply = `Today is ${weekdayLong}, ${monthLong} ${dayNum}, ${year}.`;
      setAssistantResponse(reply);
      setResponseType('date');
      if (haptics) soundManager.playSuccess();
      speakReply(reply);
      return;
    }

    // 2. Ask what the weather is
    if (
      lower.includes('weather') ||
      lower.includes('temperature') ||
      lower.includes('forecast') ||
      lower.includes('how hot') ||
      lower.includes('how cold') ||
      lower.includes('is it raining') ||
      lower === 'weather'
    ) {
      const cond = weatherCondition || 'Partly Cloudy';
      const temp = weatherTemp || 72;
      const reply = `Currently it's ${temp}°F and ${cond}. Tap the weather badge anytime for the 3-day forecast.`;

      setAssistantResponse(reply);
      setResponseType('weather');
      if (haptics) soundManager.playSuccess();
      speakReply(reply);
      if (onOpenWeatherForecast) {
        onOpenWeatherForecast();
      }
      return;
    }

    // 3. Set a reminder
    if (
      lower.startsWith('remind me to') ||
      lower.startsWith('remind me') ||
      lower.startsWith('set reminder') ||
      lower.startsWith('set a reminder') ||
      lower.includes('remind me') ||
      lower.includes('reminder for') ||
      lower.includes('reminder to')
    ) {
      // Extract time (e.g. "at 4pm", "at 10:30am", "at 14:00", "5pm")
      let startTime = '10:00';
      const timeMatch = lower.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);

      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const meridian = timeMatch[3]?.toLowerCase();

        if (meridian === 'pm' && hours < 12) hours += 12;
        if (meridian === 'am' && hours === 12) hours = 0;

        const formattedH = String(hours).padStart(2, '0');
        const formattedM = String(mins).padStart(2, '0');
        startTime = `${formattedH}:${formattedM}`;
      } else {
        // Default to next hour
        const nextHour = (now.getHours() + 1) % 24;
        startTime = `${String(nextHour).padStart(2, '0')}:00`;
      }

      // Extract reminder title: strip command keywords and time
      let title = lower
        .replace(/^remind me to\s+/i, '')
        .replace(/^remind me\s+/i, '')
        .replace(/^set a reminder to\s+/i, '')
        .replace(/^set reminder to\s+/i, '')
        .replace(/^set a reminder for\s+/i, '')
        .replace(/^set reminder for\s+/i, '')
        .replace(/^set a reminder\s+/i, '')
        .replace(/^reminder\s+/i, '')
        .replace(/\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, '')
        .replace(/\btomorrow\b/gi, '')
        .replace(/\btoday\b/gi, '')
        .trim();

      if (!title) {
        title = 'Quick Reminder';
      } else {
        // Capitalize first letter
        title = title.charAt(0).toUpperCase() + title.slice(1);
      }

      // Check if tomorrow was requested
      let targetDate = selectedDate || now.toISOString().split('T')[0];
      if (lower.includes('tomorrow')) {
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        targetDate = tomorrow.toISOString().split('T')[0];
      }

      // Format time nicely for speech confirmation (e.g. 4:00 PM)
      const [h, m] = startTime.split(':');
      const hNum = parseInt(h, 10);
      const period = hNum >= 12 ? 'PM' : 'AM';
      const formattedH = hNum % 12 || 12;
      const speechTime = m === '00' ? `${formattedH} ${period}` : `${formattedH}:${m} ${period}`;

      onAddReminder({
        title,
        startTime,
        date: targetDate,
        isStarred: lower.includes('urgent') || lower.includes('important'),
      });

      const reply = `Reminder set: ${title} at ${speechTime}.`;
      setAssistantResponse(reply);
      setResponseType('reminder');
      if (haptics) soundManager.playSuccess();
      speakReply(reply);
      return;
    }

    // 4. Create a Google Keep Note
    if (
      lower.startsWith('take a note') ||
      lower.startsWith('note to self') ||
      lower.startsWith('add a note') ||
      lower.startsWith('keep note') ||
      lower.startsWith('new note') ||
      lower.startsWith('create note') ||
      lower.startsWith('add to keep')
    ) {
      let noteText = lower
        .replace(/^take a note to\s+/i, '')
        .replace(/^take a note\s+/i, '')
        .replace(/^note to self\s+/i, '')
        .replace(/^add a note to\s+/i, '')
        .replace(/^add a note\s+/i, '')
        .replace(/^keep note\s+/i, '')
        .replace(/^new note\s+/i, '')
        .replace(/^create note\s+/i, '')
        .replace(/^add to keep\s+/i, '')
        .trim();

      if (!noteText) noteText = 'New Note';
      const capitalized = noteText.charAt(0).toUpperCase() + noteText.slice(1);

      if (onAddKeepNote) {
        onAddKeepNote({
          title: capitalized,
          content: capitalized,
        });
      }

      const reply = `Added to Google Keep: "${capitalized}".`;
      setAssistantResponse(reply);
      setResponseType('keep');
      if (haptics) soundManager.playSuccess();
      speakReply(reply);
      return;
    }

    // Default friendly response
    const reply = `I can set reminders, check what day it is, or tell you the weather. Try saying: "Remind me to call John at 4pm", "What day is it?", or "What's the weather?".`;
    setAssistantResponse(reply);
    setResponseType('general');
    speakReply(reply);
  };

  const handleToggleListening = () => {
    if (haptics) soundManager.playClick();

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (_e) {
          recognitionRef.current.stop();
          setTimeout(() => recognitionRef.current?.start(), 150);
        }
      } else {
        // Fallback for browsers without speech recognition
        const promptText = window.prompt(
          'Talk to Assistant (e.g. "Remind me to call Mom at 4pm", "What day is it?", "What\'s the weather?"):',
          'Remind me to call Mom at 4pm'
        );
        if (promptText) {
          setInputText(promptText);
          processVoiceCommand(promptText);
        }
      }
    }
  };

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (haptics) soundManager.playClick();
    processVoiceCommand(inputText);
  };

  return (
    <div className="w-full flex flex-col gap-2 select-none">
      {/* Voice Control Bar */}
      <div className="relative p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md shadow-lg transition-all flex flex-col sm:flex-row items-center gap-2">
        
        {/* Left: Interactive Microphone Button */}
        <button
          type="button"
          onClick={handleToggleListening}
          className={`relative p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/50 scale-105'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:brightness-110 active:scale-95'
          }`}
          title={isListening ? 'Listening... Tap to stop' : 'Tap to talk (Set reminders, ask day/date, ask weather)'}
        >
          {isListening ? (
            <>
              <div className="absolute inset-[-4px] rounded-xl bg-rose-500/40 animate-ping pointer-events-none" />
              <Mic className="w-5 h-5 text-white" />
            </>
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Center / Input: Type or Speech status */}
        <form onSubmit={handleSubmitText} className="flex-1 w-full flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListening
                ? 'Listening... Speak now...'
                : 'Talk or type: "Remind me at 4pm", "What day is it?", "What\'s the weather?"'
            }
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-all font-sans"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Execute command"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Right: Stop Speech Button if speaking */}
        {isSpeaking && (
          <button
            type="button"
            onClick={handleStopSpeech}
            className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-300 flex items-center gap-1 text-xs font-semibold cursor-pointer animate-pulse"
            title="Stop speaking"
          >
            <VolumeX className="w-4 h-4" />
            <span className="hidden sm:inline">Mute</span>
          </button>
        )}
      </div>

      {/* Quick Voice Chips (1-tap speech triggers) */}
      <div className="flex items-center gap-1.5 flex-wrap px-1 text-[11px]">
        <span className="text-slate-400 text-[10px] font-medium mr-0.5">Quick voice actions:</span>

        <button
          type="button"
          onClick={() => {
            if (haptics) soundManager.playClick();
            setInputText('Remind me to call Mom at 4pm');
            processVoiceCommand('Remind me to call Mom at 4pm');
          }}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
        >
          <BellPlus className="w-3 h-3 text-cyan-400" />
          <span>"Remind me..."</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (haptics) soundManager.playClick();
            setInputText('What day is it?');
            processVoiceCommand('What day is it?');
          }}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
        >
          <Calendar className="w-3 h-3 text-amber-400" />
          <span>"What day is it?"</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (haptics) soundManager.playClick();
            setInputText("What's the weather?");
            processVoiceCommand("What's the weather?");
          }}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-purple-300 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
        >
          <CloudSun className="w-3 h-3 text-purple-400" />
          <span>"What's the weather?"</span>
        </button>
      </div>

      {/* Spoken Response Banner (with dismiss button) */}
      {assistantResponse && (
        <div
          className={`p-3 rounded-xl border flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200 ${
            responseType === 'reminder'
              ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-100'
              : responseType === 'date'
              ? 'bg-amber-500/15 border-amber-400/40 text-amber-100'
              : responseType === 'weather'
              ? 'bg-purple-500/15 border-purple-400/40 text-purple-100'
              : 'bg-white/10 border-white/15 text-slate-100'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {responseType === 'reminder' && <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />}
            {responseType === 'date' && <Calendar className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />}
            {responseType === 'weather' && <CloudSun className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />}
            {responseType === 'general' && <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />}

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                {responseType === 'reminder'
                  ? 'Reminder Created'
                  : responseType === 'date'
                  ? 'Day & Date'
                  : responseType === 'weather'
                  ? 'Weather Report'
                  : 'Assistant'}
              </span>
              <p className="text-xs sm:text-sm font-medium leading-relaxed">{assistantResponse}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => speakReply(assistantResponse)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
              title="Repeat aloud"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setAssistantResponse(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
