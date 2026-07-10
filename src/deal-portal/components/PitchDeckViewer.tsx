import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  { title: 'The Problem', content: 'Equine lameness and inflammatory conditions are misdiagnosed, fragmented, and expensive...' },
  { title: 'Our Solution', content: 'PTP-102 is an integrated equine clinical platform that standardises biomarker assessment...' },
  { title: 'Market Opportunity', content: 'Target equine population: ~12.7M. Laminitis case rate: 10%. Global TAM: ~1.2M cases...' },
  { title: 'Our Product', content: 'Lameness assessment module, biomarker analytics, regulatory documentation, partner portal...' },
  { title: 'Business Model', content: 'Licensing + SaaS subscriptions + Trial & consulting services...' },
  { title: 'Traction', content: 'Year 1 revenue potential: ~$598.6M. Gross margin: ~96.5%. Operating margin: ~18-20%...' },
  { title: 'Go-To-Market', content: 'Targeted outreach to equine hospitals, strategic licensing, scientific publication...' },
  { title: 'The Team', content: 'Dr. Daniel Shanahan-Prendergast (Director/IP Lead), Dr. Pamela Tiebler (Clinical Lead)...' },
  { title: 'Financial Projections', content: 'Year 1: $598.6M → Year 4: $915.5M. See full model in Financial Dashboard...' },
  { title: 'The Ask', content: 'Licence partnerships (territory-specific). Tranche A: ~$25.6M for manufacturing scale-up...' },
  { title: 'CMC & Regulatory', content: 'API: Methylated tirilazad. Target: Conditional approval 3Q28. Non-CMC cost: ~$519k...' },
];

export function PitchDeckViewer() {
  const [current, setCurrent] = useState(0);
  const next = () => setCurrent((c) => Math.min(c + 1, slides.length - 1));
  const prev = () => setCurrent((c) => Math.max(c - 1, 0));

  return (
    <Card className="max-w-3xl mx-auto">
      <CardContent className="p-8 min-h-[400px] flex flex-col justify-between">
        <div>
          <div className="text-xs text-slate-500 mb-2">
            Slide {current + 1} of {slides.length}
          </div>
          <h2 className="text-2xl font-bold mb-4">{slides[current].title}</h2>
          <p className="text-slate-700 leading-relaxed">{slides[current].content}</p>
        </div>
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={prev} disabled={current === 0}>
            <ChevronLeft className="mr-1" size={16} /> Prev
          </Button>
          <Button variant="outline" onClick={next} disabled={current === slides.length - 1}>
            Next <ChevronRight className="ml-1" size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
