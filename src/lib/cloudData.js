import { supabase, isCloudStorage } from './supabase';

const TABLE = 'workspaces';

export const isCloudData = isCloudStorage;

export async function loadWorkspace(userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return { data: data?.data || null, updatedAt: data?.updated_at || null };
}

export async function getWorkspaceUpdatedAt(userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.updated_at || null;
}

export async function saveWorkspace(userId, payload, updatedAt = new Date().toISOString()) {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ user_id: userId, data: payload, updated_at: updatedAt }, { onConflict: 'user_id' });
  if (error) throw error;
  return updatedAt;
}

// ============================================================================
// Conflict-free merge. Workspaces are synced as a whole JSONB blob, so a naive
// "last write wins" silently drops items created/edited in another tab/device.
// Instead we merge per item: newest `updatedAt` wins per id, tombstones keep
// deletions from being resurrected by a stale copy, and unions are idempotent.
// ============================================================================

const mergeById = (localItems, remoteItems, key = 'id') => {
  const byKey = new Map();
  for (const item of remoteItems || []) byKey.set(item[key], item);
  for (const item of localItems || []) {
    const existing = byKey.get(item[key]);
    if (!existing) byKey.set(item[key], item);
    else if ((item.updatedAt || '') > (existing.updatedAt || '')) byKey.set(item[key], item);
  }
  return [...byKey.values()];
};

const mergeCategories = (local, remote) => {
  const keys = new Set([...Object.keys(local || {}), ...Object.keys(remote || {})]);
  const merged = {};
  for (const key of keys) {
    const l = Array.isArray(local?.[key]) ? local[key] : [];
    const r = Array.isArray(remote?.[key]) ? remote[key] : [];
    merged[key] = [...new Set([...l, ...r])];
  }
  return merged;
};

const mergeActivity = (local, remote) => {
  const byId = new Map();
  for (const item of remote || []) byId.set(item.id, item);
  for (const item of local || []) if (!byId.has(item.id)) byId.set(item.id, item);
  return [...byId.values()]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 50);
};

const mergeDailyReports = (local, remote, deleted) => {
  const keys = new Set([...Object.keys(local || {}), ...Object.keys(remote || {})]);
  const merged = {};
  for (const key of keys) {
    merged[key] = mergeById(local?.[key], remote?.[key], 'dateVal').filter(
      (e) => !deleted.has(`daily:${key}:${e.dateVal}`)
    );
  }
  return merged;
};

const collectTombstones = (local, remote) => {
  const map = new Map();
  for (const t of [...(local?.deleted || []), ...(remote?.deleted || [])]) {
    if (t && t.type && t.id) {
      const existing = map.get(`${t.type}:${t.id}`);
      if (!existing || (t.ts || '') > (existing.ts || '')) map.set(`${t.type}:${t.id}`, t);
    }
  }
  return map;
};

export function mergeWorkspace(local, remote) {
  const tombMap = collectTombstones(local, remote);
  const deleted = new Set(tombMap.keys());
  const isDeleted = (type, id) => deleted.has(`${type}:${id}`);
  const isProjectGone = (projectId) => deleted.has(`project:${projectId}`);

  const projects = mergeById(local?.projects, remote?.projects, 'id').filter((p) => !isDeleted('project', p.id));
  const tasks = mergeById(local?.tasks, remote?.tasks, 'id').filter((t) => !isProjectGone(t.projectId) && !isDeleted('task', t.id));
  const documents = mergeById(local?.documents, remote?.documents, 'id').filter((d) => !isProjectGone(d.projectId) && !isDeleted('document', d.id));
  const team = mergeById(local?.team, remote?.team, 'id').filter((m) => !isDeleted('member', m.id));
  const categories = mergeCategories(local?.categories, remote?.categories);
  for (const key of Object.keys(categories)) {
    if (isProjectGone(key)) delete categories[key];
  }
  const activity = mergeActivity(local?.activity, remote?.activity);
  const dailyReports = mergeDailyReports(local?.dailyReports, remote?.dailyReports, deleted);

  return {
    projects,
    tasks,
    documents,
    categories,
    activity,
    team,
    dailyReports,
    deleted: [...tombMap.values()].slice(-500),
  };
}

// Read the current remote `updated_at` first. If it still matches what we last
// saw, it is a fast-path upsert. If another device/tab wrote meanwhile, pull
// the remote blob, merge it with ours, push the merge, and report it back so
// the UI can adopt the merged result.
export async function saveWorkspaceSafely(userId, payload, lastKnownUpdatedAt) {
  const remoteUpdatedAt = await getWorkspaceUpdatedAt(userId);
  const remoteChanged = Boolean(remoteUpdatedAt) && Boolean(lastKnownUpdatedAt) && remoteUpdatedAt !== lastKnownUpdatedAt;
  const now = new Date().toISOString();

  if (!remoteChanged) {
    await saveWorkspace(userId, payload, now);
    return { updatedAt: now, merged: null };
  }

  const loaded = await loadWorkspace(userId);
  const merged = mergeWorkspace(payload, loaded?.data || {});
  await saveWorkspace(userId, merged, now);
  return { updatedAt: now, merged };
}
