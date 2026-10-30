import React, { useState, useMemo } from 'react';
import {
  FileText,
  FileCode,
  FileArchive,
  Image as ImageIcon,
  Video,
  Music,
  Package,
  Download,
  Share2,
  Trash2,
  Eye,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  ArrowUpDown,
  X,
  Filter,
} from 'lucide-react';
import { FileRecord, Folder } from '../types.js';
import { formatBytes } from '../api.js';

export type FileCategory = 'all' | 'documents' | 'media' | 'audio' | 'archives' | 'apps' | 'code';
export type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc';
export type ViewMode = 'grid' | 'list';

interface FileGridProps {
  files: FileRecord[];
  folders: Folder[];
  currentFolderId: string | null;
  searchQuery?: string;
  onClearSearch?: () => void;
  onNavigateFolder: (id: string | null) => void;
  onPreview: (file: FileRecord) => void;
  onDownload: (file: FileRecord) => void;
  onShare: (file: FileRecord) => void;
  onDelete: (file: FileRecord) => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

const CATEGORIES: { id: FileCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'documents', label: 'Documents' },
  { id: 'media', label: 'Images & Video' },
  { id: 'audio', label: 'Audio' },
  { id: 'archives', label: 'Archives' },
  { id: 'apps', label: 'APKs & Apps' },
  { id: 'code', label: 'Code & Keys' },
];

function matchesCategory(file: FileRecord, category: FileCategory): boolean {
  if (category === 'all') return true;
  const name = file.name.toLowerCase();
  const mime = file.mime_type.toLowerCase();

  switch (category) {
    case 'documents':
      return (
        mime === 'application/pdf' ||
        mime.includes('officedocument') ||
        mime.includes('excel') ||
        mime.includes('word') ||
        mime.includes('presentation') ||
        mime.startsWith('text/') ||
        name.endsWith('.pdf') ||
        name.endsWith('.doc') ||
        name.endsWith('.docx') ||
        name.endsWith('.xls') ||
        name.endsWith('.xlsx') ||
        name.endsWith('.txt') ||
        name.endsWith('.csv') ||
        name.endsWith('.vcf') ||
        name.endsWith('.rtf')
      );
    case 'media':
      return (
        mime.startsWith('image/') ||
        mime.startsWith('video/') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.png') ||
        name.endsWith('.gif') ||
        name.endsWith('.webp') ||
        name.endsWith('.svg') ||
        name.endsWith('.mp4') ||
        name.endsWith('.mkv') ||
        name.endsWith('.mov') ||
        name.endsWith('.avi') ||
        name.endsWith('.webm')
      );
    case 'audio':
      return (
        mime.startsWith('audio/') ||
        name.endsWith('.mp3') ||
        name.endsWith('.wav') ||
        name.endsWith('.ogg') ||
        name.endsWith('.flac') ||
        name.endsWith('.m4a') ||
        name.endsWith('.aac')
      );
    case 'archives':
      return (
        mime.includes('zip') ||
        mime.includes('tar') ||
        mime.includes('rar') ||
        mime.includes('7z') ||
        mime.includes('compressed') ||
        mime.includes('pgp') ||
        name.endsWith('.zip') ||
        name.endsWith('.rar') ||
        name.endsWith('.7z') ||
        name.endsWith('.tar') ||
        name.endsWith('.gz') ||
        name.endsWith('.bz2') ||
        name.endsWith('.xz') ||
        name.endsWith('.pgp')
      );
    case 'apps':
      return (
        name.endsWith('.apk') ||
        name.endsWith('.exe') ||
        name.endsWith('.msi') ||
        name.endsWith('.dmg') ||
        name.endsWith('.deb') ||
        name.endsWith('.rpm') ||
        name.endsWith('.crx')
      );
    case 'code':
      return (
        name.endsWith('.ts') ||
        name.endsWith('.tsx') ||
        name.endsWith('.js') ||
        name.endsWith('.jsx') ||
        name.endsWith('.json') ||
        name.endsWith('.py') ||
        name.endsWith('.html') ||
        name.endsWith('.css') ||
        name.endsWith('.md') ||
        name.endsWith('.sh') ||
        name.endsWith('.ps1') ||
        name.endsWith('.key') ||
        name.endsWith('.pem') ||
        name.endsWith('.pub') ||
        name.endsWith('.yaml') ||
        name.endsWith('.yml')
      );
    default:
      return true;
  }
}

export const FileGrid: React.FC<FileGridProps> = ({
  files,
  folders,
  currentFolderId,
  searchQuery,
  onClearSearch,
  onNavigateFolder,
  onPreview,
  onDownload,
  onShare,
  onDelete,
  onSync,
  isSyncing = false,
}) => {
  const currentFolder = folders.find((f) => f.id === currentFolderId);

  // View mode state (persisted)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('dart_view_mode') as ViewMode) || 'grid';
  });

  const handleToggleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('dart_view_mode', mode);
  };

  // Filter & Sort state
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<FileCategory, number> = {
      all: files.length,
      documents: 0,
      media: 0,
      audio: 0,
      archives: 0,
      apps: 0,
      code: 0,
    };
    for (const f of files) {
      if (matchesCategory(f, 'documents')) counts.documents++;
      if (matchesCategory(f, 'media')) counts.media++;
      if (matchesCategory(f, 'audio')) counts.audio++;
      if (matchesCategory(f, 'archives')) counts.archives++;
      if (matchesCategory(f, 'apps')) counts.apps++;
      if (matchesCategory(f, 'code')) counts.code++;
    }
    return counts;
  }, [files]);

  // Filtered & Sorted files
  const filteredFiles = useMemo(() => {
    const list = files.filter((f) => matchesCategory(f, selectedCategory));

    return list.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return b.created_at - a.created_at;
        case 'oldest':
          return a.created_at - b.created_at;
        case 'name_asc':
          return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        case 'name_desc':
          return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
        case 'size_desc':
          return b.size - a.size;
        case 'size_asc':
          return a.size - b.size;
        default:
          return 0;
      }
    });
  }, [files, selectedCategory, sortOption]);

  const getFileIcon = (mime: string, name: string) => {
    if (name.endsWith('.apk')) return <Package className="w-5 h-5 text-emerald-400" />;
    if (mime.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-emerald-400" />;
    if (mime.startsWith('video/')) return <Video className="w-5 h-5 text-sky-400" />;
    if (mime.startsWith('audio/')) return <Music className="w-5 h-5 text-indigo-400" />;
    if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar') || mime.includes('7z') || mime.includes('pgp'))
      return <FileArchive className="w-5 h-5 text-amber-400" />;
    if (
      name.endsWith('.ts') ||
      name.endsWith('.js') ||
      name.endsWith('.json') ||
      name.endsWith('.py') ||
      name.endsWith('.html') ||
      name.endsWith('.css') ||
      name.endsWith('.key') ||
      name.endsWith('.pem')
    )
      return <FileCode className="w-5 h-5 text-teal-400" />;
    return <FileText className="w-5 h-5 text-stone-400" />;
  };

  const isMedia = (mime: string) => {
    return (
      mime.startsWith('video/') ||
      mime.startsWith('audio/') ||
      mime.startsWith('image/') ||
      mime === 'application/pdf'
    );
  };

  const getFileExtension = (name: string): string => {
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop()!.toUpperCase() : 'FILE';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-stone-900">
      {/* Top Bar: Breadcrumb + Toolbar */}
      <div className="px-6 py-3.5 border-b border-stone-800 flex flex-wrap items-center justify-between gap-4 bg-stone-900/60 backdrop-blur">
        {/* Breadcrumb & Count */}
        <div className="flex items-center gap-2 text-sm text-stone-400">
          <button
            onClick={() => onNavigateFolder(null)}
            className={`hover:text-stone-100 transition-colors cursor-pointer ${
              currentFolderId === null ? 'font-medium text-stone-100' : ''
            }`}
          >
            All Files
          </button>
          {currentFolder && (
            <>
              <ChevronRight className="w-4 h-4 text-stone-600" />
              <span className="font-medium text-stone-100">{currentFolder.name}</span>
            </>
          )}
          <span className="text-stone-600 text-xs">•</span>
          <span className="text-xs text-stone-500">
            {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}
            {filteredFiles.length !== files.length && ` (of ${files.length})`}
          </span>
        </div>

        {/* View Mode & Sort Controls */}
        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-stone-400 bg-stone-800/80 px-2.5 py-1.5 rounded-lg border border-stone-700/60">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-transparent text-stone-200 focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-stone-900 text-stone-200">Date: Newest</option>
              <option value="oldest" className="bg-stone-900 text-stone-200">Date: Oldest</option>
              <option value="name_asc" className="bg-stone-900 text-stone-200">Name: A to Z</option>
              <option value="name_desc" className="bg-stone-900 text-stone-200">Name: Z to A</option>
              <option value="size_desc" className="bg-stone-900 text-stone-200">Size: Largest</option>
              <option value="size_asc" className="bg-stone-900 text-stone-200">Size: Smallest</option>
            </select>
          </div>

          {/* View Mode Toggle: Grid vs List */}
          <div className="flex items-center bg-stone-800/80 p-0.5 rounded-lg border border-stone-700/60">
            <button
              onClick={() => handleToggleViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-stone-700 text-stone-100 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleToggleViewMode('list')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-stone-700 text-stone-100 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="List View"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar: Category Chips */}
      <div className="px-6 py-2.5 border-b border-stone-800/80 bg-stone-950/40 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <Filter className="w-3.5 h-3.5 text-stone-500 mr-1 shrink-0" />
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.id];
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-stone-800 text-stone-100 font-medium border border-stone-700'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[11px] ${isSelected ? 'text-emerald-400' : 'text-stone-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Search indicator with Clear button */}
        {searchQuery && (
          <div className="flex items-center gap-2 text-xs text-stone-400 shrink-0">
            <span>Query: &ldquo;{searchQuery}&rdquo;</span>
            {onClearSearch && (
              <button
                onClick={onClearSearch}
                className="p-1 hover:text-stone-200 rounded cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {files.length === 0 ? (
          /* Empty Storage State */
          <div className="h-64 flex flex-col items-center justify-center text-center text-stone-500 border border-dashed border-stone-800 rounded-xl p-6">
            <FileText className="w-10 h-10 mb-3 text-stone-600" />
            <div className="text-stone-300 font-medium">No files displayed yet</div>
            <div className="text-xs text-stone-500 mt-1 max-w-sm mb-4">
              If your Telegram Saved Messages already has files, click below to scan and import them into Dart.
            </div>
            {onSync && (
              <button
                onClick={onSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg border border-stone-700 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                <span>{isSyncing ? 'Scanning Saved Messages...' : 'Scan & Import Saved Messages'}</span>
              </button>
            )}
          </div>
        ) : filteredFiles.length === 0 ? (
          /* Filter Return Zero State */
          <div className="h-64 flex flex-col items-center justify-center text-center text-stone-500 border border-dashed border-stone-800 rounded-xl p-6">
            <FileText className="w-10 h-10 mb-3 text-stone-600" />
            <div className="text-stone-300 font-medium">No files match this filter</div>
            <div className="text-xs text-stone-500 mt-1 max-w-sm mb-4">
              No files found in &ldquo;{CATEGORIES.find((c) => c.id === selectedCategory)?.label}&rdquo;.
            </div>
            <button
              onClick={() => setSelectedCategory('all')}
              className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg border border-stone-700 transition-colors cursor-pointer"
            >
              Reset to All Files
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredFiles.map((file) => {
              const hasPreview = isMedia(file.mime_type);
              const isMissing = file.status === 'missing';
              const ext = getFileExtension(file.name);

              return (
                <div
                  key={file.id}
                  className={`group relative bg-stone-800/40 border border-stone-800 rounded-xl p-4 hover:border-stone-700/80 hover:bg-stone-800/70 transition-all flex flex-col justify-between ${
                    isMissing ? 'opacity-60 border-red-950/60' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2.5 rounded-lg bg-stone-800 border border-stone-700/40">
                        {getFileIcon(file.mime_type, file.name)}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {hasPreview && !isMissing && (
                          <button
                            onClick={() => onPreview(file)}
                            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                            title="Preview / Stream"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!isMissing && (
                          <button
                            onClick={() => onShare(file)}
                            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                            title="Share Link"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onDownload(file)}
                          className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(file)}
                          className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="font-medium text-sm text-stone-200 truncate mb-1" title={file.name}>
                      {file.name}
                    </div>

                    {isMissing && (
                      <div className="flex items-center gap-1.5 text-xs text-red-400 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Deleted from Telegram</span>
                      </div>
                    )}
                  </div>

                  {/* Metadata row: Plain text as per UI rules */}
                  <div className="mt-3 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
                    <span className="font-mono text-[11px] text-stone-500">{ext}</span>
                    <div className="flex items-center gap-2 text-stone-400">
                      <span>{formatBytes(file.size)}</span>
                      <span>•</span>
                      <span>{new Date(file.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="bg-stone-800/30 border border-stone-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-stone-800 text-xs font-semibold text-stone-400 bg-stone-900/40">
                  <th
                    onClick={() =>
                      setSortOption((prev) => (prev === 'name_asc' ? 'name_desc' : 'name_asc'))
                    }
                    className="py-3 px-4 cursor-pointer hover:text-stone-200 select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Name</span>
                      <ArrowUpDown className="w-3 h-3 text-stone-500" />
                    </div>
                  </th>
                  <th
                    onClick={() =>
                      setSortOption((prev) => (prev === 'newest' ? 'oldest' : 'newest'))
                    }
                    className="py-3 px-4 cursor-pointer hover:text-stone-200 select-none hidden sm:table-cell"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date Added</span>
                      <ArrowUpDown className="w-3 h-3 text-stone-500" />
                    </div>
                  </th>
                  <th
                    onClick={() =>
                      setSortOption((prev) => (prev === 'size_desc' ? 'size_asc' : 'size_desc'))
                    }
                    className="py-3 px-4 cursor-pointer hover:text-stone-200 select-none text-right"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Size</span>
                      <ArrowUpDown className="w-3 h-3 text-stone-500" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center hidden md:table-cell">Type</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {filteredFiles.map((file) => {
                  const hasPreview = isMedia(file.mime_type);
                  const isMissing = file.status === 'missing';
                  const ext = getFileExtension(file.name);

                  return (
                    <tr
                      key={file.id}
                      className={`hover:bg-stone-800/50 transition-colors group ${
                        isMissing ? 'opacity-60 bg-red-950/10' : ''
                      }`}
                    >
                      {/* Name */}
                      <td className="py-3 px-4 max-w-xs md:max-w-md truncate">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-stone-800/80 border border-stone-700/40 shrink-0">
                            {getFileIcon(file.mime_type, file.name)}
                          </div>
                          <div className="truncate">
                            <span
                              className="font-medium text-stone-200 text-sm truncate block"
                              title={file.name}
                            >
                              {file.name}
                            </span>
                            {isMissing && (
                              <span className="text-xs text-red-400 flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                Deleted from Telegram
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-xs text-stone-400 hidden sm:table-cell">
                        {new Date(file.created_at).toLocaleDateString()}
                      </td>

                      {/* Size */}
                      <td className="py-3 px-4 text-xs text-stone-300 font-mono text-right">
                        {formatBytes(file.size)}
                      </td>

                      {/* Type format (plain text, no decorative pills) */}
                      <td className="py-3 px-4 text-xs text-stone-500 font-mono text-center hidden md:table-cell">
                        {ext}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          {hasPreview && !isMissing && (
                            <button
                              onClick={() => onPreview(file)}
                              className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                              title="Preview / Stream"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {!isMissing && (
                            <button
                              onClick={() => onShare(file)}
                              className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                              title="Share Link"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onDownload(file)}
                            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(file)}
                            className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
