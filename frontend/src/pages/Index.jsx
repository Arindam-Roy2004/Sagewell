import { useEffect, useState, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSourceStore } from '../stores/sourceStore';
import AuthForm from '../components/AuthForm';
import Header from '../components/Header';
import WorkspaceLayout from '../components/WorkspaceLayout';
import CommandPalette from '../components/CommandPalette';
import LeafIcon from '../components/icons/leaf-icon';
import { Loader2 } from 'lucide-react';

// The marketing landing page is large and only shown to logged-out visitors on "/".
// Lazy-load it so it isn't bundled into the authenticated workspace's critical path.
const LandingPage = lazy(() => import('./LandingPage'));

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="flex animate-fade-in flex-col items-center gap-4">
      <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-background text-brand-app shadow-sm">
        <LeafIcon size={22} strokeWidth={2.2} />
      </span>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Opening your workspace…
      </div>
    </div>
  </div>
);

const Index = () => {
  const { authUser, isCheckingAuth, checkAuth } = useAuthStore();
  const { fetchSources } = useSourceStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Global Cmd/Ctrl+K toggles the command palette (only matters once authed).
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (authUser) {
      fetchSources();
      // If user is authed and on / or /auth, redirect to /workspace
      if (location.pathname === '/' || location.pathname === '/auth') {
        navigate('/workspace', { replace: true });
      }
    } else if (!isCheckingAuth && location.pathname === '/workspace') {
      navigate('/auth', { replace: true });
    }
  }, [authUser, isCheckingAuth, fetchSources, location.pathname, navigate]);

  if (isCheckingAuth) {
    return <LoadingScreen />;
  }

  // Not authenticated
  if (!authUser) {
    // Show auth form on /auth or /workspace, landing on /
    if (location.pathname === '/auth' || location.pathname === '/workspace') {
      return <AuthForm />;
    }
    return (
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <LandingPage />
      </Suspense>
    );
  }

  // Authenticated — show workspace
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-sidebar">
      <Header onOpenPalette={() => setPaletteOpen(true)} />
      <WorkspaceLayout />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
};

export default Index;