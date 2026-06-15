import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const c = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function backfill() {
  // Find the seeded test vet
  const { data: vets } = await c.from('veterinarians').select('id, email').eq('email', 'test-vet@ptp102.local');
  if (!vets || vets.length === 0) {
    console.error('Seeded test vet not found');
    process.exit(1);
  }
  const vet = vets[0];
  console.log('Found vet:', vet.id, vet.email);

  // Get all patients with null enrolled_by_vet_email
  const { data: patients, error } = await c
    .from('patients')
    .select('id, unique_id, horse_name, enrolled_by_vet_email')
    .is('enrolled_by_vet_email', null);

  if (error) {
    console.error('Fetch error:', error);
    process.exit(1);
  }

  console.log(`Found ${patients?.length || 0} patients missing enrolled_by_vet_email`);

  // Update each patient
  for (const p of patients || []) {
    const { error: upErr } = await c
      .from('patients')
      .update({ enrolled_by_vet_email: vet.email })
      .eq('id', p.id);
    if (upErr) {
      console.error(`Failed to update ${p.unique_id}:`, upErr);
    } else {
      console.log(`Updated ${p.unique_id} (${p.horse_name}) -> ${vet.email}`);
    }
  }
  console.log('Done.');
}

backfill().catch(console.error);
