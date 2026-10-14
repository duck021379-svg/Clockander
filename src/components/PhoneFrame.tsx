import React from 'react';
import { WidgetSettings } from '../types';

interface PhoneFrameProps {
  settings: WidgetSettings;
  children: React.ReactNode;
  onOpenCustomizer?: () => void;
  onOpenGemini?: () => void;
  onOpenShade?: () => void;
  onOpenKeep?: () => void;
  referenceImage?: string | null;
  isOverlayActive?: boolean;
  overlayOpacity?: number;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  settings,
  children,
  referenceImage,
  isOverlayActive = false,
  overlayOpacity = 0.5,
}) => {
  // Wallpaper background styles
  const getWallpaperStyle = (): React.CSSProperties => {
    switch (settings.wallpaper) {
      case 'obsidian':
        return {
          backgroundColor: '#030712',
          backgroundImage:
            'radial-gradient(circle at 50% 0%, rgba(30, 41, 59, 0.4) 0%, rgba(3, 7, 18, 1) 100%)',
        };
      case 'aurora':
        return {
          backgroundColor: '#020617',
          backgroundImage:
            'radial-gradient(ellipse at 20% 20%, rgba(16, 185, 129, 0.25) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 60%), radial-gradient(ellipse at 50% 50%, rgba(14, 165, 233, 0.2) 0%, rgba(2, 6, 23, 1) 100%)',
        };
      case 'cyber-sunset':
        return {
          backgroundColor: '#0f051d',
          backgroundImage:
            'radial-gradient(circle at 80% 10%, rgba(244, 63, 94, 0.3) 0%, transparent 50%), radial-gradient(circle at 20% 70%, rgba(245, 158, 11, 0.25) 0%, transparent 60%), linear-gradient(180deg, rgba(15, 5, 29, 0.9) 0%, rgba(2, 6, 23, 1) 100%)',
        };
      case 'frost-crystal':
        return {
          backgroundColor: '#081226',
          backgroundImage:
            'radial-gradient(circle at 50% 20%, rgba(186, 230, 253, 0.2) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(56, 189, 248, 0.25) 0%, rgba(8, 18, 38, 1) 100%)',
        };
      case 'custom':
        if (settings.customWallpaperUrl) {
          return {
            backgroundImage: `url(${settings.customWallpaperUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          };
        }
        return {
          backgroundColor: '#020617',
        };
      case 'cyan-nebula':
      default:
        return {
          backgroundColor: '#020617',
          backgroundImage:
            'radial-gradient(circle at 10% 20%, rgba(6, 182, 212, 0.35) 0%, transparent 45%), radial-gradient(circle at 90% 70%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(15, 23, 42, 0.8) 0%, rgba(2, 6, 23, 1) 100%)',
        };
    }
  };

  return (
    <div
      style={getWallpaperStyle()}
      className="min-h-screen w-full flex flex-col items-center justify-start pt-6 sm:pt-12 p-3 sm:p-6 transition-all duration-300 overflow-x-hidden box-border"
    >
      {/* Pure Widget Container without phone chassis, camera holes, or status bars */}
      <div className="relative w-full max-w-[430px] mx-auto flex flex-col items-center justify-start overflow-hidden box-border">
        {children}

        {/* Optional Live Design Overlay Comparison */}
        {referenceImage && isOverlayActive && (
          <div
            className="absolute inset-0 z-40 pointer-events-none transition-opacity"
            style={{ opacity: overlayOpacity }}
          >
            <img
              src={referenceImage}
              alt="Design Overlay"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
};
