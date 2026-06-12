import { useEffect, useRef, useState } from 'react';

export interface ByrockLogoProps {
  variant: 'icon' | 'full';
  height?: number;
  className?: string;
  animated?: boolean;
}

function hasHeightClass(className: string): boolean {
  return /\b(h-\d+|h-\[[^\]]+\]|h-px|h-auto|h-full|h-screen|h-min|h-max|h-fit)\b/.test(className);
}

export function ByrockLogo({ variant, height, className = '', animated = false }: ByrockLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [forceIcon, setForceIcon] = useState(false);

  // If the full logo is squeezed below a readable width, automatically fall back
  // to the icon variant.
  useEffect(() => {
    if (variant !== 'full') return;
    const el = containerRef.current;
    if (!el) return;

    const check = () => setForceIcon(el.clientWidth < 200);
    check();

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(check);
      ro.observe(el);
    }
    window.addEventListener('resize', check);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', check);
    };
  }, [variant]);

  const effectiveVariant = variant === 'full' && forceIcon ? 'icon' : variant;
  const defaultHeight = effectiveVariant === 'icon' ? 32 : 40;
  const resolvedHeight = height ?? (hasHeightClass(className) ? undefined : defaultHeight);

  const src = effectiveVariant === 'icon' ? '/assets/byrock-icon.png' : '/assets/byrock-logo-full.png';
  const alt = 'Byrock Technologies Limited';

  return (
    <div
      ref={containerRef}
      className={`inline-flex items-center justify-center ${animated ? 'animate-pulse' : ''} ${className}`}
      style={resolvedHeight !== undefined ? { height: resolvedHeight } : undefined}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-auto object-contain"
        style={{ maxWidth: 'none' }}
      />
    </div>
  );
}
