'use client';

import { useEffect, useState } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Garante que sempre inicia em modo claro
    const darkMode = localStorage.getItem('darkMode');
    const shouldBeDark = darkMode === 'true';
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      // Garante que não há 'dark' no localStorage se for a primeira vez
      if (darkMode === null) {
        localStorage.setItem('darkMode', 'false');
      }
    }
    
    setMounted(true);
  }, []);

  // Previne flash de conteúdo sem tema
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}

