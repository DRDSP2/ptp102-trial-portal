import { useState, useEffect } from 'react';
import { useLoadAction, useMutateAction } from '@uibakery/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import createEnrollmentEligibilityAction from '@/actions/createEnrollmentEligibility';
import loadEnrollmentEligibilityAction from '@/actions/loadEnrollmentEligibility';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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

type EligibilityRow = {
  patient_id: number;
  inclusion_diagnosed_acute_laminitis: boolean | null;
  inclusion_obel_grade_1_to_3: boolean | null;
  inclusion_age_2_to_20: boolean | null;
  inclusion_weight_over_200kg: boolean | null;
  inclusion_owner_consent: boolean | null;
  inclusion_no_prior_investigational_drug_30d: boolean | null;
  exclusion_chronic_laminitis_over_14d: boolean | null;
  exclusion_pregnant_or_lactating: boolean | null;
  exclusion_concurrent_systemic_disease: boolean | null;
  exclusion_prior_investigational_drug_30d: boolean | null;
  exclusion_owner_declined_consent: boolean | null;
  eligibility_determination: 'eligible' | 'ineligible' | 'requires_deviation';
  ineligible_reason: string | null;
  deviation_justification: string | null;
  screened_by: string | null;
  screened_at: string | null;
};

function mapRowToState(row: EligibilityRow | undefined) {
  if (!row) return null;
  return {
    inclusions: {
      inclusionDiagnosedAcuteLaminitis: row.inclusion_diagnosed_acute_laminitis,
      inclusionObelGrade1To3: row.inclusion_obel_grade_1_to_3,
      inclusionAge2To20: row.inclusion_age_2_to_20,
      inclusionWeightOver200kg: row.inclusion_weight_over_200kg,
      inclusionOwnerConsent: row.inclusion_owner_consent,
      inclusionNoPriorInvestigationalDrug30d: row.inclusion_no_prior_investigational_drug_30d,
    },
    exclusions: {
      exclusionChronicLaminitisOver14d: row.exclusion_chronic_laminitis_over_14d,
      exclusionPregnantOrLactating: row.exclusion_pregnant_or_lactating,
      exclusionConcurrentSystemicDisease: row.exclusion_concurrent_systemic_disease,
      exclusionPriorInvestigationalDrug30d: row.exclusion_prior_investigational_drug_30d,
      exclusionOwnerDeclinedConsent: row.exclusion_owner_declined_consent,
    },
    deviationJustification: row.deviation_justification ?? '',
  };
}

export function EnrollmentEligibilityScreen({
  patientId,
  onComplete,
  locked = false,
}: {
  patientId: number;
  onComplete: (eligible: boolean) => void;
  locked?: boolean;
}) {
  const auth = useAuth();
  const [saveEligibility, isSaving] = useMutateAction(createEnrollmentEligibilityAction);
  const [existingRows, eligibilityLoading] = useLoadAction(loadEnrollmentEligibilityAction, [], { patientId });

  const [inclusions, setInclusions] = useState<Record<string, boolean | null>>({});
  const [exclusions, setExclusions] = useState<Record<string, boolean | null>>({});
  const [deviationJustification, setDeviationJustification] = useState('');
  const [showDeviation, setShowDeviation] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load persisted eligibility state so the screen is not write-only.
  useEffect(() => {
    if (eligibilityLoading) return;
    const row = (existingRows?.[0] as EligibilityRow | undefined);
    const state = mapRowToState(row);
    if (state) {
      setInclusions(state.inclusions);
      setExclusions(state.exclusions);
      setDeviationJustification(state.deviationJustification);
      setShowDeviation(!!state.deviationJustification);
      setLastSavedAt(row?.screened_at ?? null);
    }
  }, [existingRows, eligibilityLoading]);

  const setInclusion = (key: string, value: boolean) => {
    if (locked) return;
    setInclusions((prev) => ({ ...prev, [key]: value }));
  };

  const setExclusion = (key: string, value: boolean) => {
    if (locked) return;
    setExclusions((prev) => ({ ...prev, [key]: value }));
  };

  const allInclusionsChecked = INCLUSION_CRITERIA.every((c) => inclusions[c.key] === true);
  const allExclusionsNo = EXCLUSION_CRITERIA.every((c) => exclusions[c.key] === false);
  const isEligible = allInclusionsChecked && allExclusionsNo;
  const isIneligible = INCLUSION_CRITERIA.some((c) => inclusions[c.key] === false) || EXCLUSION_CRITERIA.some((c) => exclusions[c.key] === true);

  const canSubmit =
    !locked &&
    !isSaving &&
    Object.keys(inclusions).length >= INCLUSION_CRITERIA.length &&
    Object.keys(exclusions).length >= EXCLUSION_CRITERIA.length;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    const determination = isEligible
      ? 'eligible'
      : showDeviation && deviationJustification
      ? 'requires_deviation'
      : 'ineligible';
    try {
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
        screenedBy: auth.email ?? 'unknown',
      });
      setLastSavedAt(new Date().toISOString());
      onComplete(isEligible || determination === 'requires_deviation');
    } catch (err) {
      console.error('Eligibility determination save failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to save the eligibility determination. Please try again.');
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardCheck className="h-5 w-5 text-blue-600" />
          Eligibility Screening
          {locked && (
            <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
              <Lock className="h-3 w-3 mr-1" />
              Locked
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert className="bg-blue-50 border-blue-200">
          <ShieldCheck className="h-4 w-4 text-info" />
          <AlertDescription className="text-sm text-blue-800">
            All inclusion criteria must be "Yes" and all exclusion criteria must be "No" for standard enrollment. 
            If criteria are not met, a protocol deviation justification is required.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {lastSavedAt && (
          <div className="flex items-center justify-between text-xs text-slate-700 bg-slate-50 p-2 rounded">
            <span>
              Last saved: {new Date(lastSavedAt).toLocaleString()}
            </span>
            <Badge variant="secondary">Saved</Badge>
          </div>
        )}

        {/* Inclusion Criteria */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Inclusion Criteria (ALL must be Yes)
          </h4>
          <div className="space-y-2">
            {INCLUSION_CRITERIA.map((c) => (
              <div key={c.key} className="flex items-center justify-between p-2 rounded-lg border bg-white">
                <span className="text-sm font-medium text-slate-900">{c.label}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInclusion(c.key, true)}
                    disabled={locked}
                    className={`min-h-10 min-w-10 px-3 py-1 text-xs rounded-md font-semibold transition-colors ${
                      inclusions[c.key] === true ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-800 hover:bg-green-50'
                    } ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    type="button"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setInclusion(c.key, false)}
                    disabled={locked}
                    className={`min-h-10 min-w-10 px-3 py-1 text-xs rounded-md font-semibold transition-colors ${
                      inclusions[c.key] === false ? 'bg-red-700 text-white' : 'bg-slate-100 text-slate-800 hover:bg-red-50'
                    } ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            Exclusion Criteria (ALL must be No)
          </h4>
          <div className="space-y-2">
            {EXCLUSION_CRITERIA.map((c) => (
              <div key={c.key} className="flex items-center justify-between p-2 rounded-lg border bg-white">
                <span className="text-sm font-medium text-slate-900">{c.label}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExclusion(c.key, true)}
                    disabled={locked}
                    className={`min-h-10 min-w-10 px-3 py-1 text-xs rounded-md font-semibold transition-colors ${
                      exclusions[c.key] === true ? 'bg-red-700 text-white' : 'bg-slate-100 text-slate-800 hover:bg-red-50'
                    } ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    type="button"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setExclusion(c.key, false)}
                    disabled={locked}
                    className={`min-h-10 min-w-10 px-3 py-1 text-xs rounded-md font-semibold transition-colors ${
                      exclusions[c.key] === false ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-800 hover:bg-green-50'
                    } ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertDescription className="text-green-800 font-medium">
              Horse meets all eligibility criteria. Proceed with enrollment.
            </AlertDescription>
          </Alert>
        )}

        {isIneligible && !showDeviation && (
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive-foreground">
              This horse does not meet protocol eligibility criteria. 
              <button onClick={() => setShowDeviation(true)} className="underline font-semibold ml-1" type="button" disabled={locked}>
                Request protocol deviation
              </button>
            </AlertDescription>
          </Alert>
        )}

        {isIneligible && showDeviation && (
          <div className="space-y-3">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-amber-800">
                Protocol deviation requires sponsor approval and documentation.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <label htmlFor="deviation-justification" className="text-sm font-medium text-foreground">Deviation Justification</label>
              <textarea
                id="deviation-justification"
                value={deviationJustification}
                onChange={(e) => !locked && setDeviationJustification(e.target.value)}
                disabled={locked}
                className="w-full px-3 py-2 border rounded-md text-sm disabled:bg-slate-100 disabled:text-slate-500"
                rows={3}
                placeholder="Explain why this horse should be enrolled despite not meeting standard criteria..."
              />
            </div>
          </div>
        )}

        <Separator />

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full"
          type="button"
        >
          {isSaving
            ? 'Saving...'
            : isEligible
            ? 'Confirm Eligibility & Proceed'
            : showDeviation
            ? 'Submit with Deviation Justification'
            : lastSavedAt
            ? 'Update Eligibility Determination'
            : 'Record Eligibility Determination'}
        </Button>
      </CardContent>
    </Card>
  );
}
