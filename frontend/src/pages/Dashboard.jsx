import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, RefreshCw, ShieldAlert, ChevronRight, Users, FlaskConical } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useAdminStore } from '../stores/adminStore';
import { useObservabilityStore } from '../stores/observabilityStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ThemeToggle from '@/components/ThemeToggle';
import LeafIcon from '@/components/icons/leaf-icon';
import { cn } from '@/lib/utils';
import UsersView from './admin/UsersView';
import EvaluationsView from './admin/EvaluationsView';

// Optional: same email as ADMIN_EMAIL in backend/.env. The server also reports `isAdmin`.
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || '';

const TABS = {
  users: { label: 'Users', icon: Users },
  evals: { label: 'Evaluations', icon: FlaskConical },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { authUser, checkAuth } = useAuthStore();
  const [tab, setTab] = useState(pathname === '/admin/evals' ? 'evals' : 'users');

  // Opening /dashboard directly (or refreshing it) skips the workspace, so check the session here.
  const [authChecked, setAuthChecked] = useState(Boolean(authUser));
  useEffect(() => {
    if (authUser) {
      setAuthChecked(true);
      return;
    }
    let active = true;
    Promise.resolve(checkAuth()).finally(() => active && setAuthChecked(true));
    return () => {
      active = false;
    };
  }, [authUser, checkAuth]);

  const refreshUsers = useAdminStore((s) => s.refreshAll);
  const usersLoading = useAdminStore((s) => s.isLoadingOverview || s.isLoadingUsers);
  const { fetchMetrics, fetchTraces, isLoadingMetrics, isLoadingTraces } = useObservabilityStore();

  const isAdmin =
    authUser?.isAdmin ||
    authUser?.role === 'admin' ||
    (ADMIN_EMAIL && authUser?.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase());

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sidebar">
        <RefreshCw className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sidebar p-6">
        <div className="w-full max-w-sm rounded-xl border border-border bg-background p-8 text-center shadow-sm">
          <span className="mx-auto flex size-11 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 text-destructive">
            <ShieldAlert className="size-5" />
          </span>
          <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">Admins only</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">The admin dashboard is available to administrators.</p>
          <Button variant="outline" className="mt-6 w-full" onClick={() => navigate('/workspace')}>
            <ArrowLeft /> Back to workspace
          </Button>
        </div>
      </div>
    );
  }

  const refreshing = tab === 'users' ? usersLoading : isLoadingMetrics || isLoadingTraces;
  const refresh = async () => {
    if (tab === 'users') await refreshUsers();
    else await Promise.all([fetchMetrics(), fetchTraces()]);
    toast.success('Dashboard refreshed');
  };

  return (
    <div className="flex h-screen flex-col bg-sidebar text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate('/workspace')} aria-label="Back to workspace">
            <ArrowLeft />
          </Button>
          <button
            type="button"
            onClick={() => navigate('/workspace')}
            className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent cursor-pointer"
          >
            <LeafIcon size={18} strokeWidth={2.4} className="text-brand-app" />
            <span className="text-[15px] font-semibold tracking-tight">Sagewell</span>
          </button>
          <ChevronRight className="size-4 text-muted-foreground/60" />
          <span className="truncate text-sm text-muted-foreground">Admin</span>
        </div>
        <ThemeToggle className="size-8" />
      </header>

      <main className="flex-1 overflow-hidden px-2 pb-2">
        <div className="h-full overflow-y-auto rounded-xl border border-border bg-background shadow-xs">
          <Tabs value={tab} onValueChange={setTab} className="mx-auto max-w-7xl gap-3 p-3 md:p-4">
            <h1 className="sr-only">Admin dashboard</h1>
            <div className="flex items-center justify-between gap-2">
              <TabsList className="h-8">
                {Object.entries(TABS).map(([key, { label, icon: Icon }]) => (
                  <TabsTrigger key={key} value={key} className="px-3 text-[13px]">
                    <Icon /> {label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
                <RefreshCw className={cn(refreshing && 'animate-spin')} /> Refresh
              </Button>
            </div>

            <TabsContent value="users" className="animate-in fade-in-0 duration-300">
              <UsersView />
            </TabsContent>
            <TabsContent value="evals" className="animate-in fade-in-0 duration-300">
              <EvaluationsView />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
