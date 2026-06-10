import { useEffect, useState } from 'react';

export function ByRockLogo({ className = '', animated = false }: { className?: string; animated?: boolean }) {
  const [isVisible, setIsVisible] = useState(!animated);
  const [pulseActive, setPulseActive] = useState(false);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animated]);

  useEffect(() => {
    if (!animated) return;
    const interval = setInterval(() => {
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 2000);
    }, 8000);
    setPulseActive(true);
    setTimeout(() => setPulseActive(false), 2000);
    return () => clearInterval(interval);
  }, [animated]);

  return (
    <div className={className}>
      <svg
        viewBox="0 0 260 50"
        className={`w-full h-full transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6b7f3a" />
            <stop offset="100%" stopColor="#4a5c28" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Animated circles around the logo mark */}
        {animated && (
          <>
            <circle
              cx="22"
              cy="25"
              r="18"
              fill="none"
              stroke="#6b7f3a"
              strokeWidth="0.5"
              opacity={pulseActive ? 0.4 : 0}
              className="transition-opacity duration-1000"
            >
              <animate attributeName="r" values="16;22;16" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
            </circle>
          </>
        )}

        {/* Logo mark - stylized B/R monogram in circle */}
        <g transform="translate(4, 4)">
          <circle
            cx="21"
            cy="21"
            r="20"
            fill="url(#logoGrad)"
            className={`transition-all duration-500 ${pulseActive ? 'filter drop-shadow-lg' : ''}`}
          />
          <text
            x="21"
            y="27"
            fontSize="18"
            fontWeight="800"
            fontFamily="system-ui, -apple-system, sans-serif"
            fill="white"
            textAnchor="middle"
            letterSpacing="-0.5"
          >
            BR
          </text>
        </g>

        {/* BYROCK text */}
        <text
          x="54"
          y="28"
          fontSize="20"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#1a1a1a"
          letterSpacing="1.5"
          className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          BYROCK
        </text>

        {/* TECHNOLOGIES LIMITED text */}
        <text
          x="54"
          y="42"
          fontSize="9"
          fontWeight="600"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#6b7f3a"
          letterSpacing="2.5"
          className={`transition-all duration-700 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          TECHNOLOGIES LIMITED
        </text>

        {/* Small tagline */}
        <text
          x="54"
          y="14"
          fontSize="7"
          fontWeight="500"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#888"
          letterSpacing="1"
          className={`transition-all duration-700 delay-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          REDEFINING EQUINE HEALTH
        </text>
      </svg>
    </div>
  );
}
