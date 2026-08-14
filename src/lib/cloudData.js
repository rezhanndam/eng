import { supabase, isCloudStorage } from './supabase';

const TABLE = 'workspaces';

export const isCloudData = isCloudStorage;

export async function loadWorkspace(userId) {
  const { data, error } = await supabase.from(TABLE).select('data').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data?.data || null;
}

export async function saveWorkspace(userId, payload) {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ user_id: userId, data: payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) throw error;
}
