import React, { useState, useEffect, useCallback } from 'react';
import { WidgetSettings } from '../types';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudSnow,
  CloudFog,
  RefreshCw,
  X,
  Calendar,
  Thermometer,
} from 'lucide-react';
import { soundManager } from '../utils/audio';

export interface WeatherData {
  temperatureF: number;
  temperatureC: number;
  condition: string;
  weatherCode: number;
  cityName: string;
  humidity?: number;
  isLive: boolean;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  formattedDate: string;
  weatherCode: number;
  condition: string;
  tempMaxF: number;
  tempMinF: number;
  tempMaxC: number;
  tempMinC: number;
}

interface WeatherWidgetProps {
  settings: WidgetSettings;
  textStyle?: React.CSSProperties;
  compact?: boolean;
  className?: string;
}

// Map WMO weather interpretation code to text and icon
export const getWeatherInfo = (code: number) => {
  switch (code) {
    case 0:
      return { text: 'Clear Sky', icon: Sun };
    case 1:
      return { text: 'Mainly Clear', icon: Sun };
    case 2:
      return { text: 'Partly Cloudy', icon: CloudSun };
    case 3:
      return { text: 'Overcast', icon: Cloud };
    case 45:
    case 48:
      return { text: 'Foggy', icon: CloudFog };
    case 51:
    case 53:
    case 55:
      return { text: 'Drizzle', icon: CloudDrizzle };
    case 61:
    case 63:
    case 65:
      return { text: 'Rain', icon: CloudRain };
    case 71:
    case 73:
    case 75:
    case 77:
      return { text: 'Snow', icon: CloudSnow };
    case 80:
    case 81:
    case 82:
      return { text: 'Showers', icon: CloudRain };
    case 95:
    case 96:
    case 99:
      return { text: 'Thunderstorm', icon: CloudLightning };
    default:
      return { text: 'Partly Cloudy', icon: CloudSun };
  }
};

export const getWeatherColorClass = (code: number): string => {
  if (code === 0 || code === 1) return 'text-amber-400';
  if (code === 2) return 'text-amber-300';
  if (code === 3) return 'text-slate-300';
  if (code >= 51 && code <= 82) return 'text-cyan-400';
  if (code >= 95) return 'text-purple-400';
  if (code >= 71 && code <= 77) return 'text-sky-200';
  return 'text-amber-300';
};

const generateFallbackForecast = (baseTempF: number, baseCode: number): DailyForecast[] => {
  const result: DailyForecast[] = [];
  const now = new Date();

  const variations = [
    { deltaMax: 4, deltaMin: -6, code: baseCode },
    { deltaMax: 6, deltaMin: -4, code: baseCode === 0 ? 1 : 2 },
    { deltaMax: 2, deltaMin: -8, code: baseCode === 0 ? 2 : 3 },
  ];

  for (let i = 1; i <= 3; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = d.getDate();

    const v = variations[i - 1];
    const maxF = Math.round(baseTempF + v.deltaMax);
    const minF = Math.round(baseTempF + v.deltaMin);
    const maxC = Math.round(((maxF - 32) * 5) / 9);
    const minC = Math.round(((minF - 32) * 5) / 9);
    const info = getWeatherInfo(v.code);

    result.push({
      date: d.toISOString().split('T')[0],
      dayName: i === 1 ? 'Tomorrow' : weekday,
      formattedDate: `${monthName} ${dayNum}`,
      weatherCode: v.code,
      condition: info.text,
      tempMaxF: maxF,
      tempMinF: minF,
      tempMaxC: maxC,
      tempMinC: minC,
    });
  }
  return result;
};

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  settings,
  textStyle,
  compact = false,
  className = '',
}) => {
  const [weather, setWeather] = useState<WeatherData>({
    temperatureF: settings.weatherTemp || 72,
    temperatureC: Math.round(((settings.weatherTemp || 72) - 32) * (5 / 9)),
    condition: settings.weatherCondition || 'Partly Cloudy',
    weatherCode: 2,
    cityName: 'Local',
    humidity: 48,
    isLive: false,
  });
  const [forecast, setForecast] = useState<DailyForecast[]>(() =>
    generateFallbackForecast(settings.weatherTemp || 72, 2)
  );
  const [isForecastOpen, setIsForecastOpen] = useState<boolean>(false);
  const [unit, setUnit] = useState<'F' | 'C'>('F');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [, setLastUpdated] = useState<Date>(new Date());

  // Close forecast on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isForecastOpen) {
        setIsForecastOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isForecastOpen]);

  const fetchWeather = useCallback(async () => {
    setIsLoading(true);
    let lat = 34.0522; // Default fallback: Los Angeles
    let lon = -118.2437;
    const detectedCity = 'Local';

    // 1. Try browser HTML5 Geolocation API with permissions policy check
    const getCoordinates = (): Promise<{ lat: number; lon: number } | null> => {
      return new Promise(async (resolve) => {
        if (!navigator.geolocation) return resolve(null);

        try {
          if (navigator.permissions && navigator.permissions.query) {
            const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
            if (status.state === 'denied') return resolve(null);
          }
        } catch (_e) {
          /* Permissions API might not support 'geolocation' in all environments */
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          () => resolve(null),
          { timeout: 3500, maximumAge: 600000 }
        );
      });
    };

    try {
      const coords = await getCoordinates();
      if (coords) {
        lat = coords.lat;
        lon = coords.lon;
      }

      // 2. Fetch real weather data and 4-day forecast from Open-Meteo free API
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(
          4
        )}&current=temperature_2m,relative_humidity_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&forecast_days=4`
      );

      if (res.ok) {
        const data = await res.json();
        const current = data.current;
        const tempF = Math.round(current.temperature_2m);
        const tempC = Math.round(((tempF - 32) * 5) / 9);
        const wCode = current.weather_code ?? 2;
        const { text } = getWeatherInfo(wCode);

        setWeather({
          temperatureF: tempF,
          temperatureC: tempC,
          condition: text,
          weatherCode: wCode,
          cityName: detectedCity,
          humidity: current.relative_humidity_2m,
          isLive: true,
        });

        // Parse 3-day forecast (indices 1, 2, 3 representing tomorrow and following 2 days)
        if (data.daily && Array.isArray(data.daily.time) && data.daily.time.length >= 2) {
          const days: DailyForecast[] = [];
          for (let i = 1; i < Math.min(data.daily.time.length, 4); i++) {
            const dateStr = data.daily.time[i];
            const [y, m, d] = dateStr.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
            const dayNum = dateObj.getDate();

            const code = data.daily.weather_code[i] ?? 0;
            const maxF = Math.round(data.daily.temperature_2m_max[i]);
            const minF = Math.round(data.daily.temperature_2m_min[i]);
            const maxC = Math.round(((maxF - 32) * 5) / 9);
            const minC = Math.round(((minF - 32) * 5) / 9);

            days.push({
              date: dateStr,
              dayName: i === 1 ? 'Tomorrow' : weekday,
              formattedDate: `${monthName} ${dayNum}`,
              weatherCode: code,
              condition: getWeatherInfo(code).text,
              tempMaxF: maxF,
              tempMinF: minF,
              tempMaxC: maxC,
              tempMinC: minC,
            });
          }
          if (days.length > 0) {
            setForecast(days);
          }
        }
        setLastUpdated(new Date());
      } else {
        throw new Error('Weather API request failed');
      }
    } catch {
      // Fallback placeholder data
      setWeather((prev) => ({
        ...prev,
        temperatureF: settings.weatherTemp || 72,
        temperatureC: Math.round(((settings.weatherTemp || 72) - 32) * (5 / 9)),
        condition: settings.weatherCondition || 'Partly Cloudy',
        weatherCode: 2,
        isLive: false,
      }));
      setForecast(generateFallbackForecast(settings.weatherTemp || 72, 2));
    } finally {
      setIsLoading(false);
    }
  }, [settings.weatherTemp, settings.weatherCondition]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  const toggleUnit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (settings.hapticsEnabled) soundManager.playClick();
    setUnit((prev) => (prev === 'F' ? 'C' : 'F'));
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (settings.hapticsEnabled) soundManager.playClick();
    fetchWeather();
  };

  const handleToggleForecast = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (settings.hapticsEnabled) soundManager.playClick();
    setIsForecastOpen((prev) => !prev);
  };

  const { icon: WeatherIcon, text: conditionText } = getWeatherInfo(weather.weatherCode);
  const currentTemp = unit === 'F' ? weather.temperatureF : weather.temperatureC;
  const activeColor = settings.textColor || '#b6ff00';

  const customStyle: React.CSSProperties = {
    color: activeColor,
    opacity: settings.textOpacity ?? 0.95,
    textShadow: `0 0 12px ${activeColor}55, 0 1px 3px rgba(0,0,0,0.85)`,
    ...textStyle,
  };

  return (
    <>
      <div
        className={`group flex items-center gap-2 select-none transition-all duration-200 ${className}`}
        style={customStyle}
        title={`Weather: ${weather.condition}, ${currentTemp}°${unit} (Click icon for 3-day forecast, click temp to toggle °F/°C)`}
      >
        {/* Weather Icon button - Clicks open the 3-day forecast view */}
        <button
          type="button"
          onClick={handleToggleForecast}
          className="relative p-1.5 rounded-xl hover:bg-white/10 active:scale-90 transition-all cursor-pointer flex items-center justify-center shrink-0 border border-transparent hover:border-white/20"
          title="Click to view 3-day weather forecast"
          aria-label="View 3-day weather forecast"
        >
          <WeatherIcon className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" />
          {isLoading && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            </span>
          )}
        </button>

        {/* Temperature & Conditions Info */}
        <div className="flex flex-col leading-tight text-right">
          {/* Temperature (Clickable to toggle F/C) */}
          <div className="flex items-baseline justify-end gap-1 font-bold">
            <button
              type="button"
              onClick={toggleUnit}
              className="text-xl sm:text-2xl font-extrabold tracking-tight hover:opacity-100 transition-opacity cursor-pointer font-sans"
              title="Click to toggle °F / °C"
            >
              {currentTemp}°{unit}
            </button>
          </div>

          {/* Condition Text & City Tag */}
          {!compact && (
            <div
              onClick={handleToggleForecast}
              className="text-[11px] sm:text-xs font-semibold tracking-wide opacity-90 truncate max-w-[130px] flex items-center justify-end gap-1 cursor-pointer hover:underline"
              title="Click to view 3-day weather forecast"
            >
              <span>{weather.condition || conditionText}</span>
              {weather.isLive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 inline-block shadow-sm" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3-Day Forecast Modal View */}
      {isForecastOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsForecastOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-slate-950/95 border border-cyan-400/40 p-5 shadow-2xl text-slate-100 flex flex-col gap-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 flex items-center justify-center">
                  <WeatherIcon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-['Outfit'] font-bold text-base text-white">
                      3-Day Forecast
                    </h3>
                    {weather.isLive && (
                      <span
                        className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm animate-pulse"
                        title="Live weather data active"
                      />
                    )}
                  </div>
                  <p className="text-[11px] text-cyan-300 font-medium">
                    {weather.cityName} • Now: {currentTemp}°{unit} ({weather.condition})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Unit Toggle Button */}
                <button
                  type="button"
                  onClick={toggleUnit}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-slate-200 transition-colors cursor-pointer border border-white/10"
                  title="Toggle between Fahrenheit (°F) and Celsius (°C)"
                >
                  °{unit}
                </button>

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Refresh weather data"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (settings.hapticsEnabled) soundManager.playClick();
                    setIsForecastOpen(false);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close forecast"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3-Day Forecast Cards Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {forecast.map((day, idx) => {
                const { icon: DayIcon } = getWeatherInfo(day.weatherCode);
                const max = unit === 'F' ? day.tempMaxF : day.tempMaxC;
                const min = unit === 'F' ? day.tempMinF : day.tempMinC;
                const iconColor = getWeatherColorClass(day.weatherCode);

                return (
                  <div
                    key={day.date || idx}
                    className="flex flex-col items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-cyan-400/40 hover:bg-slate-900 transition-all text-center group shadow-md"
                  >
                    <div>
                      <div className="text-xs font-bold text-white tracking-wide">
                        {day.dayName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {day.formattedDate}
                      </div>
                    </div>

                    <div className="my-2 p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center transition-transform group-hover:scale-110">
                      <DayIcon className={`w-6 h-6 ${iconColor}`} />
                    </div>

                    <div className="text-[11px] text-slate-300 font-medium leading-tight mb-2 truncate max-w-full px-1">
                      {day.condition}
                    </div>

                    {/* Temp High / Low Bar */}
                    <div className="w-full pt-1.5 border-t border-white/10 flex flex-col items-center gap-1">
                      <div className="flex items-baseline justify-center gap-1 text-xs font-extrabold font-mono">
                        <span className="text-white">{max}°</span>
                        <span className="text-slate-400 font-medium text-[10px]">/{min}°</span>
                      </div>
                      <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden flex">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-400"
                          style={{
                            width: `${Math.min(100, Math.max(30, (max / (unit === 'F' ? 100 : 40)) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Summary / Note */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/10 px-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-cyan-400" />
                <span>Next 3 Days</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Open-Meteo Satellite Sync
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
