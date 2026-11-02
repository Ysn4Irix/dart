import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { DialogProvider } from './context/DialogContext.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DialogProvider>
      <App />
    </DialogProvider>
  </React.StrictMode>
);
