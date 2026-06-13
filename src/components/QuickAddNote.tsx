import { useState, useRef } from 'react';
import { useMutateAction } from '@uibakery/data';
import addClinicalNoteAction from '@/actions/addClinicalNote';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Zap, Video, X, Info, Loader2, AlertCircle } from 'lucide-react';
import { FileUploaderRegular } from '@uploadcare/react-uploader';
import '@uploadcare/react-uploader/core.css';
import { useAuth } from '@/context/AuthContext';

interface UploadcareFileInfo {
  uuid: string;
  name: string;
  size: number;
  cdnUrl: string;
  isImage: boolean;
  mimeType: string;
}

type QuickAddNoteProps = {
  patientId: number;
  protocolHour: number | null;
  onSuccess: () => void;
};

export function QuickAddNote({ patientId, protocolHour, onSuccess }: QuickAddNoteProps) {
  const auth = useAuth();
  const [noteType, setNoteType] = useState('observation');
  const [noteContent, setNoteContent] = useState('');
  const [uploadedVideo, setUploadedVideo] = useState<UploadcareFileInfo | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addNote, isSubmitting] = useMutateAction(addClinicalNoteAction);

  const handleFileUpload = (fileInfo: UploadcareFileInfo) => {
    if (fileInfo.cdnUrl) {
      console.log('Video uploaded to Uploadcare:', fileInfo);
      setUploadedVideo({
        uuid: fileInfo.uuid,
        name: fileInfo.name,
        size: fileInfo.size,
        cdnUrl: fileInfo.cdnUrl,
        isImage: fileInfo.isImage,
        mimeType: fileInfo.mimeType,
      });
      setShowUploader(false);
      setShowGuidelines(true);
      setError(null);
    }
  };

  const handleFileUploadFailed = (errorInfo: any) => {
    console.error('Video upload failed:', errorInfo);
    setError(errorInfo?.message || 'Video upload failed. Please try again or use a smaller file.');
    setShowUploader(false);
  };

  const handleRemoveVideo = () => {
    setUploadedVideo(null);
    setShowGuidelines(false);
    setError(null);
  };

  const handleQuickAdd = async () => {
    console.log('=== handleQuickAdd CALLED ===');
    console.log('patientId:', patientId);
    console.log('noteContent:', noteContent);
    console.log('uploadedVideo:', uploadedVideo?.name);
    
    if (!noteContent.trim() && !uploadedVideo) {
      console.log('VALIDATION FAILED: No content or video');
      return;
    }

    setError(null);

    try {
      const params = {
        patientId,
        veterinarianName: auth.email ?? 'Unknown',
        noteType,
        noteContent: noteContent.trim() || `Video uploaded: ${uploadedVideo?.name}`,
        protocolHour: protocolHour ?? null,
        videoUrl: uploadedVideo?.cdnUrl ?? null,
        videoFileName: uploadedVideo?.name ?? null,
        videoUploadedAt: uploadedVideo ? new Date().toISOString() : null,
      };

      console.log('=== SUBMITTING TO DATABASE ===');
      console.log('Params:', params);

      const result = await addNote(params);
      
      console.log('=== DATABASE SUBMISSION SUCCESS ===');
      console.log('Result:', result);

      setNoteContent('');
      setNoteType('observation');
      handleRemoveVideo();
      console.log('=== CALLING onSuccess ===');
      onSuccess();
    } catch (error) {
      console.error('=== HANDLE QUICK ADD ERROR ===', error);
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
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm space-y-2">
                <p className="font-semibold text-blue-900">Sleip AI Gait Assessment Guidelines:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 text-xs ml-2">
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
                <p className="text-xs text-blue-700 pt-2">
                  <strong>Note:</strong> These videos will be processed through Sleip AI for objective lameness scoring and gait analysis to track treatment response.
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
              disabled={isSubmitting}
            >
              <Video className="h-4 w-4" />
              Record or Upload Video
            </Button>
          )}

          {showUploader && !uploadedVideo && (
            <div className="border rounded-lg p-3">
              <FileUploaderRegular
                pubkey="65522fb5ee7036edf97b"
                classNameUploader="uc-light uc-purple"
                sourceList="local, camera, gdrive, facebook"
                userAgentIntegration="llm-nextjs"
                filesViewMode="grid"
                maxLocalFileSizeBytes={524288000}
                imgOnly={false}
                accept="video/*"
                multiple={false}
                onFileUploadSuccess={handleFileUpload}
                onFileUploadFailed={handleFileUploadFailed}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowUploader(false)}
                className="mt-2 w-full"
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

              <video
                src={uploadedVideo.cdnUrl}
                controls
                className="w-full rounded-md max-h-[200px]"
              />
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
                  variant="outline"
                  size="sm"
                  onClick={() => handleTemplateClick(template)}
                  className="justify-start text-left h-auto py-2"
                  type="button"
                  disabled={isSubmitting}
                >
                  {template.startsWith('Video:') ? (
                    <Video className="h-3 w-3 mr-2 flex-shrink-0" />
                  ) : (
                    <FileText className="h-3 w-3 mr-2 flex-shrink-0" />
                  )}
                  <span className="text-xs">{template}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleQuickAdd}
          disabled={isSubmitting || (!noteContent.trim() && !uploadedVideo)}
          className="w-full"
          type="button"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Add Note'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
