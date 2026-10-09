import { useCallback, useRef, useEffect, useState } from 'react';
import { PanelLeftClose, PanelRightClose, PanelLeftOpen, PanelRightOpen, Maximize2, Minimize2, Library, BookOpenText, MessagesSquare } from 'lucide-react';
import { usePanelStore } from '../stores/panelStore';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import SourcePanel from './SourcePanel';
import ContentPanel from './ContentPanel';
import ChatPanel from './ChatPanel';

function PanelDivider({ onDrag }) {
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e) => {
      if (isDragging.current) {
        onDrag(e.clientX);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onDrag]);

  return <div className="panel-divider" onMouseDown={handleMouseDown} role="separator" aria-orientation="vertical" aria-label="Resize panel" />;
}

/** Icon button with a tooltip, used for the panel collapse / fullscreen controls. */
function ControlButton({ label, onClick, children }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer [&_svg]:size-3.5"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

/** Collapse + fullscreen controls rendered at the right end of each panel's own header. */
function PanelControls({ onCollapse, collapseIcon: CollapseIcon, onFullscreen, isFullscreen }) {
  return (
    <div className="flex items-center">
      {onFullscreen && (
        <ControlButton label={isFullscreen ? 'Exit full screen' : 'Full screen'} onClick={onFullscreen}>
          {isFullscreen ? <Minimize2 /> : <Maximize2 />}
        </ControlButton>
      )}
      {onCollapse && (
        <ControlButton label="Collapse panel" onClick={onCollapse}>
          <CollapseIcon />
        </ControlButton>
      )}
    </div>
  );
}

/** Narrow rail shown in place of a collapsed panel. */
function CollapsedRail({ label, icon: Icon, expandIcon: ExpandIcon, onExpand }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      aria-label={`Expand ${label}`}
      className="flex w-11 shrink-0 flex-col items-center gap-3 rounded-xl border border-border bg-background py-3 text-muted-foreground shadow-xs transition-colors hover:text-foreground cursor-pointer"
    >
      <ExpandIcon className="size-4" />
      <Icon className="size-4" />
      <span className="text-xs font-medium" style={{ writingMode: 'vertical-lr' }}>
        {label}
      </span>
    </button>
  );
}

const panelCard = 'flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xs';

// Mobile tab bar
function MobileTabBar({ activeTab, setActiveTab }) {
  const tabs = [
    { key: 'source', label: 'Sources', icon: Library },
    { key: 'content', label: 'Reader', icon: BookOpenText },
    { key: 'chat', label: 'Dialogue', icon: MessagesSquare },
  ];

  return (
    <div className="shrink-0 px-2 pt-2 md:hidden">
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1" role="tablist">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-all cursor-pointer',
              activeTab === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WorkspaceLayout() {
  const {
    sourceWidth,
    chatWidth,
    sourceCollapsed,
    chatCollapsed,
    fullscreenPanel,
    setSourceWidth,
    setChatWidth,
    toggleSourceCollapsed,
    toggleChatCollapsed,
    toggleFullscreen,
    activeTab,
    setActiveTab,
  } = usePanelStore();

  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSourceDrag = useCallback((clientX) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Minus the 8px frame padding so the handle stays under the cursor.
      setSourceWidth(clientX - rect.left - 8);
    }
  }, [setSourceWidth]);

  const handleChatDrag = useCallback((clientX) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setChatWidth(rect.right - clientX - 8);
    }
  }, [setChatWidth]);

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 overflow-hidden p-2">
          <div className={cn(panelCard, 'h-full')}>
            {activeTab === 'source' && <SourcePanel />}
            {activeTab === 'content' && <ContentPanel />}
            {activeTab === 'chat' && <ChatPanel />}
          </div>
        </div>
      </div>
    );
  }

  // Fullscreen single panel
  if (fullscreenPanel) {
    const panels = { source: SourcePanel, content: ContentPanel, chat: ChatPanel };
    const PanelComponent = panels[fullscreenPanel];

    return (
      <div className="flex flex-1 overflow-hidden p-2 pt-0">
        <div className={cn(panelCard, 'flex-1')}>
          <PanelComponent
            headerActions={<PanelControls onFullscreen={() => toggleFullscreen(fullscreenPanel)} isFullscreen />}
          />
        </div>
      </div>
    );
  }

  // Desktop three-panel layout
  return (
    <div ref={containerRef} className="workspace-panels flex flex-1 overflow-hidden px-2 pb-2">
      {!sourceCollapsed ? (
        <div className={cn(panelCard, 'shrink-0')} style={{ width: `${sourceWidth}px` }}>
          <SourcePanel
            headerActions={
              <PanelControls
                onCollapse={toggleSourceCollapsed}
                collapseIcon={PanelLeftClose}
                onFullscreen={() => toggleFullscreen('source')}
              />
            }
          />
        </div>
      ) : (
        <CollapsedRail label="Sources" icon={Library} expandIcon={PanelLeftOpen} onExpand={toggleSourceCollapsed} />
      )}

      {!sourceCollapsed ? <PanelDivider onDrag={handleSourceDrag} /> : <div className="w-2 shrink-0" />}

      <div className={cn(panelCard, 'min-w-0 flex-1')}>
        <ContentPanel headerActions={<PanelControls onFullscreen={() => toggleFullscreen('content')} />} />
      </div>

      {!chatCollapsed ? <PanelDivider onDrag={handleChatDrag} /> : <div className="w-2 shrink-0" />}

      {!chatCollapsed ? (
        <div className={cn(panelCard, 'shrink-0')} style={{ width: `${chatWidth}px` }}>
          <ChatPanel
            headerActions={
              <PanelControls
                onCollapse={toggleChatCollapsed}
                collapseIcon={PanelRightClose}
                onFullscreen={() => toggleFullscreen('chat')}
              />
            }
          />
        </div>
      ) : (
        <CollapsedRail label="Dialogue" icon={MessagesSquare} expandIcon={PanelRightOpen} onExpand={toggleChatCollapsed} />
      )}
    </div>
  );
}
