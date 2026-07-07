import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Fallback values for local testing to prevent runtime crash if keys are not set yet
const activeUrl = supabaseUrl || 'https://placeholder-project.supabase.co';
const activeAnonKey = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(activeUrl, activeAnonKey);
