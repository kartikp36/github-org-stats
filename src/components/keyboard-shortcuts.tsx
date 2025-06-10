'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

interface KeyboardShortcutsProps {
  onFetchStats: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onCopyToClipboard: () => void;
}

export function useKeyboardShortcuts({
  onFetchStats,
  onExportCSV,
  onExportJSON,
  onCopyToClipboard,
}: KeyboardShortcutsProps) {
  const { setTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger shortcuts when not typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl/Cmd + Enter to fetch stats
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        onFetchStats();
        toast.info('Fetching stats...', {
          description: 'Press Ctrl/Cmd + Enter to fetch stats',
        });
      }

      // Ctrl/Cmd + Shift + E to export CSV
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        onExportCSV();
        toast.info('Exporting CSV...', {
          description: 'Press Ctrl/Cmd + Shift + E to export CSV',
        });
      }

      // Ctrl/Cmd + Shift + J to export JSON
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        onExportJSON();
        toast.info('Exporting JSON...', {
          description: 'Press Ctrl/Cmd + Shift + J to export JSON',
        });
      }

      // Ctrl/Cmd + Shift + C to copy to clipboard
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        onCopyToClipboard();
        toast.info('Copying to clipboard...', {
          description: 'Press Ctrl/Cmd + Shift + C to copy to clipboard',
        });
      }

      // Ctrl/Cmd + Shift + T to toggle theme
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        setTheme((theme) => (theme === 'dark' ? 'light' : 'dark'));
        toast.info('Toggling theme...', {
          description: 'Press Ctrl/Cmd + Shift + T to toggle theme',
        });
      }

      // Ctrl/Cmd + K to show keyboard shortcuts help
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toast.info('Keyboard Shortcuts', {
          description: (
            <div className='space-y-2'>
              <p>Ctrl/Cmd + Enter: Fetch stats</p>
              <p>Ctrl/Cmd + Shift + E: Export CSV</p>
              <p>Ctrl/Cmd + Shift + J: Export JSON</p>
              <p>Ctrl/Cmd + Shift + C: Copy to clipboard</p>
              <p>Ctrl/Cmd + Shift + T: Toggle theme</p>
              <p>Ctrl/Cmd + K: Show this help</p>
            </div>
          ),
          duration: 5000,
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFetchStats, onExportCSV, onExportJSON, onCopyToClipboard, setTheme]);
}
