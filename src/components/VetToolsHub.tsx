import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DoseCalculator } from './DoseCalculator';
import {
  Calculator,
  Syringe,
  BookOpen,
  ChevronRight,
  HeartPulse,
  Weight,
  Thermometer,
  Ruler,
} from 'lucide-react';

export function VetToolsHub() {
  const [activeTool, setActiveTool] = useState<string>('dose-calc');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#6b7f3a] rounded-lg text-white">
          <HeartPulse className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Veterinary Tools</h2>
          <p className="text-sm text-slate-500">Clinical calculators and reference tools for trial administration</p>
        </div>
      </div>

      <Tabs value={activeTool} onValueChange={setActiveTool} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="dose-calc">
            <Calculator className="h-4 w-4 mr-2" />
            Dose Calc
          </TabsTrigger>
          <TabsTrigger value="weight-est">
            <Weight className="h-4 w-4 mr-2" />
            Weight Est.
          </TabsTrigger>
          <TabsTrigger value="temp-conv">
            <Thermometer className="h-4 w-4 mr-2" />
            Temp Conv.
          </TabsTrigger>
          <TabsTrigger value="protocol-ref">
            <BookOpen className="h-4 w-4 mr-2" />
            Protocol
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dose-calc" className="mt-6">
          <DoseCalculator />
        </TabsContent>

        <TabsContent value="weight-est" className="mt-6">
          <WeightEstimator />
        </TabsContent>

        <TabsContent value="temp-conv" className="mt-6">
          <TemperatureConverter />
        </TabsContent>

        <TabsContent value="protocol-ref" className="mt-6">
          <ProtocolReference />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WeightEstimator() {
  const [girth, setGirth] = useState<string>('');
  const [length, setLength] = useState<string>('');
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

  const weight = unit === 'metric'
    ? girth && length ? (Math.pow(parseFloat(girth), 2) * parseFloat(length)) / 11877 : 0
    : girth && length ? (Math.pow(parseFloat(girth), 2) * parseFloat(length)) / 330 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Weight className="h-5 w-5 text-[#6b7f3a]" />
          Horse Weight Estimator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex gap-2">
          <Badge
            className={`cursor-pointer ${unit === 'metric' ? 'bg-[#6b7f3a] text-white' : 'bg-slate-100 text-slate-600'}`}
            onClick={() => setUnit('metric')}
          >
            Metric (cm/kg)
          </Badge>
          <Badge
            className={`cursor-pointer ${unit === 'imperial' ? 'bg-[#6b7f3a] text-white' : 'bg-slate-100 text-slate-600'}`}
            onClick={() => setUnit('imperial')}
          >
            Imperial (in/lbs)
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Ruler className="h-3.5 w-3.5 text-[#6b7f3a]" />
              Heart Girth {unit === 'metric' ? '(cm)' : '(inches)'}
            </label>
            <input
              type="number"
              value={girth}
              onChange={(e) => setGirth(e.target.value)}
              className="w-full px-3 py-2 border rounded-md font-mono"
              placeholder={unit === 'metric' ? '180' : '70'}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Ruler className="h-3.5 w-3.5 text-[#6b7f3a]" />
              Body Length {unit === 'metric' ? '(cm)' : '(inches)'}
            </label>
            <input
              type="number"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="w-full px-3 py-2 border rounded-md font-mono"
              placeholder={unit === 'metric' ? '160' : '63'}
            />
          </div>
        </div>

        <div className="p-4 bg-[#6b7f3a]/5 border border-[#6b7f3a]/20 rounded-lg text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Estimated Weight</p>
          <p className="text-3xl font-mono font-bold text-[#4a5c28]">
            {weight > 0 ? `${weight.toFixed(0)} ${unit === 'metric' ? 'kg' : 'lbs'}` : '—'}
          </p>
          {weight > 0 && unit === 'imperial' && (
            <p className="text-xs text-slate-400 mt-1">
              ≈ {(weight * 0.453592).toFixed(0)} kg
            </p>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Formula: (Girth² × Length) ÷ {unit === 'metric' ? '11,877' : '330'}. 
          For accurate dosing, use a weigh bridge when available.
        </p>
      </CardContent>
    </Card>
  );
}

function TemperatureConverter() {
  const [celsius, setCelsius] = useState<string>('38.0');
  const fahrenheit = celsius ? (parseFloat(celsius) * 9 / 5) + 32 : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Thermometer className="h-5 w-5 text-[#6b7f3a]" />
          Temperature Converter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Celsius (°C)</label>
            <input
              type="number"
              step="0.1"
              value={celsius}
              onChange={(e) => setCelsius(e.target.value)}
              className="w-full px-3 py-2 border rounded-md font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Fahrenheit (°F)</label>
            <input
              type="number"
              step="0.1"
              value={typeof fahrenheit === 'number' ? fahrenheit.toFixed(1) : fahrenheit}
              readOnly
              className="w-full px-3 py-2 border rounded-md font-mono bg-slate-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Normal', c: '38.0', f: '100.4', color: 'bg-green-50 border-green-200 text-green-800' },
            { label: 'Low-Grade Fever', c: '38.5', f: '101.3', color: 'bg-amber-50 border-amber-200 text-amber-800' },
            { label: 'High Fever', c: '39.5', f: '103.1', color: 'bg-red-50 border-red-200 text-red-800' },
          ].map((ref) => (
            <button
              key={ref.label}
              onClick={() => setCelsius(ref.c)}
              className={`p-2 rounded-lg border text-center text-xs hover:shadow-sm transition-shadow ${ref.color}`}
            >
              <p className="font-semibold">{ref.label}</p>
              <p className="font-mono">{ref.c}°C / {ref.f}°F</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProtocolReference() {
  const protocolSteps = [
    {
      phase: 'Pre-Treatment',
      items: [
        'Verify eligibility criteria and owner consent',
        'Complete baseline Obel grade assessment',
        'Record baseline vital signs (HR, RR, temp)',
        'Collect baseline lab work (CBC, biochemistry)',
        'Confirm horse identity and microchip',
      ],
    },
    {
      phase: 'Dose 1 (Hour 0)',
      items: [
        'Prepare 500mL PTP-102 at 5mg/mL concentration',
        'Set up IV infusion via jugular catheter',
        'Infuse over 15-30 minutes (approx 17-33 mL/min)',
        'Monitor for immediate adverse reactions during infusion',
        'Document administration time, batch number, veterinarian',
      ],
    },
    {
      phase: 'Inter-Dose Monitoring (Hour 0-12)',
      items: [
        'Hourly vital signs for first 4 hours',
        'Digital pulse assessment every 2 hours',
        'Obel grade reassessment at Hour 6',
        'Document any adverse events immediately',
        'Maintain IV catheter patency',
      ],
    },
    {
      phase: 'Dose 2 (Hour 12)',
      items: [
        'Repeat 500mL PTP-102 infusion',
        'Same infusion parameters as Dose 1',
        'Continue close monitoring during administration',
        'Compare baseline vs current clinical parameters',
        'Document second dose with time deviation if any',
      ],
    },
    {
      phase: 'Post-Treatment (Hour 12-72)',
      items: [
        'Continue 4-hourly vital signs through Hour 24',
        'Obel grade at Hour 24, 48, and 72',
        'Repeat CBC/biochemistry at Hour 24',
        'Daily gait assessment and lameness scoring',
        'Document recovery trajectory',
      ],
    },
    {
      phase: 'Extended Follow-up (Day 3-14)',
      items: [
        'Day 10-14 final assessment visit',
        'Complete CBC, biochemistry, inflammatory markers',
        'Final Obel grade and pain score',
        'Owner satisfaction and follow-up care instructions',
        'Complete case report and data submission',
      ],
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Syringe className="h-5 w-5 text-[#6b7f3a]" />
          PTP-102 Protocol Reference
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {protocolSteps.map((step, index) => (
            <div key={step.phase} className="border rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">{step.phase}</span>
                <Badge variant="outline" className="text-xs">
                  Step {index + 1} of {protocolSteps.length}
                </Badge>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  {step.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <ChevronRight className="h-3.5 w-3.5 text-[#6b7f3a] mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
