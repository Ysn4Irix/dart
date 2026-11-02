import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { DialogProvider } from './context/DialogContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <DialogProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </DialogProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
