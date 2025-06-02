'use client';

import { useTheme } from './ThemeProvider';
import { SunIcon, MoonIcon, DesktopComputerIcon } from '@heroicons/react/outline';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (theme === 'light') setTheme('dark');
          else if (theme === 'dark') setTheme('system');
          else setTheme('light');
        }}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="テーマを切り替える"
      >
        {resolvedTheme === 'dark' ? (
          <MoonIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        ) : (
          <SunIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        )}
      </button>
      
      {theme === 'system' && (
        <span className="absolute -bottom-1 -right-1">
          <DesktopComputerIcon className="h-3 w-3 text-gray-500 dark:text-gray-500" />
        </span>
      )}
    </div>
  );
}