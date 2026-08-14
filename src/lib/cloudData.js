import { supabase, isCloudStorage } from './supabase';

const TABLE = 'eng_workspace';

export const isCloudData = isCloudStorage;

export async function loadWorkspace() {
  const { data, error } = await supabase.from(TABLE).select('data').eq('id', 1).maybeSingle();
  if (error) throw error;
  return data?.data || null;
}

export async function saveWorkspace(payload) {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: 1, data: payload, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) throw error;
}
