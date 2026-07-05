'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { MobileBottomNav } from '@/components/layout/bottom-nav';
import { AnimatedBackdrop } from '@/components/ui/animated-backdrop';
import { useViewMode } from '@/lib/view-mode';
import { HomeView } from '@/components/views/home-view';
import { MemoriesView } from '@/components/views/memories-view';
import { GraphView } from '@/components/views/graph-view';
import { ContextView } from '@/components/views/context-view';
import { IntegrationsView } from '@/components/views/integrations-view';
import { DocsView } from '@/components/views/docs-view';
import { McpView } from '@/components/views/mcp-view';
import { SettingsView } from '@/components/views/settings-view';
import { SearchModal } from '@/components/search-modal';
import { AddMemoryModal } from '@/components/add-memory-modal';
import { cn } from '@/lib/utils';

export function AppExperience() {
  const { viewMode } = useViewMode();
  const [searchOpen, setSearchOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const showBackdrop = ['home', 'memories', 'graph', 'integrations', 'docs', 'mcp'].includes(viewMode);
  const isFullHeight = viewMode === 'graph' || viewMode === 'context';
  const showBottomNav = viewMode !== 'context';

  return (
    <div
      className={cn(
        'relative flex min-h-dvh flex-col bg-[#05080D]',
        isFullHeight && 'h-dvh overflow-hidden',
        showBottomNav && 'pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0',
      )}
    >
      {showBackdrop && <AnimatedBackdrop />}

      <AppHeader
        onAddMemory={() => setAddOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <AnimatePresence mode="wait">
        <motion.main
          key={viewMode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className={cn('relative z-10 flex min-h-0 flex-1 flex-col', isFullHeight && 'overflow-hidden')}
        >
          {viewMode === 'home' && <HomeView onAddMemory={() => setAddOpen(true)} />}
          {viewMode === 'memories' && <MemoriesView />}
          {viewMode === 'graph' && <GraphView />}
          {viewMode === 'context' && <ContextView />}
          {viewMode === 'integrations' && <IntegrationsView />}
          {viewMode === 'docs' && <DocsView />}
          {viewMode === 'mcp' && <McpView />}
          {viewMode === 'settings' && <SettingsView />}
        </motion.main>
      </AnimatePresence>

      {showBottomNav && (
        <MobileBottomNav
          onAddMemory={() => setAddOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />
      )}

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AddMemoryModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
