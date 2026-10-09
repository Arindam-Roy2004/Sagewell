import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, LayoutDashboard, ChevronRight, Command, Github } from 'lucide-react';
import { Avatar, Kbd } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import ThemeToggle from './ThemeToggle';
import LeafIcon from './icons/leaf-icon';

// Optional: same email as ADMIN_EMAIL in backend/.env. Users with role "admin" always qualify.
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || '';
const REPO_URL = 'https://github.com/Arindam-Roy2004/Sagewell';

export default function Header({ onOpenPalette }) {
  const navigate = useNavigate();
  const iconRef = useRef(null);
  const { authUser, logout } = useAuthStore();
  const activeChat = useChatStore((s) => s.activeChat);
  const activeChatId = useChatStore((s) => s.activeChatId);

  const isAdmin =
    authUser?.role === 'admin' ||
    (ADMIN_EMAIL && authUser?.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase());
  const chatTitle = activeChat?.title || (activeChatId ? 'Current dialogue' : 'New dialogue');
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 px-4">
      {/* Brand + breadcrumb */}
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/workspace')}
          onMouseEnter={() => iconRef.current?.startAnimation()}
          onMouseLeave={() => iconRef.current?.stopAnimation()}
          className="flex shrink-0 items-center gap-2 rounded-md px-1.5 py-1 text-foreground transition-colors hover:bg-accent cursor-pointer"
          aria-label="Sagewell workspace"
        >
          <LeafIcon ref={iconRef} size={18} strokeWidth={2.4} className="text-brand-app" />
          <span className="text-[15px] font-semibold tracking-tight">Sagewell</span>
        </button>
        <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground/60 sm:block" />
        <span className="hidden truncate text-sm text-muted-foreground sm:block">{chatTitle}</span>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenPalette}
          className="hidden h-8 w-56 items-center gap-2 rounded-md border border-border bg-background px-2.5 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-accent md:flex cursor-pointer dark:bg-input/30"
          aria-label="Open command menu"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Search…</span>
          <Kbd>{isMac ? '⌘' : 'Ctrl'}K</Kbd>
        </button>
        <button
          type="button"
          onClick={onOpenPalette}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground md:hidden cursor-pointer"
          aria-label="Open command menu"
        >
          <Search className="size-4" />
        </button>

        <ThemeToggle className="size-8" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-0.5 rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-ring/50 cursor-pointer"
              aria-label="Account menu"
            >
              <Avatar src={authUser?.avatar} name={authUser?.name || authUser?.email || ''} className="size-8" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="flex items-center gap-2.5 px-2 py-2">
              <Avatar src={authUser?.avatar} name={authUser?.name || ''} className="size-8" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{authUser?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{authUser?.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onOpenPalette}>
              <Command /> Command menu
              <Kbd className="ml-auto">{isMac ? '⌘' : 'Ctrl'}K</Kbd>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onSelect={() => navigate('/dashboard')}>
                <LayoutDashboard /> Admin dashboard
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => window.open(REPO_URL, '_blank', 'noopener')}>
              <Github /> GitHub
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={logout}>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
