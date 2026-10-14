/**
 * Vocal Reminder & Speech Synthesis Utility
 * Integrated with user's downloaded Kokoro TTS model (Female Voices Only)
 * and enhanced browser speech synthesis fallback.
 */

export interface KokoroVoiceOption {
  id: string;
  name: string;
  accent: 'American' | 'British';
  description: string;
  gender?: 'female' | 'male';
}

/**
 * STRICTLY FEMALE KOKORO VOICES
 */
export const KOKORO_FEMALE_VOICES: KokoroVoiceOption[] = [
  { id: 'af_heart', name: 'Heart', accent: 'American', gender: 'female', description: 'Warm & Natural (Recommended)' },
  { id: 'af_bella', name: 'Bella', accent: 'American', gender: 'female', description: 'Expressive & Upbeat' },
  { id: 'af_nicole', name: 'Nicole', accent: 'American', gender: 'female', description: 'Professional & Smooth' },
  { id: 'af_sarah', name: 'Sarah', accent: 'American', gender: 'female', description: 'Soft & Friendly' },
  { id: 'af_sky', name: 'Sky', accent: 'American', gender: 'female', description: 'Bright & Crisp' },
  { id: 'af_alloy', name: 'Alloy', accent: 'American', gender: 'female', description: 'Modern & Balanced' },
  { id: 'af_jessica', name: 'Jessica', accent: 'American', gender: 'female', description: 'Natural & Conversational' },
  { id: 'af_kore', name: 'Kore', accent: 'American', gender: 'female', description: 'Rich & Articulate' },
  { id: 'af_river', name: 'River', accent: 'American', gender: 'female', description: 'Calm & Gentle' },
  { id: 'bf_emma', name: 'Emma', accent: 'British', gender: 'female', description: 'British RP Crisp' },
  { id: 'bf_isabella', name: 'Isabella', accent: 'British', gender: 'female', description: 'British Elegant' },
  { id: 'bf_alice', name: 'Alice', accent: 'British', gender: 'female', description: 'British Natural' },
  { id: 'bf_lily', name: 'Lily', accent: 'British', gender: 'female', description: 'British Soft & Melodic' },
];

/**
 * MALE KOKORO VOICES
 */
export const KOKORO_MALE_VOICES: KokoroVoiceOption[] = [
  { id: 'am_adam', name: 'Adam', accent: 'American', gender: 'male', description: 'Confident & Resonant' },
  { id: 'am_michael', name: 'Michael', accent: 'American', gender: 'male', description: 'Deep & Articulate' },
  { id: 'am_echo', name: 'Echo', accent: 'American', gender: 'male', description: 'Calm & Smooth' },
  { id: 'am_fenrir', name: 'Fenrir', accent: 'American', gender: 'male', description: 'Strong & Commanding' },
  { id: 'am_liam', name: 'Liam', accent: 'American', gender: 'male', description: 'Natural & Casual' },
  { id: 'am_onyx', name: 'Onyx', accent: 'American', gender: 'male', description: 'Crisp & Direct' },
  { id: 'am_puck', name: 'Puck', accent: 'American', gender: 'male', description: 'Energetic & Playful' },
  { id: 'bm_george', name: 'George', accent: 'British', gender: 'male', description: 'British Classic Warm' },
  { id: 'bm_lewis', name: 'Lewis', accent: 'British', gender: 'male', description: 'British Refined' },
  { id: 'bm_daniel', name: 'Daniel', accent: 'British', gender: 'male', description: 'British Calm & Narrative' },
  { id: 'bm_fable', name: 'Fable', accent: 'British', gender: 'male', description: 'British Melodic & Expressive' },
];

/**
 * COMPLETE CATALOG OF KOKORO VOICES
 */
export const ALL_KOKORO_VOICES: KokoroVoiceOption[] = [
  ...KOKORO_FEMALE_VOICES,
  ...KOKORO_MALE_VOICES,
];

export interface SpeechSettings {
  enabled: boolean;
  engine: 'kokoro' | 'browser';
  kokoroEndpoint: string;
  kokoroVoice: string; // Strictly female: e.g. 'af_heart'
  voiceURI?: string;
  rate: number; // 0.7 to 1.5
  pitch: number; // 0.5 to 1.5
  volume: number; // 0.0 to 1.0
  autoSpeakGemini: boolean;
  vocalAlertsOnDue: boolean;
}

const STORAGE_KEY = 'clockander_speech_settings_v2';

export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  enabled: true,
  engine: 'kokoro',
  kokoroEndpoint: 'http://127.0.0.1:8880/v1/audio/speech',
  kokoroVoice: 'af_bella',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  autoSpeakGemini: false,
  vocalAlertsOnDue: true,
};

export const loadSpeechSettings = (): SpeechSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SPEECH_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Failed to load speech settings:', err);
  }
  return DEFAULT_SPEECH_SETTINGS;
};

export const saveSpeechSettings = (settings: SpeechSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save speech settings:', err);
  }
};

/**
 * Direct Kokoro TTS Integration requested by user
 * Connects directly to local Kokoro API (http://127.0.0.1:8880/v1/audio/speech)
 * with automatic proxy fallback for HTTPS iframe environments.
 */
export async function speakWithKokoro(text: string, voice: string = 'af_bella'): Promise<HTMLAudioElement | null> {
  try {
    let response: Response | null = null;

    // 1. Try direct call to local Kokoro API
    try {
      const directController = new AbortController();
      const directTimeout = setTimeout(() => directController.abort(), 2000);
      response = await fetch('http://127.0.0.1:8880/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          voice: voice,
        }),
        signal: directController.signal,
      });
      clearTimeout(directTimeout);
    } catch (_directErr) {
      // In HTTPS iframe environments where browsers restrict direct mixed-content HTTP fetch,
      // route seamlessly through our server-side proxy
      try {
        const proxyController = new AbortController();
        const proxyTimeout = setTimeout(() => proxyController.abort(), 3500);
        response = await fetch('/api/tts/kokoro', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            voice: voice,
            endpoint: 'http://127.0.0.1:8880/v1/audio/speech',
          }),
          signal: proxyController.signal,
        });
        clearTimeout(proxyTimeout);
      } catch (_proxyErr) {
        response = null;
      }
    }

    if (!response || !response.ok) {
      return null;
    }

    // Verify response is actually playable audio and not an error JSON or HTML document
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('audio') && !contentType.includes('octet-stream')) {
      return null;
    }

    const audioBlob = await response.blob();
    if (!audioBlob || audioBlob.size < 64) {
      return null;
    }

    // Convert the API response into a playable audio object
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    // Clean up memory automatically after the audio finishes
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
    };

    await audio.play();
    return audio;
  } catch (_error) {
    // Non-fatal: Local Kokoro server offline or unreachable; callers fall back to browser female voice
    return null;
  }
}

class SpeechManager {
  private voices: SpeechSynthesisVoice[] = [];
  private settings: SpeechSettings = loadSpeechSettings();
  private isSpeaking = false;
  private currentSpokenText = '';
  private speakingListeners: Set<(isSpeaking: boolean, text?: string) => void> = new Set();
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioUrl: string | null = null;
  private keepAliveTimer: any = null;
  private audioCtx: AudioContext | null = null;

  public subscribeSpeaking(listener: (isSpeaking: boolean, text?: string) => void): () => void {
    this.speakingListeners.add(listener);
    listener(this.isSpeaking, this.currentSpokenText);
    return () => {
      this.speakingListeners.delete(listener);
    };
  }

  private notifySpeaking(speaking: boolean, text: string = '') {
    this.isSpeaking = speaking;
    this.currentSpokenText = speaking ? text : '';
    this.speakingListeners.forEach((l) => {
      try {
        l(speaking, this.currentSpokenText);
      } catch {
        // silent
      }
    });
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public getCurrentSpokenText(): string {
    return this.currentSpokenText;
  }

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.refreshVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.refreshVoices();
      };
    }
  }

  private refreshVoices(): SpeechSynthesisVoice[] {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const fresh = window.speechSynthesis.getVoices();
      if (fresh && fresh.length > 0) {
        this.voices = fresh;
      }
    }
    return this.voices;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    this.refreshVoices();
    return this.voices;
  }

  public getSettings(): SpeechSettings {
    return this.settings;
  }

  public updateSettings(partial: Partial<SpeechSettings>): void {
    this.settings = { ...this.settings, ...partial };
    saveSpeechSettings(this.settings);
  }

  /**
   * Intelligently resolves browser target voice, prioritizing female voices.
   */
  public findVoice(target?: string): SpeechSynthesisVoice | undefined {
    this.refreshVoices();
    if (!target) return undefined;

    const lowerTarget = target.toLowerCase().trim();

    // 1. Exact match by voiceURI
    const byURI = this.voices.find((v) => v.voiceURI === target);
    if (byURI) return byURI;

    // 2. Exact match by Name
    const byName = this.voices.find((v) => v.name.toLowerCase() === lowerTarget);
    if (byName) return byName;

    // 3. British English (en-GB)
    const isEnGBRequest =
      lowerTarget.includes('en-gb') ||
      lowerTarget.includes('en_gb') ||
      lowerTarget.includes('uk') ||
      lowerTarget.includes('british') ||
      lowerTarget.includes('united kingdom');

    if (isEnGBRequest) {
      const localGB = this.voices.find(
        (v) =>
          (v.lang.toLowerCase() === 'en-gb' || v.lang.toLowerCase() === 'en_gb') &&
          v.localService === true
      );
      if (localGB) return localGB;

      const anyGB = this.voices.find(
        (v) => v.lang.toLowerCase() === 'en-gb' || v.lang.toLowerCase() === 'en_gb'
      );
      if (anyGB) return anyGB;
    }

    // 4. Match by language code
    const byLang = this.voices.find(
      (v) => v.lang.toLowerCase() === lowerTarget || v.lang.toLowerCase().replace('_', '-') === lowerTarget
    );
    if (byLang) return byLang;

    return undefined;
  }

  /**
   * Plays audio with Kokoro TTS (from user's downloaded local model).
   */
  public async speakKokoro(
    text: string,
    options?: {
      voice?: string;
      speed?: number;
      endpoint?: string;
      onEnd?: () => void;
      onError?: () => void;
    }
  ): Promise<boolean> {
    const voiceToUse = options?.voice || this.settings.kokoroVoice || 'af_bella';

    this.stop();
    this.notifySpeaking(true, text);

    try {
      const audio = await speakWithKokoro(text, voiceToUse);
      if (audio) {
        this.currentAudio = audio;
        audio.onended = () => {
          this.currentAudio = null;
          this.notifySpeaking(false);
          options?.onEnd?.();
        };
        audio.onerror = () => {
          this.currentAudio = null;
          this.notifySpeaking(false);
          options?.onError?.();
        };
        return true;
      }
      this.notifySpeaking(false);
      return false;
    } catch (_err) {
      this.notifySpeaking(false);
      return false;
    }
  }

  private playFallbackTone() {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.12);
      osc.frequency.setValueAtTime(783.99, now + 0.24);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // ignore
    }
  }

  /**
   * Universal speak method:
   * Uses downloaded Kokoro model by default with user's selected female voice,
   * with seamless fallback to browser voice if Kokoro server is temporarily inactive.
   */
  public async speak(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      voiceURI?: string;
      kokoroVoice?: string;
      onEnd?: () => void;
      onError?: () => void;
      forceBrowser?: boolean;
    }
  ): Promise<boolean> {
    const useKokoro = !options?.forceBrowser && this.settings.engine === 'kokoro';

    if (useKokoro) {
      const kokoroSuccess = await this.speakKokoro(text, {
        voice: options?.kokoroVoice || this.settings.kokoroVoice,
        speed: options?.rate ?? this.settings.rate,
        onEnd: options?.onEnd,
        onError: options?.onError,
      });

      if (kokoroSuccess) {
        return true;
      }
      // If Kokoro failed/server offline, seamlessly fall back to browser speech below
    }

    // Browser Speech Synthesis
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.playFallbackTone();
      return false;
    }

    try {
      this.refreshVoices();

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = options?.rate ?? this.settings.rate ?? 1.0;
          utterance.pitch = options?.pitch ?? this.settings.pitch ?? 1.0;
          utterance.volume = this.settings.volume ?? 1.0;

          const targetVoiceIdent = options?.voiceURI || this.settings.voiceURI;
          const selectedVoice = this.findVoice(targetVoiceIdent);

          if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang || 'en-US';
          } else {
            // Find a natural English female voice
            const femaleEn = this.voices.find(
              (v) =>
                v.lang.startsWith('en') &&
                (v.name.toLowerCase().includes('female') ||
                  v.name.toLowerCase().includes('samantha') ||
                  v.name.toLowerCase().includes('victoria') ||
                  v.name.toLowerCase().includes('karen') ||
                  v.name.toLowerCase().includes('zira'))
            ) || this.voices.find((v) => v.lang.startsWith('en'));

            if (femaleEn) {
              utterance.voice = femaleEn;
              utterance.lang = femaleEn.lang;
            } else {
              utterance.lang = 'en-US';
            }
          }

          utterance.onstart = () => {
            this.notifySpeaking(true, text);
          };

          utterance.onend = () => {
            this.notifySpeaking(false);
            options?.onEnd?.();
          };

          utterance.onerror = (_e) => {
            this.notifySpeaking(false);
            this.playFallbackTone();
            options?.onError?.();
          };

          window.speechSynthesis.speak(utterance);

          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        } catch (_innerErr) {
          this.notifySpeaking(false);
          this.playFallbackTone();
        }
      }, 15);

      return true;
    } catch (_err) {
      this.notifySpeaking(false);
      this.playFallbackTone();
      return false;
    }
  }

  public speakVocalReminder(
    title: string,
    time?: string,
    options?: { voiceURI?: string; kokoroVoice?: string; rate?: number }
  ): Promise<boolean> {
    const formattedTime = time ? `at ${time}` : '';
    const message = `Reminder: ${title} is due ${formattedTime}. Please review your schedule.`;
    return this.speak(message, options);
  }

  public stop(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {}
      this.currentAudio = null;
    }

    if (this.currentAudioUrl) {
      try {
        URL.revokeObjectURL(this.currentAudioUrl);
      } catch {}
      this.currentAudioUrl = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.notifySpeaking(false);
  }
}

export const speechManager = new SpeechManager();
