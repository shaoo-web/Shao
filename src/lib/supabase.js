import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Fallback to local storage or dummy if not yet configured
const savedUrl = typeof window !== 'undefined' ? localStorage.getItem('THEARA_SUPABASE_URL') : null;
const savedKey = typeof window !== 'undefined' ? localStorage.getItem('THEARA_SUPABASE_KEY') : null;

const finalUrl = supabaseUrl || savedUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || savedKey || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')) ||
  (savedUrl && savedKey)
);

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
