import { ByrockLogo } from './ByrockLogo';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, HeartPulse, ShieldCheck } from 'lucide-react';

/**
 * Top-of-page hero. Mirrors the calm, editorial fintech tone of the design
 * reference: a deep gunmetal field with a soft photographic backdrop, a
 * faint khaki glow in the corners, an eyebrow label, and a serif display
 * headline. Stat chips at the foot replace the previous loud icon cards.
 */
export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-hero-gradient">
      {/* Soft photographic backdrop, heavily desaturated and dimmed. */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1598974357801-cbca100e65d3?w=1920&q=80)',
        }}
        aria-hidden
      />
      {/* Reinforce contrast at the bottom edge so following sections sit cleanly. */}
      <div
        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background"
        aria-hidden
      />
      {/* Subtle grain on the gunmetal field. */}
      <div className="absolute inset-0 bg-noise opacity-50" aria-hidden />

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 sm:py-32 text-center">
        <ByrockLogo variant="icon" className="mx-auto h-12 sm:h-14" animated />

        <p className="mt-8 text-eyebrow">
          <FlaskConical className="mr-1.5 inline-block h-3 w-3" />
          Clinical trial management
        </p>

        <h1 className="mt-4 font-display text-silver-strong">
          A different kind of equine trial.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-silver-text leading-relaxed">
          PTP-102 is a 72-hour two-dose investigational therapeutic for acute
          equine laminitis. Built to give clinicians the tools and oversight
          they need — and regulators the audit trail they expect.
        </p>

        {/* Stat chips — softer than the original icon cards */}
        <div className="mx-auto mt-12 flex max-w-2xl flex-wrap items-center justify-center gap-3">
          <Stat icon={<HeartPulse className="h-4 w-4" />} label="72-hour protocol" detail="Two-dose IV" />
          <Stat icon={<ShieldCheck className="h-4 w-4" />} label="Patents pending" detail="EU · US · AU" />
          <Stat icon={<FlaskConical className="h-4 w-4" />} label="5 mg/mL IV" detail="500 mL slow jugular" />
        </div>

        <div className="mt-12">
          <Badge variant="outline" className="border-silver-cool/60 text-silver-text">
            INAD-PTP102-2025 · FDA CVM under review
          </Badge>
        </div>
      </div>
    </section>
  );
}

function Stat({ icon, label, detail }: { icon: React.ReactNode; label: string; detail: string }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-silver-cool/50 bg-gunmetal-elevated/60 px-4 py-2 backdrop-blur-sm">
      <span className="text-khaki">{icon}</span>
      <span className="text-sm text-silver-strong">{label}</span>
      <span className="text-xs text-silver-text/70">·</span>
      <span className="text-xs text-silver-text">{detail}</span>
    </div>
  );
}
