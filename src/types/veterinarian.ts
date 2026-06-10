export type Veterinarian = {
  id: number;
  full_name: string;
  email: string;
  license_number: string;
  hospital_affiliation: string;
  tc_accepted: boolean;
  tc_accepted_at: string | null;
  signature_text: string | null;
  verification_status?: string;
  approved_at?: string | null;
  approved_by?: string | null;
  last_login?: string | null;
  created_at: string;
  updated_at: string;
};
