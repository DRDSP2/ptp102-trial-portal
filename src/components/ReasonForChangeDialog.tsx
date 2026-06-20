import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';

type ReasonForChangeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  fieldLabel?: string;
  testIdPrefix?: string;
  onConfirm: (reason: string) => void;
  onCancel?: () => void;
  isLoading?: boolean;
};

export function ReasonForChangeDialog({
  open,
  onOpenChange,
  title = 'Reason for Change Required',
  description = 'This is a critical field. FDA 21 CFR Part 11 requires a documented reason before modifying this record.',
  fieldLabel = 'Reason for change',
  testIdPrefix = 'reason-for-change',
  onConfirm,
  onCancel,
  isLoading = false,
}: ReasonForChangeDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('A reason is required to continue.');
      return;
    }
    setError(null);
    onConfirm(trimmed);
    setReason('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setReason('');
    setError(null);
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-lg" data-testid={`${testIdPrefix}-dialog`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reason-for-change">{fieldLabel} *</Label>
            <Textarea
              id="reason-for-change"
              data-testid={`${testIdPrefix}-input`}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Corrected data entry error per source document verification."
              rows={4}
              aria-invalid={!!error}
              disabled={isLoading}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} data-testid={`${testIdPrefix}-cancel`} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} data-testid={`${testIdPrefix}-confirm`} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Confirm Change'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
