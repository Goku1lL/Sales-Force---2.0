// Theme System Architecture
// Proper separation of concerns with OOP principles

export type Theme = 'light' | 'dark' | 'darkNeon';

export interface ThemeConfig {
  name: Theme;
  isDark: boolean;
  isNeon: boolean;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    card: string;
    border: string;
  };
  components: {
    card: {
      background: string;
      border: string;
      shadow: string;
    };
    text: {
      primary: string;
      secondary: string;
      accent: string;
    };
    progress: {
      track: string;
      fill: string;
    };
  };
}

// Theme Factory Pattern
export class ThemeFactory {
  static createTheme(theme: Theme): ThemeConfig {
    switch (theme) {
      case 'light':
        return new LightTheme();
      case 'dark':
        return new DarkTheme();
      case 'darkNeon':
        return new DarkNeonTheme();
      default:
        return new LightTheme();
    }
  }
}

// Abstract Base Theme
abstract class BaseTheme implements ThemeConfig {
  abstract name: Theme;
  abstract isDark: boolean;
  abstract isNeon: boolean;
  abstract colors: ThemeConfig['colors'];
  abstract components: ThemeConfig['components'];
}

// Concrete Theme Implementations
class LightTheme extends BaseTheme {
  name: Theme = 'light';
  isDark = false;
  isNeon = false;
  
  colors = {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    background: '#F9FAFB',
    text: '#111827',
    card: '#FFFFFF',
    border: '#E5E7EB'
  };
  
  components = {
    card: {
      background: 'bg-white',
      border: 'border-gray-200',
      shadow: 'shadow-lg'
    },
    text: {
      primary: 'text-gray-900',
      secondary: 'text-gray-600',
      accent: 'text-blue-600'
    },
    progress: {
      track: 'bg-gray-200',
      fill: 'bg-blue-500'
    }
  };
}

class DarkTheme extends BaseTheme {
  name: Theme = 'dark';
  isDark = true;
  isNeon = false;
  
  colors = {
    primary: '#60A5FA',
    secondary: '#A78BFA',
    background: '#111827',
    text: '#F9FAFB',
    card: '#1F2937',
    border: '#374151'
  };
  
  components = {
    card: {
      background: 'bg-gray-800',
      border: 'border-gray-700',
      shadow: 'shadow-2xl'
    },
    text: {
      primary: 'text-white',
      secondary: 'text-gray-300',
      accent: 'text-cyan-300'
    },
    progress: {
      track: 'bg-gray-700',
      fill: 'bg-cyan-500'
    }
  };
}

class DarkNeonTheme extends BaseTheme {
  name: Theme = 'darkNeon';
  isDark = true;
  isNeon = true;
  
  colors = {
    primary: '#22D3EE',
    secondary: '#A78BFA',
    background: '#0C0F17',
    text: '#E6F6FF',
    card: '#11162A',
    border: '#1E293B'
  };
  
  components = {
    card: {
      background: 'bg-[var(--card)]/75',
      border: 'ring-1 ring-inset ring-white/10',
      shadow: 'shadow-2xl shadow-cyan-500/20'
    },
    text: {
      primary: 'text-[var(--text)]',
      secondary: 'text-[var(--muted)]',
      accent: 'text-cyan-300'
    },
    progress: {
      track: 'bg-white/8',
      fill: 'bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink'
    }
  };
}

// Theme Context with proper separation
export interface ThemeContextType {
  currentTheme: ThemeConfig;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Component-specific theme utilities
export class ThemeUtils {
  static getCardClasses(theme: ThemeConfig, accent: 'amber' | 'purple' = 'amber') {
    const baseClasses = [
      'relative rounded-2xl p-6 overflow-hidden',
      theme.components.card.background,
      theme.components.card.border,
      theme.components.card.shadow
    ];
    
    if (theme.isNeon) {
      // Add neon-specific styling
      baseClasses.push('before:absolute before:inset-0 before:rounded-2xl before:p-[1.5px] before:bg-gradient-to-r before:opacity-30');
    }
    
    return baseClasses.join(' ');
  }
  
  static getTextClasses(theme: ThemeConfig, variant: 'primary' | 'secondary' | 'accent') {
    return theme.components.text[variant];
  }
  
  static getProgressClasses(theme: ThemeConfig, variant: 'track' | 'fill') {
    return theme.components.progress[variant];
  }
}
