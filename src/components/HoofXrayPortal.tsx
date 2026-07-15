import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useLoadAction, useMutateAction } from '@uibakery/data';
import { useAuth } from '@/context/AuthContext';
import { useSecureUpload } from '@/hooks/useSecureUpload';
import { supabase } from '@/lib/supabase/client';
import { fetchAnalyze } from '@/lib/computeApi';
import loadHoofXraysAction from '@/actions/loadHoofXrays';
import loadPatientsAction from '@/actions/loadPatients';
import createHoofXrayAction from '@/actions/createHoofXray';
import createXrayLandmarkAction from '@/actions/createXrayLandmark';
import createXrayMeasurementAction from '@/actions/createXrayMeasurement';
import updateHoofXrayAnalysisAction from '@/actions/updateHoofXrayAnalysis';
import createAuditLogAction from '@/actions/createAuditLog';
import { X, Upload, Activity, ChevronRight, Image as ImageIcon, Save, Loader2, Ruler, AlertTriangle } from 'lucide-react';
import { SIGNED_URL_TTL_SECONDS, bucketFromPath } from '@/lib/upload/config';

const REQUIRED_LANDMARKS = [
  'coronary_band',
  'toe_tip',
  'heel_ground',
  'toe_ground',
  'extensor_process',
  'p3_tip',
  'p3_heel',
  'p2_pastern_top',
  'p2_pastern_bottom',
];

type Landmark = { name: string; x: number; y: number };
type Measurement = { metric: string; value: number; unit: string; severity: string; deviation_z: number };
type Analysis = { overall_severity: string; score: number; findings: Record<string, any>; recommendations: string[] };

type XrayRecord = {
  id: number;
  patient_id: number;
  hoof_side: string;
  file_path: string;
  original_file_name: string;
  image_url?: string | null;
  taken_date?: string | null;
  pixel_spacing_x?: number | null;
  pixel_spacing_y?: number | null;
  analysis_status?: string | null;
  overall_severity?: string | null;
  score?: number | null;
  created_at: string;
  horse_name?: string;
  enrolled_by_vet_email?: string;
};

const toArray = <T,>(value: T[] | null | undefined): T[] => Array.isArray(value) ? value : [];

const getDisplayText = (value: unknown, fallback = '-'): string => {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
};

export function HoofXrayPortal({ patientId }: { patientId?: number }) {
  const auth = useAuth();
  const isAdmin = auth.role === 'admin' || auth.role === 'consultant';
  const [selectedPatient, setSelectedPatient] = useState<number | null>(patientId ?? null);
  const [xrayList, setXrayList] = useState<XrayRecord[]>([]);
  const [selectedXray, setSelectedXray] = useState<XrayRecord | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [activeLandmark, setActiveLandmark] = useState<string>(REQUIRED_LANDMARKS[0]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [patients] = useLoadAction(loadPatientsAction, [], { status: '' });
  const [xraysData, , , refreshXrays] = useLoadAction(
    loadHoofXraysAction,
    [selectedPatient, auth.email, isAdmin],
    { patientId: selectedPatient, isAdmin, userEmail: auth.email }
  );

  useEffect(() => {
    setXrayList(toArray<XrayRecord>(xraysData as XrayRecord[] | null | undefined));
  }, [xraysData]);

  const patientList = toArray<any>(patients as any[] | null | undefined);

  const [createHoofXray] = useMutateAction(createHoofXrayAction);
  const [createLandmark] = useMutateAction(createXrayLandmarkAction);
  const [createMeasurement] = useMutateAction(createXrayMeasurementAction);
  const [updateAnalysis] = useMutateAction(updateHoofXrayAnalysisAction);
  const [createAuditLog] = useMutateAction(createAuditLogAction);
  const { upload: uploadFile, isUploading } = useSecureUpload({
    category: 'patient-media',
    entityType: 'patients',
    entityId: selectedPatient ?? 0,
  });

  const getSignedUrl = useCallback(async (filePath: string) => {
    const bucket = bucketFromPath(filePath);
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);
    if (error || !data) throw new Error(error?.message || 'Failed to get signed URL');
    return data.signedUrl;
  }, []);

  const openXray = useCallback(async (xray: XrayRecord) => {
    setSelectedXray(xray);
    setLandmarks([]);
    setMeasurements([]);
    setAnalysis(null);
    setError(null);
    try {
      const url = await getSignedUrl(xray.file_path);
      setSignedUrl(url);
      await createAuditLog({
        userId: auth.user?.id ?? null,
        userEmail: auth.email,
        userRole: auth.role,
        action: 'VIEW',
        entityType: 'hoof_xrays',
        entityId: xray.id,
        fieldName: 'image_url',
        oldValue: null,
        newValue: JSON.stringify({ xrayId: xray.id, filePath: xray.file_path }),
        reasonForChange: 'User opened X-ray for viewing',
        ipAddress: null,
        userAgent: navigator.userAgent,
        sessionId: null,
      }).catch(() => {});
    } catch (e) {
      setError('Failed to load image: ' + (e as Error).message);
    }
  }, [getSignedUrl, createAuditLog, auth]);

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    const img = imageRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const clamped = { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
    setLandmarks((prev) => {
      const filtered = prev.filter((l) => l.name !== activeLandmark);
      return [...filtered, { name: activeLandmark, x: clamped.x, y: clamped.y }];
    });
  }, [activeLandmark]);

  const drawLandmarks = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const toPx = (lm: Landmark) => ({ x: (lm.x / 100) * canvas.width, y: (lm.y / 100) * canvas.height });

    const pairs = [
      ['coronary_band', 'toe_tip'],
      ['coronary_band', 'heel_ground'],
      ['toe_ground', 'heel_ground'],
      ['extensor_process', 'p3_tip'],
      ['p3_heel', 'p3_tip'],
      ['p2_pastern_top', 'p2_pastern_bottom'],
    ];
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.lineWidth = 2;
    for (const [a, b] of pairs) {
      const la = landmarks.find((l) => l.name === a);
      const lb = landmarks.find((l) => l.name === b);
      if (la && lb) {
        const pa = toPx(la);
        const pb = toPx(lb);
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }
    }

    for (const lm of landmarks) {
      const p = toPx(lm);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '12px sans-serif';
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.strokeText(lm.name, p.x + 8, p.y - 8);
      ctx.fillText(lm.name, p.x + 8, p.y - 8);
    }
  }, [landmarks]);

  useEffect(() => {
    if (imageRef.current && canvasRef.current) {
      drawLandmarks();
    }
  }, [landmarks, drawLandmarks]);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !selectedPatient) return;
    setError(null);
    try {
      const storagePath = await uploadFile(file);
      const url = await getSignedUrl(storagePath);
      const hoofSide = (document.getElementById('hoof-side') as HTMLSelectElement)?.value || 'left';
      const pixelSpacingX = parseFloat((document.getElementById('pixel-spacing-x') as HTMLInputElement)?.value || '0.1');
      const pixelSpacingY = parseFloat((document.getElementById('pixel-spacing-y') as HTMLInputElement)?.value || '0.1');

      const xray = await createHoofXray({
        patientId: selectedPatient,
        hoofSide,
        filePath: storagePath,
        originalFileName: file.name,
        imageUrl: url,
        takenDate: new Date().toISOString().split('T')[0],
        pixelSpacingX,
        pixelSpacingY,
        userId: auth.user?.id ?? null,
        userEmail: auth.email,
      });

      await createAuditLog({
        userId: auth.user?.id ?? null,
        userEmail: auth.email,
        userRole: auth.role,
        action: 'UPLOAD',
        entityType: 'hoof_xrays',
        entityId: xray.id,
        fieldName: 'file_path',
        oldValue: null,
        newValue: JSON.stringify({ storagePath, fileName: file.name, hoofSide }),
        reasonForChange: 'X-ray uploaded via Hoof X-Ray portal',
        ipAddress: null,
        userAgent: navigator.userAgent,
        sessionId: null,
      }).catch(() => {});

      setUploadDialogOpen(false);
      refreshXrays();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const runAnalysis = async () => {
    if (!selectedXray) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAnalyze(landmarks, {
        x: selectedXray.pixel_spacing_x ?? undefined,
        y: selectedXray.pixel_spacing_y ?? undefined,
      });
      setMeasurements(result.measurements);
      setAnalysis(result.analysis);

      for (const lm of landmarks) {
        await createLandmark({ xrayId: selectedXray.id, name: lm.name, x: lm.x, y: lm.y }).catch(() => {});
      }
      for (const m of result.measurements) {
        await createMeasurement({
          xrayId: selectedXray.id,
          metric: m.metric,
          value: m.value,
          unit: m.unit,
          severity: m.severity,
          deviationZ: m.deviation_z,
        }).catch(() => {});
      }
      await updateAnalysis({
        xrayId: selectedXray.id,
        analysisStatus: 'completed',
        overallSeverity: result.analysis.overall_severity,
        score: result.analysis.score,
      }).catch(() => {});

      await createAuditLog({
        userId: auth.user?.id ?? null,
        userEmail: auth.email,
        userRole: auth.role,
        action: 'ANALYZE',
        entityType: 'hoof_xrays',
        entityId: selectedXray.id,
        fieldName: 'analysis_status',
        oldValue: selectedXray.analysis_status || 'pending',
        newValue: JSON.stringify({ status: 'completed', score: result.analysis.score, severity: result.analysis.overall_severity }),
        reasonForChange: 'Hoof X-ray rotation analysis completed',
        ipAddress: null,
        userAgent: navigator.userAgent,
        sessionId: null,
      }).catch(() => {});

      refreshXrays();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity?: string | null) => {
    switch (severity) {
      case 'normal': return 'bg-green-100 text-green-800 border-green-300';
      case 'mild': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'moderate': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'severe': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Hoof X-Ray Portal
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Upload and analyze lateral hoof radiographs for P3 rotation and laminitis assessment
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!patientId && (
              <Select value={selectedPatient?.toString() || 'all'} onValueChange={(v) => setSelectedPatient(v === 'all' ? null : Number(v))}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All patients</SelectItem>
                  {patientList.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {getDisplayText(p?.horse_name, 'Unknown patient')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={() => setUploadDialogOpen(true)} disabled={!selectedPatient}>
              <Upload className="mr-2 h-4 w-4" />
              Upload X-Ray
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list">X-Ray List</TabsTrigger>
              <TabsTrigger value="viewer" disabled={!selectedXray}>Viewer</TabsTrigger>
            </TabsList>
            <TabsContent value="list" className="mt-4">
              {xrayList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No X-rays found. Select a patient and upload one.</div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Horse</TableHead>
                        <TableHead>Side</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {xrayList.map((xray) => (
                        <TableRow key={xray.id}>
                          <TableCell className="font-medium">{getDisplayText(xray?.horse_name, 'Unknown')}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{getDisplayText(xray?.hoof_side, 'Unknown')}</Badge>
                          </TableCell>
                          <TableCell>{xray?.taken_date ? new Date(xray.taken_date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getSeverityColor(xray?.analysis_status === 'completed' ? xray?.overall_severity : null)}>
                              {getDisplayText(xray?.analysis_status, 'pending')}
                            </Badge>
                          </TableCell>
                          <TableCell>{xray?.score ?? '-'}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => openXray(xray)}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            <TabsContent value="viewer" className="mt-4">
              {selectedXray && signedUrl && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="relative border rounded-lg overflow-hidden bg-slate-900 inline-block">
                      <img
                        ref={imageRef}
                        src={signedUrl}
                        alt={`X-ray ${selectedXray.original_file_name}`}
                        className="max-w-full max-h-[600px] object-contain cursor-crosshair"
                        onClick={handleImageClick}
                        onLoad={drawLandmarks}
                      />
                      <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 pointer-events-none"
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {REQUIRED_LANDMARKS.map((name) => {
                        const placed = landmarks.find((l) => l.name === name);
                        return (
                          <Button
                            key={name}
                            variant={activeLandmark === name ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveLandmark(name)}
                            className={placed ? 'border-green-500 text-green-700' : ''}
                          >
                            {name.replace(/_/g, ' ')}
                            {placed && <span className="ml-1 text-xs">✓</span>}
                          </Button>
                        );
                      })}
                      <Button variant="ghost" size="sm" onClick={() => setLandmarks([])} className="text-red-600">
                        <X className="h-4 w-4 mr-1" /> Clear
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Click on the image to place the selected landmark. All landmarks are required for analysis.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={runAnalysis}
                          disabled={landmarks.length < REQUIRED_LANDMARKS.length || loading}
                          className="w-full"
                        >
                          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ruler className="mr-2 h-4 w-4" />}
                          {loading ? 'Analyzing...' : 'Run Analysis'}
                        </Button>
                        {landmarks.length < REQUIRED_LANDMARKS.length && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Place all {REQUIRED_LANDMARKS.length} landmarks ({landmarks.length} placed)
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {measurements.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            Measurements
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-64">
                            <div className="space-y-2">
                              {measurements.map((m) => (
                                <div key={m.metric} className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">{m.metric.replace(/_/g, ' ')}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{m.value} {m.unit}</span>
                                    <Badge variant="outline" className={getSeverityColor(m.severity)}>
                                      {m.severity}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    )}

                    {analysis && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Assessment</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Overall Severity</span>
                            <Badge className={getSeverityColor(analysis.overall_severity)}>
                              {analysis.overall_severity}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Score</span>
                            <span className="font-bold">{analysis.score}/100</span>
                          </div>
                          <Separator />
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Recommendations</p>
                            {analysis.recommendations.map((rec, i) => (
                              <p key={i} className="text-xs text-muted-foreground">• {rec}</p>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload New X-Ray</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Image File</label>
              <input ref={fileInputRef} type="file" accept="image/*" className="mt-1 block w-full text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Hoof Side</label>
              <Select defaultValue="left">
                <SelectTrigger id="hoof-side">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Pixel Spacing X (mm/px)</label>
                <input id="pixel-spacing-x" type="number" step="0.01" defaultValue="0.1" className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Pixel Spacing Y (mm/px)</label>
                <input id="pixel-spacing-y" type="number" step="0.01" defaultValue="0.1" className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
