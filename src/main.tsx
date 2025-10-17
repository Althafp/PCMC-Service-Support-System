import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DepartmentProvider } from './contexts/DepartmentContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DepartmentProvider>
      <App />
    </DepartmentProvider>
  </StrictMode>
);
