import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { logWithTimestamp } from './utils/logger';

logWithTimestamp('[main.tsx] Script execution started');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

logWithTimestamp('[main.tsx] ReactDOM.render called');
