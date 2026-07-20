import { useRef, useState } from 'react';
import { useMutateAction } from '@uibakery/data';
import addClinicalNoteAction from '@/actions/addClinicalNote';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Zap, Video, X, Info, Loader2, AlertCircle } from 'lucide-react';
import { useSecureUpload } from '@/hooks/useSecureUpload';
import { useSecureDownloadUrl } from '@/hooks/useSecureDownloadUrl';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { sendWhatsAppNotification } from '@/utils/whatsappNotifications';

type UploadedVideoInfo = {
  path: string;
  name: string;
  size: number;
  mimeType: string;
};

type UploadedOcrDocumentInfo = {
  path: string;
  name: string;
  size: number;
  mimeType: string;
};

type QuickAddNoteProps = {
  patientId: number;
  protocolHour: number | null;
  onSuccess: () => void;
};

export function QuickAddNote({ patientId, protocolHour, onSuccess }: QuickAddNoteProps) {
  const auth = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const [noteType, setNoteType] = useState('observation');
  const [noteContent, setNoteContent] = useState('');
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideoInfo | null>(null);
  const [uploadedOcrDocument, setUploadedOcrDocument] = useState<UploadedOcrDocumentInfo | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addNote, isSubmitting] = useMutateAction(addClinicalNoteAction);

  const { upload, isUploading } = useSecureUpload({
    category: 'patient-media',
    entityType: 'patients',
    entityId: patientId,
  });

  const { upload: uploadOcrDocument, isUploading: isUploadingOcrDocument } = useSecureUpload({
    category: 'patient-note-docs',
    entityType: 'clinical_notes',
    entityId: patientId,
  });

  const { signedUrl } = useSecureDownloadUrl(uploadedVideo?.path ?? null);
  const { signedUrl: docSignedUrl } = useSecureDownloadUrl(uploadedOcrDocument?.path ?? null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      const path = await upload(file);
      setUploadedVideo({
        path,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      });
      setShowUploader(false);
      setShowGuidelines(true);
    } catch (err) {
      console.error('Video upload failed:', err);
      setError(err instanceof Error ? err.message : 'Video upload failed. Please try again or use a smaller file.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleOcrFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      const path = await uploadOcrDocument(file);
      setUploadedOcrDocument({
        path,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      });
      if (!noteContent.trim()) {
        setNoteContent(`Document uploaded: ${file.name}`);
      }
    } catch (err) {
      console.error('Document upload failed:', err);
      setError(err instanceof Error ? err.message : 'Document upload failed. Please try again with a PDF, image, or spreadsheet.');
    } finally {
      if (ocrInputRef.current) {
        ocrInputRef.current.value = '';
      }
    }
  };

  const handleRemoveVideo = () => {
    setUploadedVideo(null);
    setShowGuidelines(false);
    setError(null);
  };

  const handleRemoveOcrDocument = () => {
    setUploadedOcrDocument(null);
    setError(null);
  };

  const handleQuickAdd = async () => {
    if (!noteContent.trim() && !uploadedVideo && !uploadedOcrDocument) {
      return;
    }

    setError(null);

    try {
      const params = {
        patientId,
        veterinarianName: auth.email ?? 'Unknown',
        noteType,
        noteContent: noteContent.trim() || (uploadedOcrDocument ? `Document uploaded: ${uploadedOcrDocument.name}` : `Video uploaded: ${uploadedVideo?.name}`),
        protocolHour: protocolHour ?? null,
        videoUrl: uploadedVideo?.path ?? null,
        videoFileName: uploadedVideo?.name ?? null,
        videoUploadedAt: uploadedVideo ? new Date().toISOString() : null,
        ocrDocumentUrl: uploadedOcrDocument?.path ?? null,
        ocrDocumentFileName: uploadedOcrDocument?.name ?? null,
        ocrDocumentMimeType: uploadedOcrDocument?.mimeType ?? null,
        ocrExtractedText: null,
        ocrProcessedAt: null,
      };

      await addNote(params);

      sendWhatsAppNotification({
        activityType: 'Clinical Note Added',
        vetName: auth.email ?? 'Unknown Vet',
        patientId,
        details: {
          'Note Type': noteType,
          'Note': noteContent.trim().slice(0, 150),
          'Video': uploadedVideo?.name ?? null,
          'Attached Document': uploadedOcrDocument?.name ?? null,
        },
      });

      supabase.functions.invoke('send-email', {
        body: {
          to: 'drdsp@pm.me',
          subject: `[PTP-102] Note added — Patient #${patientId}`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #6b7f3a;">Clinical Note Added</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 6px; font-weight: bold;">Patient:</td><td style="padding: 6px;">#${patientId}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Vet:</td><td style="padding: 6px;">${auth.email ?? 'Unknown'}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Note Type:</td><td style="padding: 6px;">${noteType}</td></tr>
            </table>
          </div>`,
        },
      }).catch((err: unknown) => console.error('Admin alert failed (non-critical):', err));

      setNoteContent('');
      setNoteType('observation');
      handleRemoveVideo();
      handleRemoveOcrDocument();
      onSuccess();
    } catch (error) {
      console.error('Quick add note error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
    }
  };

  const quickTemplates = [
    'Patient ambulatory and comfortable',
    'No adverse reactions observed',
    'Digital pulse remains elevated',
    'Increased comfort noted since last assessment',
    'Video: Horse walking assessment',
    'Video: Mobility evaluation',
  ];

  const handleTemplateClick = (template: string) => {
    setNoteContent(template);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Quick Add Note
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Select value={noteType} onValueChange={setNoteType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="observation">Observation</SelectItem>
            <SelectItem value="adverse_event">Adverse Event</SelectItem>
            <SelectItem value="protocol_note">Protocol Note</SelectItem>
            <SelectItem value="communication">Communication</SelectItem>
            <SelectItem value="video_assessment">Video Assessment</SelectItem>
          </SelectContent>
        </Select>

        <Textarea
          placeholder="Type your note here..."
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          rows={4}
          disabled={isSubmitting}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Video (Gait Assessment)</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowGuidelines(!showGuidelines)}
                className="h-6 w-6 p-0"
              >
                <Info className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {showGuidelines && (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-info" />
              <AlertDescription className="text-sm space-y-2">
                <p className="font-semibold text-blue-800">Sleip AI Gait Assessment Guidelines:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs ml-2">
                  <li><strong>Camera Position:</strong> Side view, perpendicular to horse's path of travel</li>
                  <li><strong>Distance:</strong> 15-20 feet from the horse to capture full body in frame</li>
                  <li><strong>Surface:</strong> Flat, even ground (concrete or asphalt preferred)</li>
                  <li><strong>Movement:</strong> Horse walking in straight line at consistent speed</li>
                  <li><strong>Capture:</strong> Minimum 10 seconds, showing at least 2 complete gait cycles per limb</li>
                  <li><strong>Handler:</strong> Keep handler on far side of horse, minimally visible</li>
                  <li><strong>Frame:</strong> Full body from head to tail, hooves to withers visible</li>
                  <li><strong>Lighting:</strong> Good natural light, avoid harsh shadows</li>
                  <li><strong>Stability:</strong> Hold camera steady or use tripod, avoid panning</li>
                  <li><strong>Format:</strong> MP4 or MOV, minimum 720p resolution, 30fps or higher</li>
                </ul>
                <p className="text-xs text-muted-foreground pt-2">
                  <strong>Note:</strong> These videos will be uploaded to secure private storage and linked to this patient record.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {!showUploader && !uploadedVideo && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowUploader(true)}
              className="gap-2 w-full"
              disabled={isSubmitting || isUploading}
            >
              <Video className="h-4 w-4" />
              Record or Upload Video
            </Button>
          )}

          {showUploader && !uploadedVideo && (
            <div className="border rounded-lg p-3">
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
                size="sm"
                className="gap-2 w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                {isUploading ? 'Uploading...' : 'Choose or Record Video'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowUploader(false)}
                className="mt-2 w-full"
                disabled={isUploading}
              >
                Cancel
              </Button>
            </div>
          )}

          {uploadedVideo && (
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium truncate max-w-[200px]">{uploadedVideo.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(uploadedVideo.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveVideo}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {signedUrl ? (
                <video
                  src={signedUrl}
                  controls
                  className="w-full rounded-md max-h-[200px]"
                />
              ) : (
                <div className="w-full h-[160px] flex items-center justify-center bg-slate-100 rounded-md">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Attached Document</p>
            <p className="text-xs text-muted-foreground">Upload referral letters, consent forms, lab printouts, or spreadsheets (PDF, image, Word, Excel, CSV — up to 50 MB). For X-ray images, use the X-Ray portal.</p>
          </div>

          <input
            ref={ocrInputRef}
            type="file"
            accept=".pdf,.csv,.doc,.docx,.xls,.xlsx,image/*"
            className="hidden"
            onChange={handleOcrFileSelect}
            disabled={isUploadingOcrDocument}
          />

          {!uploadedOcrDocument ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 w-full"
              onClick={() => ocrInputRef.current?.click()}
              disabled={isSubmitting || isUploadingOcrDocument}
            >
              {isUploadingOcrDocument ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {isUploadingOcrDocument ? 'Uploading...' : 'Upload Document'}
            </Button>
          ) : (
            <div className="space-y-2 rounded-md bg-muted/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate text-sm font-medium">{uploadedOcrDocument.name}</span>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={handleRemoveOcrDocument} disabled={isSubmitting}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  ({(uploadedOcrDocument.size / 1024 / 1024).toFixed(2)} MB)
                </span>
                {docSignedUrl ? (
                  <a
                    href={docSignedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-primary underline underline-offset-2"
                  >
                    Open document
                  </a>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
          )}
        </div>

        {!noteContent.trim() && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Quick templates:</p>
            <div className="grid grid-cols-1 gap-2">
              {quickTemplates.map((template, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTemplateClick(template)}
                  className="justify-start text-left h-auto py-2 px-3"
                  disabled={isSubmitting}
                >
                  <FileText className="h-3 w-3 mr-2 shrink-0" />
                  {template}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleQuickAdd}
          disabled={isSubmitting || (!noteContent.trim() && !uploadedVideo && !uploadedOcrDocument)}
          className="w-full"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Zap className="h-4 w-4 mr-2" />
          )}
          {isSubmitting ? 'Saving...' : 'Add Note'}
        </Button>
      </CardContent>
    </Card>
  );
}
