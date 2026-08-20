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
    const { data } = await supabase.auth.getSession();
    const uid = data?.session?.user?.id;
    if (!uid) {
      throw new Error('You are not signed in. Please sign in again and retry the upload.');
    }
    const path = `${uid}/${projectId || 'general'}/${docId}-${Date.now()}-${safeName(file.name)}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file);
    if (error) throw error;
    return { hasFile: true, size, filePath: path };
  }

  return { hasFile: true, size, fileData: await toBase64(file) };
}

export async function deleteDocumentFile(doc) {
  if (!isCloudStorage || !doc?.filePath) return;
  const { error } = await supabase.storage.from(BUCKET).remove([doc.filePath]);
  if (error) console.error('Supabase delete failed:', error.message);
}

// Removes the current file and every stored version, used when a document is
// permanently deleted or the trash is emptied.
export async function deleteDocumentFiles(doc) {
  if (!isCloudStorage) return;
  const paths = [doc?.filePath, ...(doc?.versions || []).map((v) => v?.filePath)].filter(Boolean);
  if (!paths.length) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) console.error('Supabase delete failed:', error.message);
}

// The bucket is private: files can only be read via short-lived signed URLs,
// generated server-side for the authenticated owner only.
export async function getDocumentUrl(doc) {
  if (isCloudStorage && doc?.filePath) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.filePath, 3600);
    if (error || !data?.signedUrl) return '';
    return data.signedUrl;
  }
  return doc?.fileData || '';
}

export async function getDocumentDownloadUrl(doc) {
  if (isCloudStorage && doc?.filePath) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.filePath, 3600, { download: true });
    if (error || !data?.signedUrl) return '';
    return data.signedUrl;
  }
  return doc?.fileData || '';
}