import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Slide {
  id: string;
  slide_number: number;
  title: string;
  content: string;
}

export function PitchDeckViewer() {
  const { client } = useAuth();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.from('pitch_deck_slides').select('*').order('slide_number').then(({ data }) => {
      setSlides((data as Slide[]) || []);
      setLoading(false);
    });
  }, [client]);

  const next = () => setCurrent((c) => Math.min(c + 1, slides.length - 1));
  const prev = () => setCurrent((c) => Math.max(c - 1, 0));

  if (loading) return <div className="p-8 text-center text-slate-500">Loading pitch deck...</div>;

  if (slides.length === 0) return null;

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
