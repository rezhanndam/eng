import { useState } from 'react';
import { FileText, Download, Trash, Upload, Search, Folder, ChevronRight, Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import CategoryModal from '../components/CategoryModal';
import DocumentModal from '../components/DocumentModal';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../hooks/useToast';
import { getDocumentUrl, deleteDocumentFile } from '../lib/docStorage';

const TYPE_ICONS = {
  PDF: 'bg-red-50 text-red-500',
  DWG: 'bg-blue-50 text-blue-500',
  XLSX: 'bg-emerald-50 text-emerald-600',
};

export default function DocumentsPage({
  documents,
  categories,
  onAddDocument,
  onEditDocument,
  onDeleteDocument,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  activeProjectId,
  can,
}) {
  const [activeCategory, setActiveCategory] = useState(null); // null means root view (category folders)
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // Document Modal State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Confirm Delete State
  const [pendingDeleteCat, setPendingDeleteCat] = useState(null);
  const [pendingDeleteDoc, setPendingDeleteDoc] = useState(null);

  // Filter documents by search and active category
  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = activeCategory === null || doc.category === activeCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSaveCategory = (name) => {
    if (editingCategoryName) {
      onEditCategory(editingCategoryName, name);
    } else {
      onAddCategory(name);
    }
  };

  const handleSaveDocument = (docData) => {
    if (selectedDoc) {
      if (selectedDoc.filePath && docData.filePath && selectedDoc.filePath !== docData.filePath) {
        deleteDocumentFile(selectedDoc);
      }
      onEditDocument({ ...selectedDoc, ...docData, projectId: activeProjectId });
    } else {
      onAddDocument({ ...docData, projectId: activeProjectId });
    }
  };

  const handleEditDocClick = (doc) => {
    setSelectedDoc(doc);
    setIsDocModalOpen(true);
  };

  const handleAddDocClick = () => {
    setSelectedDoc(null);
    setIsDocModalOpen(true);
  };

  const handleEditCatClick = (e, cat) => {
    e.stopPropagation();
    setEditingCategoryName(cat);
    setIsCatModalOpen(true);
  };

  const handleDeleteCatClick = (e, cat) => {
    e.stopPropagation();
    setPendingDeleteCat(cat);
  };

  const handleAddCatClick = () => {
    setEditingCategoryName('');
    setIsCatModalOpen(true);
  };

  const handleDownload = (doc) => {
    const url = getDocumentUrl(doc);
    if (url) {
      const link = window.document.createElement('a');
      link.href = url;
      link.download = doc.name;
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } else {
      showToast(`Downloading simulation file: ${doc.name} (${doc.size})`, 'info');
    }
  };

  const isSearching = searchQuery.trim() !== '';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <button
              onClick={() => {
                setActiveCategory(null);
                setSearchQuery('');
              }}
              className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Documents
            </button>
            {activeCategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-800 dark:text-slate-100 font-medium">{activeCategory}</span>
              </>
            )}
            {isSearching && activeCategory === null && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-800 dark:text-slate-100 font-medium">Search Results</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {activeCategory ? activeCategory : 'Documents'}
          </h1>
          <p className="text-[13.5px] text-slate-400 dark:text-slate-500 mt-1">
            {activeCategory
              ? `${filteredDocs.length} files in this category`
              : `${documents.length} files across ${categories.length} categories`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {can('category.manage') && (
            <button
              onClick={handleAddCatClick}
              className="flex items-center gap-1.5 h-9 px-3 text-[13px] font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          )}
          {can('document.upload') && (
            <button
              onClick={handleAddDocClick}
              className="flex items-center gap-2 h-9 px-4 text-[13px] font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder={activeCategory ? `Search in ${activeCategory}...` : "Search all documents..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label={activeCategory ? `Search in ${activeCategory}` : 'Search all documents'}
          className="w-full h-10 pl-9 pr-3 text-[13px] bg-white dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
        />
      </div>

      {/* Root Category Folders View */}
      {activeCategory === null && !isSearching ? (
        categories.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <EmptyState
              icon={Folder}
              title="No categories yet"
              description="Create a document category like CF SPEC, PIS, or QCPC to organize your files."
              actionLabel={can('category.manage') ? 'Add Category' : undefined}
              onAction={can('category.manage') ? handleAddCatClick : undefined}
            />
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const catDocsCount = documents.filter((d) => d.category === cat).length;
            return (
              <div
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 text-left shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-slate-600 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-900/40 text-blue-500 dark:text-blue-400">
                    <Folder className="w-6 h-6 fill-current" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {cat}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{catDocsCount} files</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {can('category.manage') && (
                    <>
                      <button
                        onClick={(e) => handleEditCatClick(e, cat)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                        title="Edit Category Name"
                        aria-label={`Edit category ${cat}`}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteCatClick(e, cat)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                        title="Delete Category"
                        aria-label={`Delete category ${cat}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )
      ) : (
        /* Files List View */
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
          {filteredDocs.length === 0 ? (
            <EmptyState
              icon={activeCategory ? FolderOpen : Folder}
              title={activeCategory ? `No files in ${activeCategory}` : 'No documents found'}
              description={activeCategory
                ? 'This category is empty. Upload a document to add it here.'
                : 'No documents match your search. Try a different keyword or upload a new file.'}
              actionLabel={can('document.upload') ? 'Upload Document' : undefined}
              onAction={can('document.upload') ? handleAddDocClick : undefined}
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredDocs.map((doc) => (
                <div key={doc.id || doc.name} className="flex items-center gap-4 py-3.5">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${TYPE_ICONS[doc.type] || 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-medium text-slate-800 dark:text-slate-100 truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                      <span>{doc.type}</span>
                      <span>&middot;</span>
                      <span>{doc.size}</span>
                      <span>&middot;</span>
                      <span>{doc.date}</span>
                      {activeCategory === null && doc.category && (
                        <>
                          <span>&middot;</span>
                          <span className="inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {doc.category}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Download"
                      aria-label={`Download ${doc.name}`}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {can('document.edit') && (
                      <button
                        onClick={() => handleEditDocClick(doc)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                        title="Edit Document"
                        aria-label={`Edit document ${doc.name}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {can('document.delete') && (
                      <button
                        onClick={() => setPendingDeleteDoc(doc)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete Document"
                        aria-label={`Delete document ${doc.name}`}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        onSave={handleSaveCategory}
        categoryName={editingCategoryName}
      />

      {/* Document Modal */}
      <DocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onSave={handleSaveDocument}
        documentItem={selectedDoc}
        categories={categories}
        projectId={activeProjectId}
      />

      {/* Confirm Delete Category */}
      <ConfirmModal
        isOpen={!!pendingDeleteCat}
        onClose={() => setPendingDeleteCat(null)}
        onConfirm={() => onDeleteCategory(pendingDeleteCat)}
        title="Delete category"
        message={`Are you sure you want to delete category "${pendingDeleteCat}"? Documents in this category will be moved to General Spec.`}
        confirmLabel="Delete"
      />

      {/* Confirm Delete Document */}
      <ConfirmModal
        isOpen={!!pendingDeleteDoc}
        onClose={() => setPendingDeleteDoc(null)}
        onConfirm={() => onDeleteDocument(pendingDeleteDoc)}
        title="Delete document"
        message={`Are you sure you want to delete "${pendingDeleteDoc?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
