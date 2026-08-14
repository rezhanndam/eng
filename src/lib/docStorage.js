import { supabase, BUCKET, isCloudStorage } from './supabase';

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const safeName = (name) => String(name || 'file').replace(/[^\w.-]+/g, '_');

export async function uploadDocumentFile({ file, projectId, docId }) {
  if (!file) return { hasFile: false };
  const size = file.size;

  if (isCloudStorage) {
    const path = `${projectId || 'general'}/${docId}-${safeName(file.name)}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { hasFile: true, size, filePath: path, fileUrl: data.publicUrl };
  }

  return { hasFile: true, size, fileData: await toBase64(file) };
}

export async function deleteDocumentFile(doc) {
  if (!isCloudStorage || !doc?.filePath) return;
  const { error } = await supabase.storage.from(BUCKET).remove([doc.filePath]);
  if (error) console.error('Supabase delete failed:', error.message);
}

export const getDocumentUrl = (doc) => (isCloudStorage && doc?.fileUrl) || doc?.fileData || '';