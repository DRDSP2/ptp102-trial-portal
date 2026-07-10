import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle } from 'lucide-react';

const ctdModules = [
  {
    module: 'Module 1',
    title: 'Administrative Information and Prescribing Information',
    items: ['Cover letter', 'Application form', 'Labelling', 'Summary of product characteristics'],
  },
  {
    module: 'Module 2',
    title: 'Common Technical Document Summaries',
    items: ['Quality overall summary', 'Non-clinical overview', 'Clinical overview'],
  },
  {
    module: 'Module 3',
    title: 'Quality (CMC)',
    items: ['Drug substance (API)', 'Drug product', 'Manufacturing process', 'Control of materials', 'Stability'],
  },
  {
    module: 'Module 4',
    title: 'Non-Clinical Study Reports',
    items: ['Pharmacology', 'Pharmacokinetics', 'Toxicology'],
  },
  {
    module: 'Module 5',
    title: 'Clinical Study Reports',
    items: ['LAM-00007 report', 'Biomarker analysis', 'Safety summary'],
  },
];

export function RegulatoryPackageViewer() {
  return (
    <div className="space-y-6">
      {ctdModules.map((m) => (
        <Card key={m.module}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText size={18} />
              {m.module}: {m.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {m.items.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle size={14} className="text-green-600" /> {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
