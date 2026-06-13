import { useState } from 'react';
import { useMutateAction } from '@uibakery/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import createAdverseEventAction from '@/actions/createAdverseEvent';
import { checkProhibitedTerms } from '@/utils/prohibitedTermsFilter';
import {
  AlertTriangle,
  Stethoscope,
  Send,
  Clock,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

export function AdverseEventReporter({
  patientId,
  horseName,
  vetEmail,
  vetName,
  open: controlledOpen,
  onOpenChange,
}: {
  patientId?: number;
  horseName?: string;
  vetEmail: string | null;
  vetName: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [createAE, isSubmitting] = useMutateAction(createAdverseEventAction);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    setInternalOpen(value);
    onOpenChange?.(value);
  };
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    eventDescription: '',
    severity: '',
    causality: '',
    startDate: new Date().toISOString().slice(0, 16),
    isOngoing: true,
    resolvedDate: '',
    actionTaken: '',
    outcome: '',
    vetAssessment: '',
    digitalSignature: '',
    serious: false,
    expected: false,
  });

  const [termCheck, setTermCheck] = useState({ isClean: true, message: '' });

  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'eventDescription' || field === 'vetAssessment') {
      const check = checkProhibitedTerms(value);
      setTermCheck(check);
    }
  };

  const handleSubmit = async () => {
    if (!termCheck.isClean) return;
    await createAE({
      patientId: patientId || null,
      veterinarianId: null,
      reporterName: vetName,
      reporterEmail: vetEmail,
      eventDescription: form.eventDescription,
      severity: form.severity,
      causality: form.causality,
      startDate: form.startDate,
      isOngoing: form.isOngoing,
      resolvedDate: form.resolvedDate || null,
      actionTaken: form.actionTaken,
      outcome: form.outcome || null,
      vetAssessment: form.vetAssessment,
      digitalSignature: form.digitalSignature,
      serious: form.serious,
      expected: form.expected,
    });
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setForm({
        eventDescription: '', severity: '', causality: '', startDate: new Date().toISOString().slice(0, 16),
        isOngoing: true, resolvedDate: '', actionTaken: '', outcome: '', vetAssessment: '',
        digitalSignature: '', serious: false, expected: false,
      });
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="fixed bottom-24 right-6 z-50 shadow-lg hover:shadow-xl transition-shadow"
          type="button"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Report Adverse Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Adverse Event Report
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <p className="text-lg font-semibold text-green-900">Adverse Event Reported</p>
            <p className="text-sm text-green-700">
              {form.severity === 'Severe' || form.severity === 'Life-Threatening' || form.severity === 'Fatal'
                ? 'Admin and sponsor have been automatically notified.'
                : 'Your report has been logged.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-red-50 border-red-200">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-800">
                Report any unexpected event, reaction, or worsening condition. 
                Severe or life-threatening events must be reported within 24 hours per 21 CFR 511.1(b)(8)(ii).
              </AlertDescription>
            </Alert>

            {patientId && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">Patient: {horseName || `#${patientId}`}</Badge>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Severity *</Label>
                <Select value={form.severity} onValueChange={(v) => updateForm('severity', v)}>
                  <SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mild">Mild</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="Severe">Severe</SelectItem>
                    <SelectItem value="Life-Threatening">Life-Threatening</SelectItem>
                    <SelectItem value="Fatal">Fatal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Causality *</Label>
                <Select value={form.causality} onValueChange={(v) => updateForm('causality', v)}>
                  <SelectTrigger><SelectValue placeholder="Select causality" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unrelated">Unrelated</SelectItem>
                    <SelectItem value="Unlikely">Unlikely</SelectItem>
                    <SelectItem value="Possible">Possible</SelectItem>
                    <SelectItem value="Probable">Probable</SelectItem>
                    <SelectItem value="Definite">Definite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date/Time *</Label>
                <Input type="datetime-local" value={form.startDate} onChange={(e) => updateForm('startDate', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.isOngoing ? 'ongoing' : 'resolved'} onValueChange={(v) => updateForm('isOngoing', v === 'ongoing')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!form.isOngoing && (
                <div className="space-y-2">
                  <Label>Resolution Date</Label>
                  <Input type="datetime-local" value={form.resolvedDate} onChange={(e) => updateForm('resolvedDate', e.target.value)} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Action Taken *</Label>
                <Select value={form.actionTaken} onValueChange={(v) => updateForm('actionTaken', v)}>
                  <SelectTrigger><SelectValue placeholder="Select action" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Dose_Reduced">Dose Reduced</SelectItem>
                    <SelectItem value="Dose_Withheld">Dose Withheld</SelectItem>
                    <SelectItem value="Drug_Discontinued">Drug Discontinued</SelectItem>
                    <SelectItem value="Additional_Treatment">Additional Treatment Given</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Outcome</Label>
                <Select value={form.outcome} onValueChange={(v) => updateForm('outcome', v)}>
                  <SelectTrigger><SelectValue placeholder="Select outcome" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Recovered">Recovered</SelectItem>
                    <SelectItem value="Recovering">Recovering</SelectItem>
                    <SelectItem value="Not_Recovered">Not Recovered</SelectItem>
                    <SelectItem value="Fatal">Fatal</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Event Description (Objective, Factual Language) *</Label>
              <Textarea
                value={form.eventDescription}
                onChange={(e) => updateForm('eventDescription', e.target.value)}
                rows={3}
                placeholder="Describe the event using objective clinical terminology..."
              />
              {!termCheck.isClean && (
                <Alert className="bg-red-50 border-red-200 mt-2">
                  <AlertDescription className="text-xs text-red-800">{termCheck.message}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label>Veterinarian Assessment</Label>
              <Textarea
                value={form.vetAssessment}
                onChange={(e) => updateForm('vetAssessment', e.target.value)}
                rows={2}
                placeholder="Your clinical assessment of the event..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.serious}
                  onChange={(e) => updateForm('serious', e.target.checked)}
                  className="h-4 w-4"
                />
                <Label className="font-normal text-sm">Serious Adverse Event</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.expected}
                  onChange={(e) => updateForm('expected', e.target.checked)}
                  className="h-4 w-4"
                />
                <Label className="font-normal text-sm">Expected / Listed in Protocol</Label>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Digital Signature (type full name) *</Label>
              <Input value={form.digitalSignature} onChange={(e) => updateForm('digitalSignature', e.target.value)} placeholder={`${vetName}`} />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !termCheck.isClean || !form.eventDescription || !form.severity || !form.causality || !form.actionTaken || !form.digitalSignature}
              className="w-full bg-red-700 hover:bg-red-800"
              type="button"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Adverse Event Report'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
