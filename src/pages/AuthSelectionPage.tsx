import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ByrockLogo } from '@/components/ByrockLogo';
import { HeroSection } from '@/components/HeroSection';
import { Shield, UserPlus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AuthSelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Top brand bar */}
      <header className="border-b border-silver-cool/40 bg-gunmetal-deep py-4 px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <ByrockLogo variant="full" height={28} />
          <p className="text-eyebrow hidden sm:block">PTP-102 Trial Portal</p>
        </div>
      </header>

      <HeroSection />

      {/* Access selection */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-eyebrow mb-4">Restricted access</p>
          <h2 className="font-display text-4xl sm:text-5xl text-silver-strong mb-4">
            Sign in to continue.
          </h2>
          <p className="text-silver-text text-lg max-w-xl mx-auto">
            Two roles, two entry points. Choose the one that matches your account.
          </p>
        </div>

        <Card className="mx-auto mt-12 max-w-xl bg-card/80 backdrop-blur-sm">
          <CardContent className="p-2">
            <div className="grid divide-y divide-silver-cool/40 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <button
                type="button"
                onClick={() => navigate('/vet/login')}
                className="group flex flex-col items-start gap-3 p-6 text-left transition-colors hover:bg-gunmetal-hover"
              >
                <UserPlus className="h-5 w-5 text-khaki" />
                <div>
                  <p className="font-medium text-silver-strong">Veterinarian</p>
                  <p className="mt-1 text-sm text-silver-text">
                    Investigators enrolling patients and recording case data.
                  </p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1 text-sm text-khaki">
                  Continue
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="group flex flex-col items-start gap-3 p-6 text-left transition-colors hover:bg-gunmetal-hover"
              >
                <Shield className="h-5 w-5 text-khaki" />
                <div>
                  <p className="font-medium text-silver-strong">Administrator</p>
                  <p className="mt-1 text-sm text-silver-text">
                    Sponsor oversight, screening review, and regulatory exports.
                  </p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1 text-sm text-khaki">
                  Continue
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="mx-auto mt-8 flex max-w-xl justify-center gap-3">
          <Button size="lg" onClick={() => navigate('/vet/login')}>
            Veterinarian access
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/admin/login')}>
            Admin access
          </Button>
        </div>
      </section>

      <footer className="border-t border-silver-cool/40 px-6 py-8 text-center text-sm text-silver-text">
        <p>Byrock Technologies Ltd. — Redefining equine health.</p>
        <p className="mt-1 text-xs text-silver-text/70">
          PTP-102 is an investigational new animal drug (INAD) under FDA CVM review.
        </p>
      </footer>
    </div>
  );
}
