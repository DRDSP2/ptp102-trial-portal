import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Factory, FileCheck } from 'lucide-react';

const dossierSections = [
  { title: 'Site Master File (SMF)', description: 'Facility overview, personnel, quality systems, and environmental monitoring.' },
  { title: 'Drug Master File (DMF)', description: 'API synthesis, specifications, and supplier qualification for methylated tirilazad.' },
  { title: 'DECRS', description: 'Drug Establishment Centralised Registration System verification.' },
  { title: 'Batch Records', description: 'GMP batch manufacturing and packaging records.' },
  { title: 'Validation Reports', description: 'Process validation, cleaning validation, and analytical method validation.' },
];

export function ManufacturingDossier() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory size={20} /> Manufacturing Dossier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {dossierSections.map((section) => (
            <div key={section.title} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 font-medium mb-1">
                <FileCheck size={16} className="text-green-600" />
                {section.title}
              </div>
              <div className="text-sm text-slate-600">{section.description}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
