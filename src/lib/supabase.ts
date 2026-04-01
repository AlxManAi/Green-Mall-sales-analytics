import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || 'https://hkotqewhtbkqzhvwajat.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || import.meta.env.VITE_SUPABASE_KEY || 'missing-key';

if (supabaseKey === 'missing-key') {
  console.error('Supabase key is missing! Please add SUPABASE_KEY to your secrets in AI Studio.');
} else if (!supabaseKey.startsWith('eyJ')) {
  console.warn('Supabase key does not look like a standard JWT anon key. If connection fails, check your key format.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
