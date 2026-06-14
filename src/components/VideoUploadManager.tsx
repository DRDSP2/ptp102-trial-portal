import { useRef, useState } from 'react';
import { useMutateAction } from '@uibakery/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Video, X, AlertCircle, Upload, FileCheck, Info, Loader2 } from 'lucide-react';
import addClinicalNoteAction from '@/actions/addClinicalNote';
import { useSecureUpload } from '@/hooks/useSecureUpload';
import { useSecureDownloadUrl } from '@/hooks/useSecureDownloadUrl';

type UploadedVideoInfo = {
  path: string;
  name: string;
  size: number;
  mimeType: string;
};

type VideoUploadManagerProps = {
  patientId: number;
  protocolHour: number | null;
  veterinarianName: string;
  onSuccess: () => void;
};

export function VideoUploadManager({ patientId, protocolHour, veterinarianName, onSuccess }: VideoUploadManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedVideoInfo | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [addNote] = useMutateAction(addClinicalNoteAction);

  const { upload, isUploading } = useSecureUpload({
    category: 'gait-video',
    entityType: 'patients',
    entityId: patientId,
  });

  const { signedUrl } = useSecureDownloadUrl(uploadedFile?.path ?? null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSaveSuccess(false);

    try {
      const path = await upload(file);
      setUploadedFile({
        path,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      });
      setShowUploader(false);
      setShowGuidelines(true);
    } catch (err) {
      console.error('Video upload failed:', err);
      setError(err instanceof Error ? err.message : 'Video upload failed. Please try again or use a smaller file (max 500MB).');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveVideo = () => {
    setUploadedFile(null);
    setShowGuidelines(false);
    setError(null);
    setSaveSuccess(false);
  };

  const handleSaveToRecord = async () => {
    if (!uploadedFile) return;
    setIsSaving(true);
    setError(null);

    try {
      const params = {
        patientId,
        veterinarianName,
        noteType: 'video_assessment',
        noteContent: `Video uploaded: ${uploadedFile.name}`,
        protocolHour: protocolHour ?? null,
        videoUrl: uploadedFile.path,
        videoFileName: uploadedFile.name,
        videoUploadedAt: new Date().toISOString(),
      };

      await addNote(params);
      setSaveSuccess(true);
      setUploadedFile(null);
      setShowGuidelines(false);
      onSuccess();
    } catch (err) {
      console.error('Failed to save video record:', err);
      setError('Video uploaded to secure storage but failed to save to patient record. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Video className="h-5 w-5 text-blue-600" />
          Upload New Video
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {saveSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <FileCheck className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Video saved to patient record successfully.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="gap-1 text-blue-700 hover:text-blue-900 hover:bg-blue-100"
          >
            <Info className="h-4 w-4" />
            {showGuidelines ? 'Hide' : 'Show'} Recording Guidelines
          </Button>
        </div>

        {showGuidelines && (
          <Alert className="bg-white border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm space-y-2">
              <p className="font-semibold text-blue-900">Video Upload Guidelines</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 text-xs ml-2">
                <li><strong>Format:</strong> MP4 or MOV, minimum 720p, 30fps</li>
                <li><strong>Size limit:</strong> 500MB per file</li>
                <li><strong>Duration:</strong> Minimum 10 seconds, 2 complete gait cycles</li>
                <li><strong>Camera:</strong> Side view, 15-20 feet from horse, steady shot</li>
                <li><strong>Surface:</strong> Flat, even ground preferred</li>
                <li><strong>Lighting:</strong> Good natural light, avoid harsh shadows</li>
              </ul>
              <p className="text-xs text-blue-700 pt-1">
                Videos are uploaded to secure private storage and linked to this patient record. Admin can request a signed download URL for external analysis.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {!showUploader && !uploadedFile && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowUploader(true)}
            className="gap-2 w-full bg-white"
            disabled={isSaving || isUploading}
          >
            <Upload className="h-4 w-4" />
            Select or Record Video
          </Button>
        )}

        {showUploader && !uploadedFile && (
          <div className="border rounded-lg p-3 bg-white space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isUploading ? 'Uploading...' : 'Choose or Record Video'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowUploader(false)}
              className="w-full"
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>
        )}

        {uploadedFile && (
          <div className="border rounded-lg p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Video className="h-5 w-5 text-blue-600 shrink-0" />
                <span className="text-sm font-medium truncate">{uploadedFile.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  ({formatFileSize(uploadedFile.size)})
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveVideo}
                disabled={isSaving}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {signedUrl ? (
              <video
                src={signedUrl}
                controls
                className="w-full rounded-md max-h-[240px] bg-black"
                preload="metadata"
              />
            ) : (
              <div className="w-full h-[160px] flex items-center justify-center bg-slate-100 rounded-md">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            <Button
              onClick={handleSaveToRecord}
              disabled={isSaving || !signedUrl}
              className="w-full"
              type="button"
            >
              {isSaving ? 'Saving to Record...' : 'Save Video to Patient Record'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
