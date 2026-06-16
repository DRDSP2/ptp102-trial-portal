import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import { useSecureUpload } from '@/hooks/useSecureUpload';
import { useSecureDownloadUrl } from '@/hooks/useSecureDownloadUrl';

type UploadedImageInfo = {
  path: string;
  name: string;
  size: number;
  mimeType: string;
};

type HorseImageUploaderProps = {
  patientId: string | number;
  uploadedImage: UploadedImageInfo | null;
  profileUrl?: string;
  showUploader: boolean;
  onToggleUploader: (value: boolean) => void;
  onUploadSuccess: (fileInfo: UploadedImageInfo) => void;
  onRemove: () => void;
};

function isHttpUrl(value?: string): boolean {
  return !!value && /^https?:\/\//.test(value);
}

export function HorseImageUploader({
  patientId,
  uploadedImage,
  profileUrl,
  showUploader,
  onToggleUploader,
  onUploadSuccess,
  onRemove,
}: HorseImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useSecureUpload({
    category: 'patient-media',
    entityType: 'patients',
    entityId: patientId,
  });

  const storagePath = uploadedImage?.path || (profileUrl && !isHttpUrl(profileUrl) ? profileUrl : undefined);
  const { signedUrl, isLoading: isSignedUrlLoading } = useSecureDownloadUrl(storagePath ?? null);

  const imageUrl = uploadedImage?.path ? signedUrl : isHttpUrl(profileUrl) ? profileUrl : signedUrl;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const path = await upload(file);
      onUploadSuccess({
        path,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      });
      onToggleUploader(false);
    } catch (err) {
      console.error('Profile picture upload failed:', err);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 border rounded-lg bg-slate-50">
      {imageUrl ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt="Horse profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onRemove}
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : isSignedUrlLoading ? (
        <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center border-4 border-white shadow-lg">
          <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
        </div>
      ) : (
        <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center border-4 border-white shadow-lg">
          <svg className="h-16 w-16 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z" />
          </svg>
        </div>
      )}

      {!showUploader && !imageUrl && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onToggleUploader(true)}
          className="gap-2"
          disabled={isUploading}
        >
          <Upload className="h-4 w-4" />
          Upload Profile Picture
        </Button>
      )}

      {showUploader && !imageUrl && (
        <div className="w-full">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isUploading ? 'Uploading...' : 'Choose Profile Picture'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onToggleUploader(false)}
            className="mt-2 w-full"
            disabled={isUploading}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
