import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Calendar,
  Clock,
  Check,
} from 'lucide-react';
import { FileRecord, Folder } from '../types.js';
import { formatBytes } from '../api.js';
import { BulkActionBar } from './BulkActionBar.js';
import { MoveFilesModal } from './MoveFilesModal.js';

export type FileCategory = 'all' | 'documents' | 'media' | 'audio' | 'archives' | 'apps' | 'code';
export type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';
export type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc';
export type ViewMode = 'grid' | 'list';

export const DATE_FILTERS: { id: DateFilter; label: string; shortLabel: string }[] = [
  { id: 'all', label: 'All Dates', shortLabel: 'All Dates' },
  { id: 'today', label: 'Last 24 Hours', shortLabel: 'Today (24h)' },
  { id: 'week', label: 'Past 7 Days', shortLabel: 'Past 7 Days' },
  { id: 'month', label: 'Past 30 Days', shortLabel: 'Past 30 Days' },
  { id: 'year', label: 'Past Year', shortLabel: 'Past Year' },
];

function matchesDate(file: FileRecord, dateFilter: DateFilter): boolean {
  if (dateFilter === 'all') return true;
  const now = Date.now();
  const diffMs = now - file.created_at;
  switch (dateFilter) {
    case 'today':
      return diffMs <= 24 * 60 * 60 * 1000 && diffMs >= 0;
    case 'week':
      return diffMs <= 7 * 24 * 60 * 60 * 1000 && diffMs >= 0;
    case 'month':
      return diffMs <= 30 * 24 * 60 * 60 * 1000 && diffMs >= 0;
    case 'year':
      return diffMs <= 365 * 24 * 60 * 60 * 1000 && diffMs >= 0;
    default:
      return true;
  }
}

export function formatFileDate(timestamp: number): { display: string; full: string; relative: string } {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  const full = date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  let relative = '';
  if (diffSec < 60 && diffSec >= 0) {
    relative = 'Just now';
  } else if (diffMin < 60 && diffMin >= 0) {
    relative = `${diffMin}m ago`;
  } else if (diffHours < 24 && diffHours >= 0) {
    relative = `${diffHours}h ago`;
  } else if (diffDays === 1) {
    relative = 'Yesterday';
  } else if (diffDays < 30) {
    relative = `${diffDays}d ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    relative = `${months}mo ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    relative = `${years}y ago`;
  }

  let display: string;
  if (isToday) {
    display = `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (isYesterday) {
    display = `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (date.getFullYear() === now.getFullYear()) {
    display = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } else {
    display = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return { display, full, relative };
}

interface FileGridProps {
  files: FileRecord[];
  folders: Folder[];
  currentFolderId: string | null;
  searchQuery?: string;
  onClearSearch?: () => void;
  onNavigateFolder: (id: string | null) => void;
  onPreview: (file: FileRecord, activeList?: FileRecord[]) => void;
  onDownload: (file: FileRecord) => void;
  onShare: (file: FileRecord) => void;
  onDelete: (file: FileRecord) => void;
  onBulkDelete?: (fileIds: string[]) => Promise<void>;
  onBulkMove?: (fileIds: string[], folderId: string | null) => Promise<void>;
  onBulkDownloadZip?: (fileIds: string[]) => void;
  onFolderCreated?: () => void;
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
  onBulkDelete,
  onBulkMove,
  onBulkDownloadZip,
  onFolderCreated,
  onSync,
  isSyncing = false,
}) => {
  const currentFolder = folders.find((f) => f.id === currentFolderId);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Clear selection on folder navigation
  useEffect(() => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }, [currentFolderId]);

  // Escape key deselects all
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedIds.size > 0) {
        setSelectedIds(new Set());
        setLastSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds.size]);

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
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>(() => {
    return currentFolderId === '__recent__' ? 'week' : 'all';
  });
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  const prevFolderIdRef = useRef<string | null>(currentFolderId);

  useEffect(() => {
    if (currentFolderId === '__recent__') {
      setSelectedDateFilter('week');
    } else if (prevFolderIdRef.current === '__recent__') {
      setSelectedDateFilter('all');
    }
    prevFolderIdRef.current = currentFolderId;
  }, [currentFolderId]);

  // Date counts
  const dateCounts = useMemo(() => {
    const counts: Record<DateFilter, number> = {
      all: files.length,
      today: 0,
      week: 0,
      month: 0,
      year: 0,
    };
    for (const f of files) {
      if (matchesDate(f, 'today')) counts.today++;
      if (matchesDate(f, 'week')) counts.week++;
      if (matchesDate(f, 'month')) counts.month++;
      if (matchesDate(f, 'year')) counts.year++;
    }
    return counts;
  }, [files]);

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
    const list = files.filter((f) => {
      if (!matchesCategory(f, selectedCategory)) return false;
      if (!matchesDate(f, selectedDateFilter)) return false;
      return true;
    });

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
  }, [files, selectedCategory, selectedDateFilter, sortOption]);

  const activeFilteredFiles = useMemo(
    () => filteredFiles.filter((f) => f.status !== 'missing'),
    [filteredFiles]
  );

  const isAllSelected =
    activeFilteredFiles.length > 0 &&
    activeFilteredFiles.every((f) => selectedIds.has(f.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
      setLastSelectedId(null);
    } else {
      setSelectedIds(new Set(activeFilteredFiles.map((f) => f.id)));
    }
  };

  const handleToggleSelect = (fileId: string, isShift: boolean = false) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isShift && lastSelectedId) {
        const lastIndex = filteredFiles.findIndex((f) => f.id === lastSelectedId);
        const currentIndex = filteredFiles.findIndex((f) => f.id === fileId);
        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex);
          const end = Math.max(lastIndex, currentIndex);
          for (let i = start; i <= end; i++) {
            if (filteredFiles[i].status !== 'missing') {
              next.add(filteredFiles[i].id);
            }
          }
          return next;
        }
      }

      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
    setLastSelectedId(fileId);
  };

  const selectedFiles = useMemo(() => {
    return files.filter((f) => selectedIds.has(f.id));
  }, [files, selectedIds]);

  const selectedTotalSize = useMemo(() => {
    return selectedFiles.reduce((acc, f) => acc + f.size, 0);
  }, [selectedFiles]);

  const handleBulkDeleteAction = async () => {
    if (!onBulkDelete || selectedIds.size === 0) return;
    setIsProcessingBulk(true);
    try {
      await onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      setLastSelectedId(null);
    } finally {
      setIsProcessingBulk(false);
    }
  };

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

  const getFileExtension = (name: string): string => {
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop()!.toUpperCase() : 'FILE';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-stone-900 transition-colors">
      {/* Top Bar: Breadcrumb + Toolbar */}
      <div className="px-6 py-3.5 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4 bg-white/70 dark:bg-stone-900/60 backdrop-blur">
        {/* Breadcrumb & Count */}
        <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
          <button
            onClick={() => {
              if (currentFolderId === '__recent__') {
                setSelectedDateFilter('all');
              }
              onNavigateFolder(null);
            }}
            className={`hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer ${
              currentFolderId === null ? 'font-medium text-stone-900 dark:text-stone-100' : ''
            }`}
          >
            All Files
          </button>
          {currentFolderId === '__recent__' ? (
            <>
              <ChevronRight className="w-4 h-4 text-stone-400 dark:text-stone-600" />
              <span className="font-medium text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Recent Files
              </span>
            </>
          ) : currentFolder ? (
            <>
              <ChevronRight className="w-4 h-4 text-stone-400 dark:text-stone-600" />
              <span className="font-medium text-stone-900 dark:text-stone-100">{currentFolder.name}</span>
            </>
          ) : null}
          <span className="text-stone-300 dark:text-stone-600 text-xs">•</span>
          <span className="text-xs text-stone-400 dark:text-stone-500">
            {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}
            {filteredFiles.length !== files.length && ` (of ${files.length})`}
          </span>
          {activeFilteredFiles.length > 0 && (
            <>
              <span className="text-stone-300 dark:text-stone-600 text-xs">•</span>
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer flex items-center gap-1.5"
                title={isAllSelected ? 'Deselect all files' : 'Select all files'}
              >
                <div
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors border ${
                    isAllSelected
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : selectedIds.size > 0
                      ? 'bg-emerald-600/20 border-emerald-600 text-emerald-600 dark:text-emerald-400'
                      : 'border-stone-300 dark:border-stone-600 hover:border-stone-400 bg-white dark:bg-stone-800'
                  }`}
                >
                  {isAllSelected ? (
                    <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                  ) : selectedIds.size > 0 ? (
                    <span className="w-1.5 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
                  ) : null}
                </div>
                <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
              </button>
            </>
          )}
        </div>

        {/* View Mode & Sort Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Date Range Filter Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/80 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700/60">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value as DateFilter)}
              className="bg-transparent text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer"
              title="Filter by message date"
            >
              <option value="all" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-200">
                All Dates ({dateCounts.all})
              </option>
              <option value="today" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-200">
                Last 24 Hours ({dateCounts.today})
              </option>
              <option value="week" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-200">
                Past 7 Days ({dateCounts.week})
              </option>
              <option value="month" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-200">
                Past 30 Days ({dateCounts.month})
              </option>
              <option value="year" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-200">
                Past Year ({dateCounts.year})
              </option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/80 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700/60">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-transparent text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-200">Date: Newest</option>
              <option value="oldest" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-200">Date: Oldest</option>
              <option value="name_asc" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-200">Name: A to Z</option>
              <option value="name_desc" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-200">Name: Z to A</option>
              <option value="size_desc" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-200">Size: Largest</option>
              <option value="size_asc" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-200">Size: Smallest</option>
            </select>
          </div>

          {/* View Mode Toggle: Grid vs List */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-800/80 p-0.5 rounded-lg border border-stone-200 dark:border-stone-700/60">
            <button
              onClick={() => handleToggleViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs'
                  : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleToggleViewMode('list')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs'
                  : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
              }`}
              title="List View"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar: Category Chips */}
      <div className="px-6 py-2.5 border-b border-stone-200 dark:border-stone-800/80 bg-stone-50/70 dark:bg-stone-950/40 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <Filter className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 mr-1 shrink-0" />
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.id];
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium border border-stone-300 dark:border-stone-700 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[11px] ${isSelected ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-stone-400 dark:text-stone-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Filters & Search indicator */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedDateFilter !== 'all' && (
            <button
              onClick={() => setSelectedDateFilter('all')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 bg-white dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700/60 shadow-2xs transition-colors cursor-pointer"
              title="Clear date filter"
            >
              <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Date: {DATE_FILTERS.find((d) => d.id === selectedDateFilter)?.shortLabel}</span>
              <X className="w-3 h-3 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200" />
            </button>
          )}

          {searchQuery && (
            <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 px-2.5 py-1 bg-stone-100 dark:bg-stone-800/60 rounded-lg border border-stone-200 dark:border-stone-700/40">
              <span>Query: &ldquo;{searchQuery}&rdquo;</span>
              {onClearSearch && (
                <button
                  onClick={onClearSearch}
                  className="p-0.5 hover:text-stone-900 dark:hover:text-stone-200 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {files.length === 0 ? (
          /* Empty Storage State */
          <div className="h-64 flex flex-col items-center justify-center text-center text-stone-500 border border-dashed border-stone-300 dark:border-stone-800 rounded-xl p-6 bg-stone-50/50 dark:bg-transparent">
            <FileText className="w-10 h-10 mb-3 text-stone-400 dark:text-stone-600" />
            <div className="text-stone-800 dark:text-stone-300 font-medium">No files displayed yet</div>
            <div className="text-xs text-stone-500 mt-1 max-w-sm mb-4">
              If your Telegram Saved Messages already has files, click below to scan and import them into Dart.
            </div>
            {onSync && (
              <button
                onClick={onSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 transition-colors cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-500 dark:text-emerald-400' : ''}`} />
                <span>{isSyncing ? 'Scanning Saved Messages...' : 'Scan & Import Saved Messages'}</span>
              </button>
            )}
          </div>
        ) : filteredFiles.length === 0 ? (
          /* Filter / Search Return Zero State */
          <div className="h-64 flex flex-col items-center justify-center text-center text-stone-500 border border-dashed border-stone-300 dark:border-stone-800 rounded-xl p-6 bg-stone-50/50 dark:bg-transparent">
            <FileText className="w-10 h-10 mb-3 text-stone-400 dark:text-stone-600" />
            <div className="text-stone-800 dark:text-stone-200 font-medium text-sm">
              {searchQuery ? `No files found matching "${searchQuery}"` : 'No files match this filter'}
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mb-4 leading-relaxed">
              {searchQuery ? (
                <span>Check the spelling or try searching for another keyword or file extension.</span>
              ) : selectedCategory !== 'all' && selectedDateFilter !== 'all' ? (
                `No files found in "${CATEGORIES.find((c) => c.id === selectedCategory)?.label}" within ${DATE_FILTERS.find((d) => d.id === selectedDateFilter)?.shortLabel.toLowerCase()}.`
              ) : selectedDateFilter !== 'all' ? (
                `No files found within ${DATE_FILTERS.find((d) => d.id === selectedDateFilter)?.shortLabel.toLowerCase()}.`
              ) : (
                `No files found in "${CATEGORIES.find((c) => c.id === selectedCategory)?.label}".`
              )}
            </div>
            <div className="flex items-center gap-2">
              {searchQuery && onClearSearch && (
                <button
                  onClick={onClearSearch}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
                >
                  Clear Search
                </button>
              )}
              <button
                onClick={() => {
                  if (onClearSearch) onClearSearch();
                  setSelectedCategory('all');
                  setSelectedDateFilter('all');
                }}
                className="px-3.5 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 transition-colors cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredFiles.map((file) => {
              const isMissing = file.status === 'missing';
              const ext = getFileExtension(file.name);
              const dateInfo = formatFileDate(file.created_at);
              const isSelected = selectedIds.has(file.id);

              return (
                <div
                  key={file.id}
                  onClick={() => !isMissing && onPreview(file, filteredFiles)}
                  className={`group relative rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer border ${
                    isSelected
                      ? 'border-emerald-500 dark:border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 ring-1 ring-emerald-500/30'
                      : 'bg-stone-50/80 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 hover:bg-white dark:hover:bg-stone-800/70'
                  } ${
                    isMissing ? 'opacity-60 border-red-300 dark:border-red-950/60 cursor-default' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {!isMissing && (
                          <div
                            role="checkbox"
                            tabIndex={0}
                            aria-checked={isSelected}
                            onKeyDown={(e) => {
                              if (e.key === ' ' || e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                handleToggleSelect(file.id, e.shiftKey);
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelect(file.id, e.shiftKey);
                            }}
                            className={`w-5 h-5 rounded flex items-center justify-center transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white opacity-100 shadow-2xs'
                                : 'border-stone-300 dark:border-stone-600 bg-white/90 dark:bg-stone-800/90 text-transparent opacity-0 group-hover:opacity-100 hover:border-stone-400 dark:hover:border-stone-400'
                            }`}
                            title={isSelected ? 'Deselect' : 'Select (Shift+click for range)'}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                          </div>
                        )}
                        <div className="p-2.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/40 shadow-2xs">
                          {getFileIcon(file.mime_type, file.name)}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {!isMissing && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPreview(file, filteredFiles);
                            }}
                            className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                            title="View file"
                            aria-label={`View ${file.name}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!isMissing && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onShare(file);
                            }}
                            className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                            title="Share Link"
                            aria-label={`Share ${file.name}`}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownload(file);
                          }}
                          className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                          title="Download"
                          aria-label={`Download ${file.name}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(file);
                          }}
                          className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-stone-200/60 dark:hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                          title="Delete"
                          aria-label={`Delete ${file.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="font-medium text-sm text-stone-900 dark:text-stone-200 truncate mb-1" title={file.name}>
                      {file.name}
                    </div>

                    {isMissing && (
                      <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Deleted from Telegram</span>
                      </div>
                    )}
                  </div>

                  {/* Metadata row: Plain text as per UI rules */}
                  <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                    <span className="font-mono text-[11px] text-stone-400 dark:text-stone-500">{ext}</span>
                    <div className="flex items-center gap-2">
                      <span>{formatBytes(file.size)}</span>
                      <span>•</span>
                      <span title={dateInfo.full} className="hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-default">
                        {dateInfo.display}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="bg-white dark:bg-stone-800/30 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-500 dark:text-stone-400 bg-stone-50/80 dark:bg-stone-900/40">
                  <th className="py-3 px-3 w-10 text-center">
                    <div
                      role="checkbox"
                      tabIndex={0}
                      aria-checked={isAllSelected}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          handleToggleSelectAll();
                        }
                      }}
                      onClick={handleToggleSelectAll}
                      className={`w-4 h-4 mx-auto rounded flex items-center justify-center transition-colors cursor-pointer border ${
                        isAllSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : selectedIds.size > 0
                          ? 'bg-emerald-600/20 border-emerald-600 text-emerald-600 dark:text-emerald-400'
                          : 'border-stone-300 dark:border-stone-600 hover:border-stone-400 bg-white dark:bg-stone-800'
                      }`}
                      title={isAllSelected ? 'Deselect all' : 'Select all'}
                    >
                      {isAllSelected ? (
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      ) : selectedIds.size > 0 ? (
                        <span className="w-2 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
                      ) : null}
                    </div>
                  </th>
                  <th
                    onClick={() =>
                      setSortOption((prev) => (prev === 'name_asc' ? 'name_desc' : 'name_asc'))
                    }
                    className="py-3 px-4 cursor-pointer hover:text-stone-800 dark:hover:text-stone-200 select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Name</span>
                      <ArrowUpDown className="w-3 h-3 text-stone-400 dark:text-stone-500" />
                    </div>
                  </th>
                  <th
                    onClick={() =>
                      setSortOption((prev) => (prev === 'newest' ? 'oldest' : 'newest'))
                    }
                    className="py-3 px-4 cursor-pointer hover:text-stone-800 dark:hover:text-stone-200 select-none hidden sm:table-cell"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Telegram Date</span>
                      <ArrowUpDown className="w-3 h-3 text-stone-400 dark:text-stone-500" />
                    </div>
                  </th>
                  <th
                    onClick={() =>
                      setSortOption((prev) => (prev === 'size_desc' ? 'size_asc' : 'size_desc'))
                    }
                    className="py-3 px-4 cursor-pointer hover:text-stone-800 dark:hover:text-stone-200 select-none text-right"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Size</span>
                      <ArrowUpDown className="w-3 h-3 text-stone-400 dark:text-stone-500" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center hidden md:table-cell">Type</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {filteredFiles.map((file) => {
                  const isMissing = file.status === 'missing';
                  const ext = getFileExtension(file.name);
                  const dateInfo = formatFileDate(file.created_at);
                  const isSelected = selectedIds.has(file.id);

                  return (
                    <tr
                      key={file.id}
                      onClick={() => !isMissing && onPreview(file, filteredFiles)}
                      className={`transition-colors group cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/30 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40'
                          : 'hover:bg-stone-50/80 dark:hover:bg-stone-800/50'
                      } ${
                        isMissing ? 'opacity-60 bg-red-50 dark:bg-red-950/10 cursor-default' : ''
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="py-3 px-3 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                        {!isMissing && (
                          <div
                            role="checkbox"
                            tabIndex={0}
                            aria-checked={isSelected}
                            onKeyDown={(e) => {
                              if (e.key === ' ' || e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                handleToggleSelect(file.id, e.shiftKey);
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelect(file.id, e.shiftKey);
                            }}
                            className={`w-4 h-4 mx-auto rounded flex items-center justify-center transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-stone-300 dark:border-stone-600 hover:border-stone-400 bg-white dark:bg-stone-800'
                            }`}
                            title={isSelected ? 'Deselect' : 'Select (Shift+click for range)'}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                          </div>
                        )}
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4 max-w-xs md:max-w-md truncate">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/40 shrink-0">
                            {getFileIcon(file.mime_type, file.name)}
                          </div>
                          <div className="truncate">
                            <span
                              className="font-medium text-stone-900 dark:text-stone-200 text-sm truncate block"
                              title={file.name}
                            >
                              {file.name}
                            </span>
                            {isMissing && (
                              <span className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                Deleted from Telegram
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-xs text-stone-500 dark:text-stone-400 hidden sm:table-cell" title={dateInfo.full}>
                        <div className="flex flex-col">
                          <span className="text-stone-800 dark:text-stone-300 font-normal">{dateInfo.display}</span>
                          {dateInfo.relative && dateInfo.relative !== dateInfo.display && (
                            <span className="text-[11px] text-stone-400 dark:text-stone-500">{dateInfo.relative}</span>
                          )}
                        </div>
                      </td>

                      {/* Size */}
                      <td className="py-3 px-4 text-xs text-stone-600 dark:text-stone-300 font-mono text-right">
                        {formatBytes(file.size)}
                      </td>

                      {/* Type format (plain text, no decorative pills) */}
                      <td className="py-3 px-4 text-xs text-stone-400 dark:text-stone-500 font-mono text-center hidden md:table-cell">
                        {ext}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          {!isMissing && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPreview(file, filteredFiles);
                              }}
                              className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                              title="View file"
                              aria-label={`View ${file.name}`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {!isMissing && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onShare(file);
                              }}
                              className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                              title="Share Link"
                              aria-label={`Share ${file.name}`}
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDownload(file);
                            }}
                            className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                            title="Download"
                            aria-label={`Download ${file.name}`}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(file);
                            }}
                            className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-stone-200/60 dark:hover:bg-stone-700/60 rounded-md transition-colors cursor-pointer"
                            title="Delete"
                            aria-label={`Delete ${file.name}`}
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

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        totalSize={selectedTotalSize}
        isProcessing={isProcessingBulk}
        onDownloadZip={() => onBulkDownloadZip?.(Array.from(selectedIds))}
        onMove={() => setIsMoveModalOpen(true)}
        onDelete={handleBulkDeleteAction}
        onClearSelection={() => {
          setSelectedIds(new Set());
          setLastSelectedId(null);
        }}
      />

      {/* Move Files Modal */}
      <MoveFilesModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        fileCount={selectedIds.size}
        folders={folders}
        currentFolderId={currentFolderId}
        onConfirmMove={async (destFolderId: string | null) => {
          if (!onBulkMove) return;
          setIsProcessingBulk(true);
          try {
            await onBulkMove(Array.from(selectedIds), destFolderId);
            setSelectedIds(new Set());
            setLastSelectedId(null);
            setIsMoveModalOpen(false);
          } finally {
            setIsProcessingBulk(false);
          }
        }}
        onFolderCreated={onFolderCreated}
      />
    </div>
  );
};
