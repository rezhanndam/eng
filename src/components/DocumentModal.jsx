import { useState, useEffect, useRef } from 'react';
import { X, Upload, AlertTriangle, Loader2 } from 'lucide-react';
import { isCloudStorage } from '../lib/supabase';
import { uploadDocumentFile } from '../lib/docStorage';

const MAX_FILE_SIZE = isCloudStorage ? 25 * 1024 * 1024 : 3 * 1024 * 1024;

const generateDocId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `doc-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `doc-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
};

export default function DocumentModal({ isOpen, onClose, onSave, documentItem = null, categories = [], projectId = '' }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('PDF');
  const [category, setCategory] = useState('');
  const [fileData, setFileData] = useState(null); // base64 representation or null
  const [fileObject, setFileObject] = useState(null); // raw File when cloud storage is active
  const [uploading, setUploading] = useState(false);
  const [fileSize, setFileSize] = useState('');
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (documentItem) {
      setName(documentItem.name);
      setType(documentItem.type);
      setCategory(documentItem.category || (categories[0] || ''));
      setFileData(documentItem.fileData || null);
      setFileSize(documentItem.size || '');
    } else {
      setName('');
      setType('PDF');
      setCategory(categories[0] || '');
      setFileData(null);
      setFileSize('');
    }
    setFileObject(null);
    setFileError('');
  }, [documentItem, isOpen, categories]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum size is ${isCloudStorage ? '25' : '3'} MB.`);
      setFileObject(null);
      setFileData(null);
      setFileSize('');
      return;
    }
    setFileError('');

    // Detect Name & Type
    setName(file.name);
    
    // Get file extension
    const dotIndex = file.name.lastIndexOf('.');
    const ext = dotIndex !== -1 ? file.name.slice(dotIndex + 1).toUpperCase() : 'PDF';
    const validTypes = ['PDF', 'DWG', 'XLSX', 'ZIP', 'DOCX'];
    setType(validTypes.includes(ext) ? ext : 'PDF');

    // Calculate dynamic size
    const sizeInMB = file.size / (1024 * 1024);
    const formattedSize = sizeInMB < 0.1 ? `${(file.size / 1024).toFixed(1)} KB` : `${sizeInMB.toFixed(1)} MB`;
    setFileSize(formattedSize);

    if (isCloudStorage) {
      // Upload raw file to Supabase storage on submit
      setFileObject(file);
      setFileData(null);
    } else {
      // Convert file to Base64 to store in localStorage
      const reader = new FileReader();
      reader.onload = () => {
        setFileData(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !category || categories.length === 0 || uploading) return;

    const id = documentItem ? documentItem.id : generateDocId();
    let filePath;
    let fileUrl;

    if (isCloudStorage && fileObject) {
      setUploading(true);
      try {
        const result = await uploadDocumentFile({ file: fileObject, projectId, docId: id });
        filePath = result.filePath;
        fileUrl = result.fileUrl;
      } catch (error) {
        setUploading(false);
        setFileError(error?.message || 'Upload failed. Please try again.');
        return;
      }
    }

    const payload = {
      id,
      name: name.trim(),
      type,
      category,
      size: fileSize || documentItem?.size || `${(Math.random() * 4 + 0.5).toFixed(1)} MB`,
      date: documentItem ? documentItem.date : new Date().toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };

    if (isCloudStorage) {
      if (fileObject) {
        payload.filePath = filePath;
        payload.fileUrl = fileUrl;
      }
    } else {
      if (fileData) payload.fileData = fileData;
    }

    onSave(payload);
    onClose();
  };

  const types = ['PDF', 'DWG', 'XLSX', 'ZIP', 'DOCX'];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[15px]">
            {documentItem ? 'Edit Document' : 'New Document'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* File Picker input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              {documentItem ? 'Replace File (optional)' : 'Upload Document File'}
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-600 dark:hover:border-blue-400 hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-700/40 flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-700">{documentItem ? 'Click to replace file' : 'Click to upload file'}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF, DWG, XLSX, ZIP, DOCX</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.dwg,.xlsx,.zip,.docx"
                disabled={uploading}
              />
            </div>
            {fileError && (
              <p className="mt-2 flex items-center gap-1.5 text-[12px] text-red-500 dark:text-red-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {fileError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Document Name / Title
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Specification Details.pdf"
              className="w-full h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                File Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                required
              >
                {categories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {fileSize && (
            <div className="text-[12px] text-slate-400 italic">
              Selected file size: {fileSize}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-[13px] font-medium border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="h-9 px-4 text-[13px] font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-2"
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploading ? 'Uploading...' : 'Save Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
