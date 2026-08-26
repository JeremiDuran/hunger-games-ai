/**
 * Centralized Keyboard Shortcut Registry
 * Single source of truth for key mappings, display labels, and categories.
 */

export interface ShortcutDefinition {
  id: string;
  keys: string[]; // e.g. ['KeyG', 'Space'] or ['Slash', 'KeyH']
  label: string;  // e.g. 'G' or '?'
  description: string;
  category: 'global' | 'landing' | 'auth' | 'story' | 'setup';
}

export const SHORTCUTS = {
  // Global / General shortcuts
  HELP: {
    id: 'HELP',
    keys: ['Slash', 'KeyH'],
    label: '?',
    description: 'Toggle Keyboard Shortcuts Guide',
    category: 'global',
  },
  ESCAPE: {
    id: 'ESCAPE',
    keys: ['Escape'],
    label: 'Esc',
    description: 'Close active modal / Return to previous view',
    category: 'global',
  },

  // Landing Page shortcuts
  GUEST_PLAY: {
    id: 'GUEST_PLAY',
    keys: ['KeyG'],
    label: 'G',
    description: 'Continue as Guest / Enter Local Arena',
    category: 'landing',
  },
  REGISTER: {
    id: 'REGISTER',
    keys: ['KeyR'],
    label: 'R',
    description: 'Apply as Gamemaker / Create Account',
    category: 'landing',
  },

  // Auth / Login shortcuts
  BACK_HOME: {
    id: 'BACK_HOME',
    keys: ['Escape'],
    label: 'Esc',
    description: 'Return to Perimeter (Home)',
    category: 'auth',
  },

  // Simulator / Story Viewer (Foundation for upcoming Game Engine)
  STORY_FORWARD: {
    id: 'STORY_FORWARD',
    keys: ['Space', 'Enter', 'ArrowRight'],
    label: 'Space / Enter / →',
    description: 'Advance to next event or phase',
    category: 'story',
  },
  STORY_BACKWARD: {
    id: 'STORY_BACKWARD',
    keys: ['ArrowLeft'],
    label: '←',
    description: 'Review previous event log',
    category: 'story',
  },
  STORY_AUTOPLAY: {
    id: 'STORY_AUTOPLAY',
    keys: ['KeyA'],
    label: 'A',
    description: 'Toggle Auto-Play mode',
    category: 'story',
  },
  STORY_SKIP: {
    id: 'STORY_SKIP',
    keys: ['KeyS'],
    label: 'S',
    description: 'Skip to summary of current phase',
    category: 'story',
  },
} as const satisfies Record<string, ShortcutDefinition>;

export type ShortcutAction = keyof typeof SHORTCUTS;

/**
 * Checks if a KeyboardEvent matches any of the given key codes.
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutDefinition): boolean {
  // Special case for '?' (Shift + Slash)
  if (shortcut.id === 'HELP') {
    if (event.key === '?' || (event.shiftKey && event.code === 'Slash') || (!event.shiftKey && event.code === 'KeyH')) {
      return true;
    }
  }

  // Check code match (e.g. event.code === 'KeyG')
  return shortcut.keys.includes(event.code);
}
