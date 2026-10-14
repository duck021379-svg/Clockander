import React, { useState, useEffect, useRef } from 'react';
import { CalendarEvent, KeepNote } from '../types';
import {
  Sparkles,
  Send,
  Calendar,
  CheckSquare,
  X,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Zap,
  Cpu,
  Bot,
  User as UserIcon,
  Bell,
  Check,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { speechManager } from '../utils/speech';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  actionType?: string;
  newEvent?: any;
  newKeepNote?: any;
  vocalReminder?: any;
  applied?: boolean;
}

interface GeminiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onApplyKeepNote: (note: Omit<KeepNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  selectedDate: string;
  currentEvents: CalendarEvent[];
  currentNotes: KeepNote[];
  isGoogleConnected?: boolean;
  onConnectGoogle?: () => void;
  haptics?: boolean;
}

export const GeminiAssistantModal: React.FC<GeminiAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyEvent,
  onApplyKeepNote,
  selectedDate,
  currentEvents,
  currentNotes,
  isGoogleConnected = false,
  onConnectGoogle,
  haptics = true,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: 'Hello! I am your Clockander Workspace AI. I can keep your calendar, reminders, and Keep notes updated, set vocal reminders, and organize your daily schedule. What would you like to update or plan?',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');
  const [isListening, setIsListening] = useState(false);
  const [speechActive, setSpeechActive] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Setup Web Speech Recognition for voice input if supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  if (!isOpen) return null;

  const toggleVoiceInput = () => {
    if (haptics) soundManager.playClick();
    if (!recognitionRef.current) {
      setInput((prev) => (prev ? `${prev} (Speech input unavailable)` : 'Speech input unavailable on this browser'));
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech recognition error:', err);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || loading) return;

    if (haptics) soundManager.playClick();

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: promptText,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            text: m.text,
          })),
          model: selectedModel,
          context: {
            currentTime: new Date().toISOString(),
            selectedDate,
            isWorkspaceConnected: isGoogleConnected,
            events: currentEvents.slice(0, 10),
            tasks: currentNotes.slice(0, 10),
          },
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const rawText = await res.text();
        throw new Error(`Server returned unexpected response (${res.status}): ${rawText.slice(0, 80)}`);
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Server responded with ${res.status}`);
      }

      const assistantMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.replyMessage || 'I have reviewed your schedule and workspace context.',
        timestamp: Date.now(),
        actionType: data.actionType,
        newEvent: data.newEvent,
        newKeepNote: data.newKeepNote,
        vocalReminder: data.vocalReminder,
        applied: false,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (haptics) soundManager.playSuccess();

      // Automatically speak response if autoSpeak is enabled
      if (speechManager.getSettings().autoSpeakGemini) {
        speechManager.speak(assistantMessage.text);
      }

      // If Gemini suggested a vocal reminder, optionally trigger speech preview
      if (data.vocalReminder?.speechText) {
        speechManager.speakVocalReminder(
          data.vocalReminder.title || 'Upcoming Event',
          data.vocalReminder.time
        );
      }
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: `⚠️ Error: ${err.message || 'Could not communicate with Gemini.'}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyMessageEvent = (msgId: string, eventData: any) => {
    if (haptics) soundManager.playSuccess();
    onApplyEvent({
      title: eventData.title || 'Scheduled Event',
      date: eventData.date || selectedDate,
      startTime: eventData.startTime || '10:00',
      endTime: eventData.endTime || '11:00',
      category: eventData.category || 'work',
      description: eventData.description || 'Synced via Clockander Workspace AI',
      isStarred: eventData.isStarred || false,
    });

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, applied: true } : m))
    );
  };

  const handleApplyMessageKeepNote = (msgId: string, noteData: any) => {
    if (haptics) soundManager.playSuccess();
    onApplyKeepNote({
      title: noteData.title || 'Quick Keep Note',
      content: noteData.content || '',
      items: (noteData.items || []).map((it: any, idx: number) => ({
        id: `item-${Date.now()}-${idx}`,
        text: it.text || 'Task item',
        completed: it.completed || false,
      })),
      color: noteData.color || 'teal',
      tags: ['workspace', 'ai'],
      pinned: noteData.pinned || false,
    });

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, applied: true } : m))
    );
  };

  const handleSpeakText = (text: string) => {
    if (speechActive) {
      speechManager.stop();
      setSpeechActive(false);
    } else {
      setSpeechActive(true);
      speechManager.speak(text, {
        onEnd: () => setSpeechActive(false),
        onError: () => setSpeechActive(false),
      });
    }
  };

  const handleSpeakVocalReminder = (reminder: any) => {
    speechManager.speakVocalReminder(reminder.title || 'Scheduled Deadline', reminder.time);
  };

  const samplePrompts = [
    'Add a team sync tomorrow at 3pm and remind me',
    'Set a vocal reminder for Pdv101 at 9pm',
    'What is next on my schedule today?',
    'Create a Keep checklist for weekend groceries',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl h-[90vh] max-h-[720px] rounded-3xl bg-slate-950 border border-white/15 p-4 sm:p-5 shadow-2xl flex flex-col justify-between text-slate-100 overflow-hidden">
        {/* Header Bar */}
        <div className="pb-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-md">
              <Bot className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-['Outfit'] font-bold text-sm sm:text-base text-white">
                  Clockander Workspace AI
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-semibold border border-cyan-400/30">
                  Workspace Assistant
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>Role: Workspace Calendar & Vocal Reminder Assistant</span>
                {isGoogleConnected ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Workspace Synced
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    Local Schedule
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-3.5-flash')}
                className={`px-2 py-1 rounded-lg transition-all text-[11px] font-semibold cursor-pointer ${
                  selectedModel === 'gemini-3.5-flash'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="gemini-3.5-flash: Ideal for general productivity and calendar tasks"
              >
                3.5 Flash
              </button>
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
                className={`px-2 py-1 rounded-lg transition-all text-[11px] font-semibold cursor-pointer ${
                  selectedModel === 'gemini-3.1-flash-lite'
                    ? 'bg-lime-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="gemini-3.1-flash-lite: Ultra-fast low latency"
              >
                Fast Lite
              </button>
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-3.8-flash')}
                className={`px-2 py-1 rounded-lg transition-all text-[11px] font-semibold cursor-pointer ${
                  selectedModel === 'gemini-3.8-flash'
                    ? 'bg-purple-500 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="gemini-3.8-flash: Advanced reasoning for complex schedules"
              >
                3.8 Flash
              </button>
            </div>

            <button
              onClick={() => {
                if (haptics) soundManager.playClick();
                speechManager.stop();
                onClose();
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workspace Connection Notice if not signed in */}
        {!isGoogleConnected && onConnectGoogle && (
          <div className="my-2 p-2 px-3 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-xs flex items-center justify-between text-cyan-200">
            <span>Connect Google Workspace to auto-sync events to Google Calendar:</span>
            <button
              onClick={() => {
                if (haptics) soundManager.playClick();
                onConnectGoogle();
              }}
              className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] transition-transform active:scale-95 cursor-pointer"
            >
              Connect Workspace
            </button>
          </div>
        )}

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto py-3 px-1 flex flex-col gap-3.5 scrollbar-thin scrollbar-thumb-white/10">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-cyan-300" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] flex flex-col gap-2 rounded-2xl p-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-cyan-600/30 border border-cyan-400/30 text-white rounded-tr-xs'
                      : 'bg-white/10 border border-white/10 text-slate-100 rounded-tl-xs backdrop-blur-md'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Vocal Speak Button for Assistant Message */}
                  {!isUser && (
                    <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => handleSpeakText(msg.text)}
                        className="text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Vocalize this response out loud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Speak Response</span>
                      </button>

                      {msg.vocalReminder && (
                        <button
                          type="button"
                          onClick={() => handleSpeakVocalReminder(msg.vocalReminder)}
                          className="text-[11px] font-semibold text-lime-300 hover:text-lime-200 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Preview vocal reminder audio alert"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>Test Vocal Reminder</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Action Cards for Events or Notes */}
                  {msg.newEvent && (
                    <div className="mt-1 p-2.5 rounded-xl bg-lime-500/15 border border-lime-400/30 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-lime-400 uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Calendar Event Detected</span>
                        </div>
                        <div className="font-bold text-white text-xs truncate">
                          {msg.newEvent.title}
                        </div>
                        <div className="text-[10px] text-slate-300 font-mono">
                          {msg.newEvent.date || selectedDate} • {msg.newEvent.startTime} -{' '}
                          {msg.newEvent.endTime}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={msg.applied}
                        onClick={() => handleApplyMessageEvent(msg.id, msg.newEvent)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          msg.applied
                            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/30'
                            : 'bg-lime-400 hover:bg-lime-300 text-slate-950 shadow-md active:scale-95'
                        }`}
                      >
                        {msg.applied ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Added
                          </span>
                        ) : (
                          'Add to Schedule'
                        )}
                      </button>
                    </div>
                  )}

                  {msg.newKeepNote && (
                    <div className="mt-1 p-2.5 rounded-xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                          <CheckSquare className="w-3 h-3" />
                          <span>Keep Task Note</span>
                        </div>
                        <div className="font-bold text-white text-xs truncate">
                          {msg.newKeepNote.title}
                        </div>
                        <div className="text-[10px] text-slate-300 truncate">
                          {msg.newKeepNote.content ||
                            `${(msg.newKeepNote.items || []).length} items`}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={msg.applied}
                        onClick={() => handleApplyMessageKeepNote(msg.id, msg.newKeepNote)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          msg.applied
                            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/30'
                            : 'bg-purple-400 hover:bg-purple-300 text-slate-950 shadow-md active:scale-95'
                        }`}
                      >
                        {msg.applied ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Saved
                          </span>
                        ) : (
                          'Save to Keep'
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <UserIcon className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-cyan-300 italic">
              <Bot className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Gemini is analyzing workspace schedule and preparing response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sample Prompt Chips */}
        <div className="py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
          {samplePrompts.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => handleSendMessage(sample)}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white shrink-0 transition-colors cursor-pointer text-left"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Input Bar with Vocal Mic and Send */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="pt-2 border-t border-white/10 flex items-center gap-2"
        >
          {/* Voice Input Microphone Toggle */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-cyan-300'
            }`}
            title={isListening ? 'Listening... (Click to stop)' : 'Click to speak using voice recognition'}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening
                ? 'Listening to your voice...'
                : 'Ask Gemini to schedule events, set vocal reminders, or update Keep...'
            }
            className="flex-1 px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/15 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 px-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-cyan-500/20"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
