import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';

const Game = lazy(() => import('./pages/Game'));
const ManageData = lazy(() => import('./pages/ManageData'));

const LocalApp = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <Routes>
        <Route path="/" element={<Navigate to="/Game" replace />} />
        <Route path="/Game" element={<Game />} />
        <Route path="/ManageData" element={<ManageData />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <LocalApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
