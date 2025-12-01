'use client';

import { useEffect, useState } from 'react';

export function useDarkMode() {
  // Inicializa como false (modo claro) - será atualizado no useEffect
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Verifica preferência no localStorage
    const darkMode = localStorage.getItem('darkMode');
    
    // Por padrão, sempre inicia em modo claro
    const shouldBeDark = darkMode === 'true';
    
    // Se não existe, cria como false (claro)
    if (darkMode === null) {
      localStorage.setItem('darkMode', 'false');
    }
    
    setIsDark(shouldBeDark);
    
    // Aplica imediatamente no documento
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    setMounted(true);
  }, []);

  const toggleDarkMode = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    localStorage.setItem('darkMode', String(newValue));
    
    // Aplica imediatamente no documento
    if (newValue) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return { isDark, toggleDarkMode, mounted };
}

