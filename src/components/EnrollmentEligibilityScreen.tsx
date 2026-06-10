import { useState } from 'react';
import { useMutateAction } from '@uibakery/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import createEnrollmentEligibilityAction from '@/actions/createEnrollmentEligibility';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

const INCLUSION_CRITERIA = [
  { key: 'inclusionDiagnosedAcuteLaminitis', label: 'Horse with diagnosed acute laminitis (Obel grade 1-3)' },
  { key: 'inclusionObelGrade1To3', label: 'Obel grade between 1 and 3 (inclusive)' },
  { key: 'inclusionAge2To20', label: 'Horse age between 2 and 20 years' },
  { key: 'inclusionWeightOver200kg', label: 'Horse weight greater than 200 kg' },
  { key: 'inclusionOwnerConsent', label: 'Owner consent obtained (ICF signed or pending)' },
  { key: 'inclusionNoPriorInvestigationalDrug30d', label: 'No prior investigational drug within 30 days' },
];

const EXCLUSION_CRITERIA = [
  { key: 'exclusionChronicLaminitisOver14d', label: 'Chronic laminitis (>14 days duration)' },
  { key: 'exclusionPregnantOrLactating', label: 'Pregnant or lactating mare' },
  { key: 'exclusionConcurrentSystemicDisease', label: 'Concurrent systemic disease' },
  { key: 'exclusionPriorInvestigationalDrug30d', label: 'Prior treatment with investigational drug within 30 days' },
  { key: 'exclusionOwnerDeclinedConsent', label: 'Owner declined consent' },
];

export function EnrollmentEligibilityScreen({
  patientId,
  onComplete,
}: {
  patientId: number;
  onComplete: (eligible: boolean) => void;
}) {
  const [saveEligibility, isSaving] = useMutateAction(createEnrollmentEligibilityAction);

  const [inclusions, setInclusions] = useState<Record<string, boolean | null>>({});
  const [exclusions, setExclusions] = useState<Record<string, boolean | null>>({});
  const [deviationJustification, setDeviationJustification] = useState('');
  const [showDeviation, setShowDeviation] = useState(false);

  const setInclusion = (key: string, value: boolean) => {
    setInclusions((prev) => ({ ...prev, [key]: value }));
  };

  const setExclusion = (key: string, value: boolean) => {
    setExclusions((prev) => ({ ...prev, [key]: value }));
  };

  const allInclusionsChecked = INCLUSION_CRITERIA.every((c) => inclusions[c.key] === true);
  const allExclusionsNo = EXCLUSION_CRITERIA.every((c) => exclusions[c.key] === false);
  const isEligible = allInclusionsChecked && allExclusionsNo;
  const isIneligible = INCLUSION_CRITERIA.some((c) => inclusions[c.key] === false) || EXCLUSION_CRITERIA.some((c) => exclusions[c.key] === true);

  const handleSubmit = async () => {
    const determination = isEligible ? 'eligible' : showDeviation && deviationJustification ? 'requires_deviation' : 'ineligible';
    await saveEligibility({
      patientId,
      inclusionDiagnosedAcuteLaminitis: inclusions.inclusionDiagnosedAcuteLaminitis,
      inclusionObelGrade1To3: inclusions.inclusionObelGrade1To3,
      inclusionAge2To20: inclusions.inclusionAge2To20,
      inclusionWeightOver200kg: inclusions.inclusionWeightOver200kg,
      inclusionOwnerConsent: inclusions.inclusionOwnerConsent,
      inclusionNoPriorInvestigationalDrug30d: inclusions.inclusionNoPriorInvestigationalDrug30d,
      exclusionChronicLaminitisOver14d: exclusions.exclusionChronicLaminitisOver14d,
      exclusionPregnantOrLactating: exclusions.exclusionPregnantOrLactating,
      exclusionConcurrentSystemicDisease: exclusions.exclusionConcurrentSystemicDisease,
      exclusionPriorInvestigationalDrug30d: exclusions.exclusionPriorInvestigationalDrug30d,
      exclusionOwnerDeclinedConsent: exclusions.exclusionOwnerDeclinedConsent,
      eligibilityDetermination: determination,
      ineligibleReason: isIneligible ? 'Failed inclusion/exclusion criteria' : null,
      deviationJustification: determination === 'requires_deviation' ? deviationJustification : null,
      screenedBy: typeof window !== 'undefined' ? localStorage.getItem('veterinarian_email') || 'unknown' : 'unknown',
    });
    onComplete(isEligible || (determination === 'requires_deviation'));
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardCheck className="h-5 w-5 text-blue-600" />
          Eligibility Screening
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert className="bg-blue-50 border-blue-200">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            All inclusion criteria must be "Yes" and all exclusion criteria must be "No" for standard enrollment. 
            If criteria are not met, a protocol deviation justification is required.
          </AlertDescription>
        </Alert>

        {/* Inclusion Criteria */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Inclusion Criteria (ALL must be Yes)
          </h4>
          <div className="space-y-2">
            {INCLUSION_CRITERIA.map((c) => (
              <div key={c.key} className="flex items-center justify-between p-2 rounded-lg border bg-white">
                <span className="text-sm">{c.label}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInclusion(c.key, true)}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                      inclusions[c.key] === true ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-green-50'
                    }`}
                    type="button"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setInclusion(c.key, false)}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                      inclusions[c.key] === false ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-red-50'
                    }`}
                    type="button"
                  >
                    No
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exclusion Criteria */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            Exclusion Criteria (ALL must be No)
          </h4>
          <div className="space-y-2">
            {EXCLUSION_CRITERIA.map((c) => (
              <div key={c.key} className="flex items-center justify-between p-2 rounded-lg border bg-white">
                <span className="text-sm">{c.label}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExclusion(c.key, true)}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                      exclusions[c.key] === true ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-red-50'
                    }`}
                    type="button"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setExclusion(c.key, false)}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                      exclusions[c.key] === false ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-green-50'
                    }`}
                    type="button"
                  >
                    No
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Result */}
        {isEligible && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 font-medium">
              Horse meets all eligibility criteria. Proceed with enrollment.
            </AlertDescription>
          </Alert>
        )}

        {isIneligible && !showDeviation && (
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              This horse does not meet protocol eligibility criteria. 
              <button onClick={() => setShowDeviation(true)} className="underline font-semibold ml-1" type="button">
                Request protocol deviation
              </button>
            </AlertDescription>
          </Alert>
        )}

        {isIneligible && showDeviation && (
          <div className="space-y-3">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Protocol deviation requires sponsor approval and documentation.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deviation Justification</label>
              <textarea
                value={deviationJustification}
                onChange={(e) => setDeviationJustification(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={3}
                placeholder="Explain why this horse should be enrolled despite not meeting standard criteria..."
              />
            </div>
          </div>
        )}

        <Separator />

        <Button
          onClick={handleSubmit}
          disabled={isSaving || Object.keys(inclusions).length < INCLUSION_CRITERIA.length || Object.keys(exclusions).length < EXCLUSION_CRITERIA.length}
          className="w-full"
          type="button"
        >
          {isSaving ? 'Saving...' : isEligible ? 'Confirm Eligibility & Proceed' : showDeviation ? 'Submit with Deviation Justification' : 'Record Eligibility Determination'}
        </Button>
      </CardContent>
    </Card>
  );
}
