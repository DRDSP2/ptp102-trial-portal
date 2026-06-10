import { useCallback, useEffect, useState } from 'react';

type ActionConfig = {
  name: string;
  type: 'SQL' | 'MongoDB' | 'HTTP';
  config: unknown;
};

type ActionFactory = () => ActionConfig;

const LOCAL_ADMIN = {
  id: 1,
  email: 'drdsp@pm.me',
  password_hash: 'PTP102',
  full_name: 'Admin User',
};

type LocalPatientParams = {
  horseName?: string;
  age?: number;
  breed?: string;
  weight?: number;
  sex?: string;
  ownerName?: string;
  ownerContact?: string;
  enrollmentDate?: string;
  trialStatus?: string;
  screeningStatus?: 'pending_screening' | 'approved' | 'rejected';
  screeningNotes?: string | null;
  screenedBy?: string | null;
  screenedAt?: string | null;
  eligibilityVerified?: boolean;
  consentDate?: string | null;
  digitalPulse?: string | null;
  hoofWallTemperature?: string | null;
  coronaryBandCondition?: string | null;
  hoofTesterResponse?: string | null;
  stance?: string | null;
  gait?: string | null;
  enrollmentHeartRate?: number | null;
  enrollmentRespiratoryRate?: number | null;
  enrollmentTemperature?: number | null;
  bodyConditionScore?: number | null;
  profilePictureUrl?: string | null;
};

type LocalPatient = {
  id: number;
  horse_name: string;
  age: number;
  breed: string;
  weight: number;
  sex: string;
  owner_name: string;
  owner_contact: string;
  enrollment_date: string;
  trial_status: string;
  screening_status: 'pending_screening' | 'approved' | 'rejected';
  screening_notes: string | null;
  screened_by: string | null;
  screened_at: string | null;
  eligibility_verified: boolean;
  consent_date: string | null;
  digital_pulse?: string | null;
  hoof_wall_temperature?: string | null;
  coronary_band_condition?: string | null;
  hoof_tester_response?: string | null;
  stance?: string | null;
  gait?: string | null;
  enrollment_heart_rate?: number | null;
  enrollment_respiratory_rate?: number | null;
  enrollment_temperature?: number | null;
  body_condition_score?: number | null;
  profile_picture_url?: string | null;
  created_at: string;
  updated_at: string;
};

const localPatients: LocalPatient[] = [];

function createLocalPatient(params: LocalPatientParams = {}) {
  const now = new Date().toISOString();
  const patient: LocalPatient = {
    id: localPatients.length + 1,
    horse_name: params.horseName ?? '',
    age: params.age ?? 0,
    breed: params.breed ?? '',
    weight: params.weight ?? 0,
    sex: params.sex ?? '',
    owner_name: params.ownerName ?? '',
    owner_contact: params.ownerContact ?? '',
    enrollment_date: params.enrollmentDate ?? now.slice(0, 10),
    trial_status: params.trialStatus ?? 'screening',
    screening_status: params.screeningStatus ?? 'pending_screening',
    screening_notes: params.screeningNotes ?? null,
    screened_by: params.screenedBy ?? null,
    screened_at: params.screenedAt ?? null,
    eligibility_verified: params.eligibilityVerified ?? false,
    consent_date: params.consentDate ?? null,
    digital_pulse: params.digitalPulse ?? null,
    hoof_wall_temperature: params.hoofWallTemperature ?? null,
    coronary_band_condition: params.coronaryBandCondition ?? null,
    hoof_tester_response: params.hoofTesterResponse ?? null,
    stance: params.stance ?? null,
    gait: params.gait ?? null,
    enrollment_heart_rate: params.enrollmentHeartRate ?? null,
    enrollment_respiratory_rate: params.enrollmentRespiratoryRate ?? null,
    enrollment_temperature: params.enrollmentTemperature ?? null,
    body_condition_score: params.bodyConditionScore ?? null,
    profile_picture_url: params.profilePictureUrl ?? null,
    created_at: now,
    updated_at: now,
  };

  localPatients.push(patient);
  return patient;
}

createLocalPatient({
  horseName: 'Copper Sunset',
  age: 13,
  breed: 'Quarter Horse',
  weight: 512,
  sex: 'Gelding',
  ownerName: 'Nicole Taylor',
  ownerContact: '555-0115',
  enrollmentDate: '2025-11-01',
  trialStatus: 'screening',
  screeningStatus: 'pending_screening',
  eligibilityVerified: true,
  consentDate: '2025-11-01',
  digitalPulse: 'Bounding',
  hoofWallTemperature: 'Warm',
  coronaryBandCondition: 'Mild swelling',
  hoofTesterResponse: 'Positive forefeet',
  stance: 'Camped out',
  gait: 'Reluctant',
  enrollmentHeartRate: 46,
  enrollmentRespiratoryRate: 18,
  enrollmentTemperature: 38.1,
  bodyConditionScore: 5,
});

createLocalPatient({
  horseName: 'Ocean Breeze',
  age: 6,
  breed: 'Arabian',
  weight: 425.5,
  sex: 'Mare',
  ownerName: 'Brandon Moore',
  ownerContact: '555-0116',
  enrollmentDate: '2025-11-02',
  trialStatus: 'screening',
  screeningStatus: 'pending_screening',
  eligibilityVerified: false,
});

function buildLocalCaseData(patient: LocalPatient) {
  return {
    ...patient,
    unique_id: `PTP-102-${String(patient.id).padStart(3, '0')}`,
    protocol_start_time: patient.trial_status === 'enrolled' ? patient.updated_at : null,
    treatments: [],
    clinical_notes: [],
    assessments: [],
    lab_results: [],
  };
}

function getActionName(actionName: ActionFactory | string) {
  return typeof actionName === 'function' ? actionName().name : actionName;
}

export function action(name: string, type: 'SQL' | 'MongoDB' | 'HTTP', config: unknown): ActionConfig {
  return { name, type, config };
}

export function useData(_prop: string, propDefault?: unknown) {
  return propDefault;
}

export function useLoadAction(actionName: ActionFactory | string, defaultValue: unknown[] = [], _params?: unknown) {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [error] = useState<Error | null>(null);
  const paramsKey = JSON.stringify(_params ?? null);

  useEffect(() => {
    const name = getActionName(actionName);
    if (name === 'loadPatients') {
      const loadParams = _params as { status?: string | null } | undefined;
      const status = loadParams?.status;
      const patients = status && status !== 'all'
        ? localPatients.filter((patient) => patient.trial_status === status || patient.screening_status === status)
        : localPatients;
      setData(patients as unknown[]);
      setLoading(false);
      return;
    }

    if (name === 'loadPatientCaseData' || name === 'loadCompletePatientTrialData') {
      const loadParams = _params as { patientId?: number | null } | undefined;
      const patient = localPatients.find((item) => item.id === Number(loadParams?.patientId));
      setData(patient ? [buildLocalCaseData(patient)] as unknown[] : []);
      setLoading(false);
      return;
    }

    setData(defaultValue);
    setLoading(false);
  }, [actionName, defaultValue, paramsKey]);

  const refresh = useCallback(async () => {
    const name = getActionName(actionName);
    if (name === 'loadPatients') {
      const loadParams = _params as { status?: string | null } | undefined;
      const status = loadParams?.status;
      const patients = status && status !== 'all'
        ? localPatients.filter((patient) => patient.trial_status === status || patient.screening_status === status)
        : localPatients;
      setData(patients as unknown[]);
      return patients;
    }

    if (name === 'loadPatientCaseData' || name === 'loadCompletePatientTrialData') {
      const loadParams = _params as { patientId?: number | null } | undefined;
      const patient = localPatients.find((item) => item.id === Number(loadParams?.patientId));
      const caseData = patient ? [buildLocalCaseData(patient)] : [];
      setData(caseData as unknown[]);
      return caseData;
    }

    console.info(`Local preview skipped data load for ${name}.`);
    setData(defaultValue);
    return defaultValue;
  }, [actionName, defaultValue, paramsKey]);

  return [data, loading, error, refresh] as const;
}

export function useMutateAction(actionName: ActionFactory | string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (params?: unknown) => {
      setLoading(true);
      setError(null);
      try {
        const name = getActionName(actionName);
        console.info(`Local preview skipped mutation for ${name}.`);

        if (name === 'adminLogin') {
          const loginParams = params as { email?: string; password?: string } | undefined;
          const email = loginParams?.email?.toLowerCase().trim();
          const password = loginParams?.password ?? '';

          if (email === LOCAL_ADMIN.email && password === LOCAL_ADMIN.password_hash) {
            return [LOCAL_ADMIN];
          }
        }

        if (name === 'createPatient') {
          return [createLocalPatient(params as LocalPatientParams)];
        }

        if (name === 'deletePatient') {
          const deleteParams = params as { patientId?: number } | undefined;
          const index = localPatients.findIndex((patient) => patient.id === deleteParams?.patientId);
          if (index >= 0) {
            return localPatients.splice(index, 1);
          }
          return [];
        }

        if (name === 'approvePatientScreening' || name === 'rejectPatientScreening') {
          const screeningParams = params as { patientId?: number; adminEmail?: string; notes?: string | null } | undefined;
          const patient = localPatients.find((item) => item.id === screeningParams?.patientId);
          if (!patient) {
            return [];
          }

          const now = new Date().toISOString();
          patient.screening_status = name === 'approvePatientScreening' ? 'approved' : 'rejected';
          patient.trial_status = name === 'approvePatientScreening' ? 'enrolled' : 'withdrawn';
          patient.screening_notes = screeningParams?.notes ?? null;
          patient.screened_by = screeningParams?.adminEmail ?? LOCAL_ADMIN.email;
          patient.screened_at = now;
          patient.updated_at = now;
          return [patient];
        }

        return [];
      } finally {
        setLoading(false);
      }
    },
    [actionName],
  );

  return [mutate, loading, error] as const;
}

export function triggerEvent(param?: unknown) {
  console.info('Local preview skipped triggerEvent.', param);
}
