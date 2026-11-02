import { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { FileGrid } from './components/FileGrid.js';
import { UploadModal } from './components/UploadModal.js';
import { ShareModal } from './components/ShareModal.js';
import { PreviewModal } from './components/PreviewModal.js';
import { AuthModal } from './components/AuthModal.js';
import { SetupScreen } from './components/SetupScreen.js';
import { LoginScreen } from './components/LoginScreen.js';
import { DartLogo } from './components/DartLogo.js';
import { PublicSharePage } from './pages/PublicSharePage.js';
import { api } from './api.js';
import { AppUser, AuthStatus, FileRecord, Folder, SetupStatus, Theme } from './types.js';

export function App() {
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

  // 2. First-time Master Account Setup Wizard
  if (setupStatus?.needsSetup) {
    return (
      <SetupScreen
        onSetupSuccess={handleAuthComplete}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  // 3. Returning Master Account Login Gate
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleAuthComplete}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  // 4. Authenticated Cloud Storage Dashboard
  const handleCreateFolder = async () => {
    const name = window.prompt('Enter folder name:');
    if (name && name.trim()) {
      try {
        await api.createFolder(name.trim(), currentFolderId);
        loadData();
      } catch (err) {
        alert('Failed to create folder');
      }
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      await api.deleteFolder(id);
      if (currentFolderId === id) {
        setCurrentFolderId(null);
      }
      loadData();
    } catch (err) {
      alert('Failed to delete folder');
    }
  };

  const handleDeleteFile = async (file: FileRecord) => {
    if (
      confirm(
        `Delete "${file.name}"?\nThis will permanently delete it from Dart and your Telegram Saved Messages.`
      )
    ) {
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
        alert(`Failed to delete file: ${e.message}`);
        loadData();
      }
    }
  };

  const handleDownloadFile = (file: FileRecord) => {
    window.location.href = `/api/files/${file.id}/download`;
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 transition-colors">
      <Header
        search={search}
        onSearchChange={setSearch}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenNewFolder={handleCreateFolder}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSync={handleSync}
        isSyncing={isSyncing}
        authStatus={authStatus}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          folders={folders}
          currentFolderId={currentFolderId}
          onSelectFolder={setCurrentFolderId}
          onDeleteFolder={handleDeleteFolder}
          onNewFolder={handleCreateFolder}
          totalFilesCount={files.length}
          totalSize={totalSize}
        />

        <FileGrid
          files={files}
          folders={folders}
          currentFolderId={currentFolderId}
          searchQuery={search}
          onClearSearch={() => setSearch('')}
          onNavigateFolder={setCurrentFolderId}
          onPreview={(f) => setPreviewTargetFile(f)}
          onDownload={handleDownloadFile}
          onShare={(f) => setShareTargetFile(f)}
          onDelete={handleDeleteFile}
          onSync={handleSync}
          isSyncing={isSyncing}
        />
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        folderId={currentFolderId}
        onUploadComplete={loadData}
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
        onDownload={handleDownloadFile}
        onDelete={handleDeleteFile}
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
