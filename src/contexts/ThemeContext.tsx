import React, { createContext, useContext, useState, useEffect } from 'react';

// Popular modern website color palettes
export const colorPalettes = {
  // Default - Current fitness theme
  fitness: {
    name: "Fitness Energy",
    description: "Energetic reds and corals for motivation",
    colors: {
      primary: "0 85% 60%",
      secondary: "15 75% 65%",
      accent: "345 85% 65%",
      gradientHero: "linear-gradient(135deg, hsl(0 85% 60%) 0%, hsl(345 85% 65%) 100%)",
      gradientPrimary: "linear-gradient(135deg, hsl(0 85% 60%), hsl(0 85% 50%))",
      gradientSecondary: "linear-gradient(135deg, hsl(15 75% 65%), hsl(15 75% 55%))",
      gradientAccent: "linear-gradient(135deg, hsl(345 85% 65%), hsl(345 85% 55%))",
    }
  },

  // Tech/Professional themes
  github: {
    name: "GitHub Dark",
    description: "Professional dark theme inspired by GitHub",
    colors: {
      primary: "213 93% 67%",
      secondary: "210 100% 60%",
      accent: "137 72% 94%",
      gradientHero: "linear-gradient(135deg, hsl(213 93% 67%) 0%, hsl(210 100% 60%) 100%)",
      gradientPrimary: "linear-gradient(135deg, hsl(213 93% 67%), hsl(213 93% 57%))",
      gradientSecondary: "linear-gradient(135deg, hsl(210 100% 60%), hsl(210 100% 50%))",
      gradientAccent: "linear-gradient(135deg, hsl(137 72% 94%), hsl(137 72% 84%))",
    }
  },

  notion: {
    name: "Notion Calm",
    description: "Clean and minimal like Notion",
    colors: {
      primary: "0 0% 9%",
      secondary: "210 40% 98%",
      accent: "47 100% 50%",
      gradientHero: "linear-gradient(135deg, hsl(0 0% 9%) 0%, hsl(220 13% 18%) 100%)",
      gradientPrimary: "linear-gradient(135deg, hsl(0 0% 9%), hsl(0 0% 15%))",
      gradientSecondary: "linear-gradient(135deg, hsl(210 40% 98%), hsl(210 40% 88%))",
      gradientAccent: "linear-gradient(135deg, hsl(47 100% 50%), hsl(47 100% 40%))",
    }
  },

  // Vibrant themes
  spotify: {
    name: "Spotify Green",
    description: "Bold green energy like Spotify",
    colors: {
      primary: "141 76% 48%",
      secondary: "142 69% 58%",
      accent: "49 100% 50%",
      gradientHero: "linear-gradient(135deg, hsl(141 76% 48%) 0%, hsl(142 69% 58%) 100%)",
      gradientPrimary: "linear-gradient(135deg, hsl(141 76% 48%), hsl(141 76% 38%))",
      gradientSecondary: "linear-gradient(135deg, hsl(142 69% 58%), hsl(142 69% 48%))",
      gradientAccent: "linear-gradient(135deg, hsl(49 100% 50%), hsl(49 100% 40%))",
    }
  },

  discord: {
    name: "Discord Purple",
    description: "Gaming-inspired purple theme",
    colors: {
      primary: "235 85% 64%",
      secondary: "262 83% 58%",
      accent: "359 82% 69%",
      gradientHero: "linear-gradient(135deg, hsl(235 85% 64%) 0%, hsl(262 83% 58%) 100%)",
      gradientPrimary: "linear-gradient(135deg, hsl(235 85% 64%), hsl(235 85% 54%))",
      gradientSecondary: "linear-gradient(135deg, hsl(262 83% 58%), hsl(262 83% 48%))",
      gradientAccent: "linear-gradient(135deg, hsl(359 82% 69%), hsl(359 82% 59%))",
    }
  },

  // Warm themes
  instagram: {
    name: "Instagram Sunset",
    description: "Warm gradients inspired by Instagram",
    colors: {
      primary: "320 87% 58%",
      secondary: "45 98% 51%",
      accent: "291 95% 61%",
      gradientHero: "linear-gradient(135deg, hsl(320 87% 58%) 0%, hsl(45 98% 51%) 100%)",
      gradientPrimary: "linear-gradient(135deg, hsl(320 87% 58%), hsl(320 87% 48%))",
      gradientSecondary: "linear-gradient(135deg, hsl(45 98% 51%), hsl(45 98% 41%))",
      gradientAccent: "linear-gradient(135deg, hsl(291 95% 61%), hsl(291 95% 51%))",
    }
  },

  netflix: {
    name: "Netflix Red",
    description: "Bold red theme inspired by Netflix",
    colors: {
      primary: "357 92% 47%",
      secondary: "0 0% 8%",
      accent: "48 100% 50%",
      gradientHero: "linear-gradient(135deg, hsl(357 92% 47%) 0%, hsl(0 0% 8%) 100%)",
      gradientPrimary: "linear-gradient(135deg, hsl(357 92% 47%), hsl(357 92% 37%))",
      gradientSecondary: "linear-gradient(135deg, hsl(0 0% 8%), hsl(0 0% 18%))",
      gradientAccent: "linear-gradient(135deg, hsl(48 100% 50%), hsl(48 100% 40%))",
    }
  },

  // Cool/Blue themes
  twitter: {
    name: "Twitter Blue",
    description: "Classic blue theme like Twitter",
    colors: {
      primary: "203 89% 53%",
      secondary: "204 100% 97%",
      accent: "212 100% 48%",
      gradientHero: "linear-gradient(135deg, hsl(203 89% 53%) 0%, hsl(212 100% 48%) 100%)",
      gradientPrimary: "linear-gradient(135deg, hsl(203 89% 53%), hsl(203 89% 43%))",
      gradientSecondary: "linear-gradient(135deg, hsl(204 100% 97%), hsl(204 100% 87%))",
      gradientAccent: "linear-gradient(135deg, hsl(212 100% 48%), hsl(212 100% 38%))",
    }
  },

  linkedin: {
    name: "LinkedIn Professional",
    description: "Professional blue theme",
    colors: {
      primary: "201 100% 35%",
      secondary: "0 0% 95%",
      accent: "36 100% 50%",
      gradientHero: "linear-gradient(135deg, hsl(201 100% 35%) 0%, hsl(36 100% 50%) 100%)",
      gradientPrimary: "linear-gradient(135deg, hsl(201 100% 35%), hsl(201 100% 25%))",
      gradientSecondary: "linear-gradient(135deg, hsl(0 0% 95%), hsl(0 0% 85%))",
      gradientAccent: "linear-gradient(135deg, hsl(36 100% 50%), hsl(36 100% 40%))",
    }
  },

  // Nature/Earth themes
  forest: {
    name: "Forest Green",
    description: "Natural earth tones",
    colors: {
      primary: "120 61% 34%",
      secondary: "64 39% 49%",
      accent: "39 85% 60%",
      gradientHero: "linear-gradient(135deg, hsl(120 61% 34%) 0%, hsl(64 39% 49%) 100%)",
      gradientPrimary: "linear-gradient(135deg, hsl(120 61% 34%), hsl(120 61% 24%))",
      gradientSecondary: "linear-gradient(135deg, hsl(64 39% 49%), hsl(64 39% 39%))",
      gradientAccent: "linear-gradient(135deg, hsl(39 85% 60%), hsl(39 85% 50%))",
    }
  },

  ocean: {
    name: "Ocean Blue",
    description: "Deep ocean and sky blues",
    colors: {
      primary: "199 89% 48%",
      secondary: "187 85% 53%",
      accent: "172 66% 50%",
      gradientHero: "linear-gradient(135deg, hsl(199 89% 48%) 0%, hsl(187 85% 53%) 100%)",
      gradientPrimary: "linear-gradient(135deg, hsl(199 89% 48%), hsl(199 89% 38%))",
      gradientSecondary: "linear-gradient(135deg, hsl(187 85% 53%), hsl(187 85% 43%))",
      gradientAccent: "linear-gradient(135deg, hsl(172 66% 50%), hsl(172 66% 40%))",
    }
  },

  // Minimal themes
  monochrome: {
    name: "Monochrome",
    description: "Clean black and white",
    colors: {
      primary: "0 0% 9%",
      secondary: "0 0% 45%",
      accent: "0 0% 73%",
      gradientHero: "linear-gradient(135deg, hsl(0 0% 9%) 0%, hsl(0 0% 45%) 100%)",
      gradientPrimary: "linear-gradient(135deg, hsl(0 0% 9%), hsl(0 0% 15%))",
      gradientSecondary: "linear-gradient(135deg, hsl(0 0% 45%), hsl(0 0% 35%))",
      gradientAccent: "linear-gradient(135deg, hsl(0 0% 73%), hsl(0 0% 63%))",
    }
  }
};

// Font families with diverse typography styles
export const fontFamilies = {
  // Sans-Serif (Modern/Clean)
  google: {
    name: "Google Sans",
    description: "Clean and modern like Google apps",
    category: "Sans-Serif",
    css: '"Google Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  inter: {
    name: "Inter",
    description: "Popular modern web font",
    category: "Sans-Serif",
    css: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
  },
  poppins: {
    name: "Poppins",
    description: "Rounded and friendly",
    category: "Sans-Serif",
    css: '"Poppins", -apple-system, BlinkMacSystemFont, sans-serif'
  },
  
  // Serif (Classic/Editorial)
  playfair: {
    name: "Playfair Display",
    description: "Elegant editorial serif",
    category: "Serif",
    css: '"Playfair Display", "Times New Roman", serif'
  },
  crimson: {
    name: "Crimson Text",
    description: "Classic book typography",
    category: "Serif", 
    css: '"Crimson Text", "Times New Roman", serif'
  },
  times: {
    name: "Times New Roman",
    description: "Traditional newspaper serif",
    category: "Serif",
    css: '"Times New Roman", Times, serif'
  },
  
  // Monospace (Code/Technical)
  firaCode: {
    name: "Fira Code",
    description: "Code font with ligatures",
    category: "Monospace",
    css: '"Fira Code", "SF Mono", Monaco, "Cascadia Code", monospace'
  },
  jetbrains: {
    name: "JetBrains Mono",
    description: "Developer-focused monospace",
    category: "Monospace", 
    css: '"JetBrains Mono", "SF Mono", Monaco, "Cascadia Code", monospace'
  },
  menlo: {
    name: "Menlo",
    description: "Classic terminal font",
    category: "Monospace",
    css: 'Menlo, Monaco, "Cascadia Code", "SF Mono", monospace'
  },
  
  // Display/Artistic
  oswald: {
    name: "Oswald",
    description: "Bold condensed sans-serif",
    category: "Display",
    css: '"Oswald", "Arial Narrow", sans-serif'
  },
  system: {
    name: "System Default",
    description: "Native system fonts",
    category: "System",
    css: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
  }
};

interface ThemeContextType {
  currentPalette: string;
  currentFont: string;
  setPalette: (paletteKey: string) => void;
  setFont: (fontKey: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPalette, setCurrentPalette] = useState(() => {
    return localStorage.getItem('workoutTracker_colorPalette') || 'fitness';
  });
  
  const [currentFont, setCurrentFont] = useState(() => {
    return localStorage.getItem('workoutTracker_fontFamily') || 'google';
  });

  // Apply theme changes to CSS variables
  useEffect(() => {
    const palette = colorPalettes[currentPalette as keyof typeof colorPalettes];
    if (palette) {
      const root = document.documentElement;
      root.style.setProperty('--primary', palette.colors.primary);
      root.style.setProperty('--secondary', palette.colors.secondary);
      root.style.setProperty('--accent', palette.colors.accent);
      root.style.setProperty('--gradient-hero', palette.colors.gradientHero);
      root.style.setProperty('--gradient-primary', palette.colors.gradientPrimary);
      root.style.setProperty('--gradient-secondary', palette.colors.gradientSecondary);
      root.style.setProperty('--gradient-accent', palette.colors.gradientAccent);
      root.style.setProperty('--ring', palette.colors.primary);
      root.style.setProperty('--sidebar-ring', palette.colors.primary);
    }
  }, [currentPalette]);

  // Apply font changes
  useEffect(() => {
    const font = fontFamilies[currentFont as keyof typeof fontFamilies];
    if (font) {
      document.body.style.fontFamily = font.css;
    }
  }, [currentFont]);

  const setPalette = (paletteKey: string) => {
    setCurrentPalette(paletteKey);
    localStorage.setItem('workoutTracker_colorPalette', paletteKey);
  };

  const setFont = (fontKey: string) => {
    setCurrentFont(fontKey);
    localStorage.setItem('workoutTracker_fontFamily', fontKey);
  };

  return (
    <ThemeContext.Provider value={{
      currentPalette,
      currentFont,
      setPalette,
      setFont
    }}>
      {children}
    </ThemeContext.Provider>
  );
};