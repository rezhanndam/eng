import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'documents';

export const isCloudStorage = Boolean(url && anonKey);

export const supabase = isCloudStorage ? createClient(url, anonKey) : null;