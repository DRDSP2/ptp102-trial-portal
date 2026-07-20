import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Syringe, Clock, Eye, AlertTriangle } from 'lucide-react';

export function ProtocolInfoCard() {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Syringe className="h-5 w-5" />
          PTP-102 Dosage & Monitoring Protocol
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-white border-blue-200">
          <Syringe className="h-4 w-4 text-blue-600" />
          <AlertDescription className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-blue-900 mb-2">Dosage Administration:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-blue-800">
                <li><strong>Route:</strong> Intravenous via jugular vein</li>
                <li><strong>Concentration:</strong> 5 mg/mL</li>
                <li><strong>Total Volume:</strong> 500 mL per dose</li>
                <li><strong>Administration Time:</strong> Slow infusion over 15-30 minutes</li>
                <li><strong>Technique:</strong> Standard sterile technique required</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Two-Dose Protocol:
              </p>
              <div className="space-y-1 ml-2 text-blue-800">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-900 border-blue-300">Day 0</Badge>
                  <span>First dose</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-900 border-blue-300">+12 hours</Badge>
                  <span>Second dose (12 hours after first)</span>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <Alert className="bg-white border-orange-200">
          <Eye className="h-4 w-4 text-orange-600" />
          <AlertDescription className="space-y-2 text-sm">
            <div>
              <p className="font-semibold text-orange-900 mb-2">Monitoring Period:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-orange-800">
                <li><strong>Primary Response:</strong> First 72 hours (close observation required)</li>
                <li><strong>Extended Follow-up:</strong> 10-14 days total to document recovery</li>
                <li><strong>Adverse Event Reporting:</strong> Record any unexpected reactions immediately</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        <Alert className="bg-white border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-sm">
            <p className="font-semibold text-yellow-900 mb-1">Critical Timepoints:</p>
            <div className="grid grid-cols-2 gap-2 text-yellow-800 text-xs">
              <div>✓ Hour 0 (Dose 1)</div>
              <div>✓ Hour 12 (Dose 2)</div>
              <div>✓ Hour 24</div>
              <div>✓ Hour 48</div>
              <div>✓ Hour 72 (End primary)</div>
              <div>✓ Day 10-14 (Follow-up)</div>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
