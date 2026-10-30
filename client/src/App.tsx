import { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { FileGrid } from './components/FileGrid.js';
import { UploadModal } from './components/UploadModal.js';
import { ShareModal } from './components/ShareModal.js';
import { PreviewModal } from './components/PreviewModal.js';
import { AuthModal } from './components/AuthModal.js';
import { PublicSharePage } from './pages/PublicSharePage.js';
import { api } from './api.js';
import { AuthStatus, FileRecord, Folder } from './types.js';

export function App() {
  // Check if we are on a public share link route: /s/:slug
  const path = window.location.pathname;
  if (path.startsWith('/s/')) {
    const slug = path.replace('/s/', '').split('/')[0];
    if (slug) {
      return <PublicSharePage slug={slug} />;
    }
  }

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

  const handleSync = async () => {
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
      console.error('Sync failed:', e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadData = async () => {
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
    } catch (err) {
      console.error('Error loading drive data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentFolderId, search]);

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
    if (confirm(`Delete "${file.name}" from drive index?`)) {
      try {
        await api.deleteFile(file.id);
        loadData();
      } catch (err) {
        alert('Failed to delete file');
      }
    }
  };

  const handleDownloadFile = (file: FileRecord) => {
    window.location.href = `/api/files/${file.id}/download`;
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-stone-900 text-stone-100">
      <Header
        search={search}
        onSearchChange={setSearch}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenNewFolder={handleCreateFolder}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSync={handleSync}
        isSyncing={isSyncing}
        authStatus={authStatus}
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
