import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ChangePasswordModalProps = {
  open: boolean;
  forced: boolean;
  onClose: () => void;
};

const MIN_LENGTH = 8;

export function ChangePasswordModal({ open, forced, onClose }: ChangePasswordModalProps) {
  const { changePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setPassword('');
      setConfirm('');
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (password.length < MIN_LENGTH) {
      setError(`Password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await changePassword(password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !forced) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => forced && e.preventDefault()}
        onInteractOutside={(e) => forced && e.preventDefault()}
        hideClose={forced}
      >
        <DialogHeader>
          <DialogTitle>{forced ? 'Set a new password' : 'Change password'}</DialogTitle>
          <DialogDescription>
            {forced
              ? 'For security, you must set a new password before continuing.'
              : 'Update the password for your consultant account.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label htmlFor="cpw-new">New password</Label>
            <Input
              id="cpw-new"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cpw-confirm">Confirm new password</Label>
            <Input
              id="cpw-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {!forced && (
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : 'Save new password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
