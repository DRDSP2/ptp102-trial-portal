import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, Droplets, Clock, Weight, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export function DoseCalculator() {
  const [concentration, setConcentration] = useState<string>('5');
  const [volume, setVolume] = useState<string>('500');
  const [infusionDuration, setInfusionDuration] = useState<string>('20');
  const [horseWeight, setHorseWeight] = useState<string>('500');
  const [customDose, setCustomDose] = useState<string>('');

  const calculatedDoseMg = parseFloat(concentration || '0') * parseFloat(volume || '0');
  const dosePerKg = horseWeight && calculatedDoseMg ? calculatedDoseMg / parseFloat(horseWeight) : 0;
  const infusionRateMlMin = volume && infusionDuration ? parseFloat(volume) / parseFloat(infusionDuration) : 0;
  const customTotalDose = customDose && concentration ? parseFloat(customDose) * parseFloat(concentration) : 0;

  const isStandardProtocol = 
    Math.abs(parseFloat(concentration || '0') - 5) < 0.1 &&
    Math.abs(parseFloat(volume || '0') - 500) < 1;

  return (
    <div className="space-y-6">
      <Card className="border-[#6b7f3a]/20">
        <CardHeader className="bg-gradient-to-r from-[#6b7f3a]/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#6b7f3a] rounded-lg text-white">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">PTP-102 Dose Calculator</CardTitle>
              <p className="text-sm text-slate-500">Verify administration parameters before treatment</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Standard Protocol Banner */}
          <div className={`p-4 rounded-lg border ${isStandardProtocol ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-start gap-3">
              {isStandardProtocol ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-semibold ${isStandardProtocol ? 'text-green-900' : 'text-amber-900'}`}>
                  {isStandardProtocol ? 'Standard Protocol Parameters' : 'Non-Standard Parameters'}
                </p>
                <p className={`text-sm mt-1 ${isStandardProtocol ? 'text-green-700' : 'text-amber-700'}`}>
                  {isStandardProtocol 
                    ? 'Current values match the approved PTP-102 protocol (5mg/mL, 500mL).' 
                    : 'Current values deviate from standard protocol. Document rationale in treatment notes.'}
                </p>
              </div>
            </div>
          </div>

          {/* Input Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="concentration" className="flex items-center gap-2">
                <Droplets className="h-3.5 w-3.5 text-[#6b7f3a]" />
                Concentration (mg/mL)
              </Label>
              <Input
                id="concentration"
                type="number"
                step="0.1"
                value={concentration}
                onChange={(e) => setConcentration(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-slate-400">Standard: 5 mg/mL</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="volume" className="flex items-center gap-2">
                <Droplets className="h-3.5 w-3.5 text-[#6b7f3a]" />
                Total Volume (mL)
              </Label>
              <Input
                id="volume"
                type="number"
                step="1"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-slate-400">Standard: 500 mL</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="infusionDuration" className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-[#6b7f3a]" />
                Infusion Duration (minutes)
              </Label>
              <Input
                id="infusionDuration"
                type="number"
                step="1"
                value={infusionDuration}
                onChange={(e) => setInfusionDuration(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-slate-400">Protocol: 15-30 minutes</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="horseWeight" className="flex items-center gap-2">
                <Weight className="h-3.5 w-3.5 text-[#6b7f3a]" />
                Horse Weight (kg)
              </Label>
              <Input
                id="horseWeight"
                type="number"
                step="1"
                value={horseWeight}
                onChange={(e) => setHorseWeight(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-slate-400">Optional — for mg/kg reference</p>
            </div>
          </div>

          <Separator />

          {/* Results */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-[#6b7f3a]" />
              Calculated Results
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <ResultCard
                label="Total Dose"
                value={`${calculatedDoseMg.toLocaleString()} mg`}
                highlight
              />
              <ResultCard
                label="Infusion Rate"
                value={`${infusionRateMlMin.toFixed(1)} mL/min`}
              />
              <ResultCard
                label="Dose per kg"
                value={`${dosePerKg.toFixed(2)} mg/kg`}
              />
              <ResultCard
                label="Drops/sec (20gtt)"
                value={`${(infusionRateMlMin * 20 / 60).toFixed(1)} gtt/s`}
              />
            </div>
          </div>

          {/* Custom Volume Quick Calc */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <Label htmlFor="customDose" className="text-sm font-semibold mb-2 block">
              Quick Volume-to-Dose Lookup
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="customDose"
                type="number"
                placeholder="Enter volume in mL..."
                value={customDose}
                onChange={(e) => setCustomDose(e.target.value)}
                className="font-mono max-w-[200px]"
              />
              <span className="text-sm text-slate-400">× {concentration} mg/mL =</span>
              <Badge variant="outline" className="font-mono text-base px-3 py-1">
                {customTotalDose ? `${customTotalDose.toLocaleString()} mg` : '—'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-lg border ${highlight ? 'bg-[#6b7f3a]/5 border-[#6b7f3a]/20' : 'bg-white border-slate-200'}`}>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-mono font-semibold ${highlight ? 'text-[#4a5c28] text-lg' : 'text-slate-900'}`}>
        {value}
      </p>
    </div>
  );
}
