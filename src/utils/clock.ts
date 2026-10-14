export interface ClockAngles {
  hourAngle: number;
  minuteAngle: number;
  secondAngle: number;
}

export function computeClockAngles(now: Date): ClockAngles {
  const ms = now.getMilliseconds();
  const s = now.getSeconds();
  const m = now.getMinutes();
  const h = now.getHours();

  // Analog continuous smooth sweep equations
  const secondAngle = 6 * (s + ms / 1000);
  const minuteAngle = 6 * (m + s / 60 + ms / 60000);
  const hourAngle = 30 * ((h % 12) + m / 60 + s / 3600);

  return { hourAngle, minuteAngle, secondAngle };
}

export class PrecisionClockEngine {
  private timerId: number | null = null;
  private isRunning = false;
  private callback: (now: Date) => void;
  private precisionMode: 'second' | 'minute';

  constructor(callback: (now: Date) => void, precisionMode: 'second' | 'minute' = 'second') {
    this.callback = callback;
    this.precisionMode = precisionMode;
  }

  setPrecision(mode: 'second' | 'minute') {
    this.precisionMode = mode;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  start() {
    this.isRunning = true;
    const tick = () => {
      if (!this.isRunning) return;
      const now = new Date();
      this.callback(now);

      const intervalMs = this.precisionMode === 'second' ? 1000 : 60000;
      const driftOffset = Date.now() % intervalMs;
      const nextInterval = intervalMs - driftOffset;

      this.timerId = window.setTimeout(tick, nextInterval);
    };

    tick();
  }

  stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
