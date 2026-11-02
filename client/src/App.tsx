import { useState, useEffect, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { FileGrid } from './components/FileGrid.js';
import { UploadModal } from './components/UploadModal.js';
import { ShareModal } from './components/ShareModal.js';
import { PreviewModal } from './components/PreviewModal.js';
import { AuthModal } from './components/AuthModal.js';
import { LoginScreen } from './components/LoginScreen.js';
import { DartLogo } from './components/DartLogo.js';
import { PublicSharePage } from './pages/PublicSharePage.js';
import { api, formatBytes } from './api.js';
import { useDialog } from './context/DialogContext.js';
import { AppUser, AuthStatus, FileRecord, Folder, SetupStatus, Theme } from './types.js';

export function App() {
  const dialog = useDialog();
  // Check if we are on a public share link route: /s/:slug
  const path = window.location.pathname;
  if (path.startsWith('/s/')) {
    const slug = path.replace('/s/', '').split('/')[0];
    if (slug) {
      return <PublicSharePage slug={slug} />;
    }
  }

  // Theme state (light / dark)
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('dart_theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('dart_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Master Authentication & Onboarding state
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Dashboard state
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasInitialSynced, setHasInitialSynced] = useState(false);
  const [shareTargetFile, setShareTargetFile] = useState<FileRecord | null>(null);
  const [previewTargetFile, setPreviewTargetFile] = useState<FileRecord | null>(null);
  const [previewFileList, setPreviewFileList] = useState<FileRecord[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcuts (Cmd+K / Ctrl+K for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global Drag-and-Drop file upload listener
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDraggingGlobal(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsDraggingGlobal(false);
        dragCounter = 0;
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDraggingGlobal(false);
      if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
        setDroppedFile(e.dataTransfer.files[0]);
        setIsUploadOpen(true);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Check initial master setup & session status
  const checkMasterAuth = async () => {
    try {
      const status = await api.getSetupStatus();
      setSetupStatus(status);
      if (status.authenticated && status.user) {
        setCurrentUser(status.user);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Failed to verify setup status:', err);
    } finally {
      setIsAuthChecking(false);
    }
  };

  useEffect(() => {
    checkMasterAuth();
  }, []);

  const handleSync = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      await api.syncFiles();
      const [status, loadedFolders, loadedFiles] = await Promise.all([
        api.getAuthStatus(),
        api.getFolders(null),
        api.getFiles(currentFolderId, search),
      ]);
      setAuthStatus(status);
      setFolders(loadedFolders);
      setFiles(loadedFiles);
    } catch (err: unknown) {
      const e = err as Error;
      if (e.message.includes('401') || e.message.toLowerCase().includes('unauthorized')) {
        setCurrentUser(null);
      }
      console.error('Sync failed:', e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadData = async () => {
    if (!currentUser) return;
    try {
      const folderParam = currentFolderId === '__recent__' ? null : currentFolderId;
      const [status, loadedFolders, loadedFiles] = await Promise.all([
        api.getAuthStatus(),
        api.getFolders(null),
        api.getFiles(folderParam, search),
      ]);
      setAuthStatus(status);
      setFolders(loadedFolders);
      setFiles(loadedFiles);

      // Auto-scan on load if authorized but local index is empty
      if (status.authorized && loadedFiles.length === 0 && !hasInitialSynced && !search && currentFolderId === null) {
        setHasInitialSynced(true);
        handleSync();
      }
    } catch (err: unknown) {
      const e = err as Error;
      if (e.message && (e.message.includes('401') || e.message.toLowerCase().includes('unauthorized'))) {
        setCurrentUser(null);
      }
      console.error('Error loading drive data:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentFolderId, search, currentUser]);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setSetupStatus((prev) => (prev ? { ...prev, authenticated: false, user: null } : null));
    setFolders([]);
    setFiles([]);
  };

  const handleAuthComplete = (user: AppUser) => {
    setCurrentUser(user);
    setSetupStatus({ needsSetup: false, authenticated: true, user });
  };

  // 1. Initial Auth Loading State
  if (isAuthChecking) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors">
        <div className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-lg animate-pulse mb-4">
          <DartLogo size={36} />
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400">Loading Dart...</p>
      </div>
    );
  }

  // 2. User Authentication Gate (Login with existing account or register new)
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleAuthComplete}
        initialMode={setupStatus?.needsSetup ? 'register' : 'login'}
        isFirstRun={setupStatus?.needsSetup}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  // 4. Authenticated Cloud Storage Dashboard
  const handleCreateFolder = async () => {
    const name = await dialog.prompt({
      title: 'New Folder',
      message: 'Enter a name for the new folder:',
      placeholder: 'e.g. Documents, Invoices, Backups',
      confirmText: 'Create Folder',
      validate: (val) => (!val.trim() ? 'Folder name cannot be empty' : null),
    });

    if (name && name.trim()) {
      try {
        await api.createFolder(name.trim(), currentFolderId);
        loadData();
      } catch (err: unknown) {
        const e = err as Error;
        await dialog.alert({
          title: 'Failed to Create Folder',
          message: e.message || 'Could not create folder. Please try again.',
          type: 'error',
        });
      }
    }
  };

  const handleDeleteFolder = async (id: string, folderName?: string) => {
    const name = folderName || folders.find((f) => f.id === id)?.name || 'this folder';
    const confirmed = await dialog.confirm({
      title: 'Delete Folder',
      message: `Are you sure you want to delete "${name}"?\nFiles inside will not be deleted; they will be moved to the root drive.`,
      confirmText: 'Delete Folder',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await api.deleteFolder(id);
      if (currentFolderId === id) {
        setCurrentFolderId(null);
      }
      loadData();
    } catch (err: unknown) {
      const e = err as Error;
      await dialog.alert({
        title: 'Failed to Delete Folder',
        message: e.message || 'Could not delete folder.',
        type: 'error',
      });
    }
  };

  const handleDeleteFile = async (file: FileRecord) => {
    const confirmed = await dialog.confirm({
      title: 'Delete File',
      message: `Are you sure you want to delete "${file.name}"?\nThis will permanently remove it from Dart and your Telegram Saved Messages.`,
      confirmText: 'Delete Permanently',
      variant: 'danger',
      icon: 'trash',
    });

    if (!confirmed) return;

    // 1. Optimistic removal for instant UI response
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    if (previewTargetFile?.id === file.id) {
      setPreviewTargetFile(null);
    }
    if (shareTargetFile?.id === file.id) {
      setShareTargetFile(null);
    }

    try {
      await api.deleteFile(file.id);
      loadData();
    } catch (err: unknown) {
      const e = err as Error;
      await dialog.alert({
        title: 'Deletion Failed',
        message: e.message || 'Failed to delete file from Telegram.',
        type: 'error',
      });
      loadData();
    }
  };

  const handleDownloadFile = (file: FileRecord) => {
    window.location.href = `/api/files/${file.id}/download`;
  };

  const handleBulkDelete = async (fileIds: string[]) => {
    if (fileIds.length === 0) return;
    const confirmed = await dialog.confirm({
      title: 'Delete Files',
      message: `Are you sure you want to delete ${fileIds.length} ${fileIds.length === 1 ? 'file' : 'files'}?\nThis will permanently remove them from Dart and Telegram Saved Messages.`,
      confirmText: `Delete ${fileIds.length} Files`,
      variant: 'danger',
      icon: 'trash',
    });

    if (!confirmed) return;

    // Optimistic removal for instant UI response
    const idsSet = new Set(fileIds);
    setFiles((prev) => prev.filter((f) => !idsSet.has(f.id)));
    if (previewTargetFile && idsSet.has(previewTargetFile.id)) {
      setPreviewTargetFile(null);
    }
    if (shareTargetFile && idsSet.has(shareTargetFile.id)) {
      setShareTargetFile(null);
    }

    try {
      await api.bulkDelete(fileIds);
      loadData();
    } catch (err: unknown) {
      const e = err as Error;
      await dialog.alert({
        title: 'Bulk Deletion Failed',
        message: e.message || 'Failed to delete selected files.',
        type: 'error',
      });
      loadData();
    }
  };

  const handleBulkMove = async (fileIds: string[], folderId: string | null) => {
    if (fileIds.length === 0) return;
    try {
      await api.bulkMove(fileIds, folderId);
      loadData();
    } catch (err: unknown) {
      const e = err as Error;
      await dialog.alert({
        title: 'Move Failed',
        message: e.message || 'Failed to move selected files.',
        type: 'error',
      });
    }
  };

  const handleBulkDownloadZip = (fileIds: string[]) => {
    if (fileIds.length === 0) return;
    const selected = files.filter((f) => fileIds.includes(f.id));
    const totalSize = selected.reduce((acc, f) => acc + f.size, 0);
    const ONE_GB = 1024 * 1024 * 1024;
    if (totalSize > ONE_GB) {
      dialog.alert({
        title: 'Download Limit Exceeded',
        message: `The total size of the selected files (${formatBytes(totalSize)}) exceeds the 1 GB batch limit. Please select fewer files.`,
        type: 'error',
      });
      return;
    }
    window.location.href = api.getZipDownloadUrl(fileIds);
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 transition-colors">
      <Header
        search={search}
        onSearchChange={setSearch}
        onOpenUpload={() => {
          setDroppedFile(null);
          setIsUploadOpen(true);
        }}
        onOpenNewFolder={handleCreateFolder}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSync={handleSync}
        isSyncing={isSyncing}
        authStatus={authStatus}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentUser={currentUser}
        onLogout={handleLogout}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        searchInputRef={searchInputRef}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          folders={folders}
          currentFolderId={currentFolderId}
          onSelectFolder={setCurrentFolderId}
          onDeleteFolder={handleDeleteFolder}
          onNewFolder={handleCreateFolder}
          totalFilesCount={files.length}
          totalSize={totalSize}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <FileGrid
          files={files}
          folders={folders}
          currentFolderId={currentFolderId}
          searchQuery={search}
          onClearSearch={() => setSearch('')}
          onNavigateFolder={setCurrentFolderId}
          onPreview={(f, list) => {
            setPreviewTargetFile(f);
            setPreviewFileList(list || files);
          }}
          onDownload={handleDownloadFile}
          onShare={(f) => setShareTargetFile(f)}
          onDelete={handleDeleteFile}
          onSync={handleSync}
          isSyncing={isSyncing}
          onBulkDelete={handleBulkDelete}
          onBulkMove={handleBulkMove}
          onBulkDownloadZip={handleBulkDownloadZip}
          onFolderCreated={loadData}
        />
      </div>

      {/* Global Drag and Drop Overlay */}
      {isDraggingGlobal && (
        <div className="fixed inset-0 z-50 bg-emerald-950/30 dark:bg-emerald-950/50 backdrop-blur-xs flex items-center justify-center p-6 border-4 border-dashed border-emerald-500 pointer-events-none transition-all">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl p-8 border border-emerald-500/40 text-center space-y-3">
            <UploadCloud className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <div className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Drop files to upload to Saved Messages
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400">
              Release anywhere to upload into {currentFolderId ? 'the active folder' : 'All Files'}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setDroppedFile(null);
        }}
        initialFile={droppedFile}
        folderId={currentFolderId}
        onUploadComplete={() => {
          setDroppedFile(null);
          loadData();
        }}
      />

      <ShareModal
        isOpen={Boolean(shareTargetFile)}
        onClose={() => setShareTargetFile(null)}
        file={shareTargetFile}
      />

      <PreviewModal
        isOpen={Boolean(previewTargetFile)}
        onClose={() => setPreviewTargetFile(null)}
        file={previewTargetFile}
        files={previewFileList}
        onNavigate={(f) => setPreviewTargetFile(f)}
        onDownload={handleDownloadFile}
        onDelete={handleDeleteFile}
        onShare={(f) => setShareTargetFile(f)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={() => {
          loadData();
          handleSync();
        }}
      />
    </div>
  );
}

export default App;
