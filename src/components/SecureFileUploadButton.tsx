import { useRef, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { useSecureUpload, type UseSecureUploadOptions } from '@/hooks/useSecureUpload';

export type SecureUploadSuccessInfo = {
  path: string;
  name: string;
  size: number;
  mimeType: string;
};

type SecureFileUploadButtonProps = UseSecureUploadOptions & {
  accept?: string;
  capture?: boolean;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
  onUploadSuccess: (info: SecureUploadSuccessInfo) => void;
  onError?: (error: Error) => void;
};

export function SecureFileUploadButton({
  accept,
  capture,
  disabled,
  className,
  children,
  onUploadSuccess,
  onError,
  ...uploadOptions
}: SecureFileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useSecureUpload(uploadOptions);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const path = await upload(file);
      onUploadSuccess({ path, name: file.name, size: file.size, mimeType: file.type });
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        capture={capture}
        className="hidden"
        onChange={handleChange}
        disabled={disabled || isUploading}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className}
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {children ?? 'Upload File'}
      </Button>
    </>
  );
}
