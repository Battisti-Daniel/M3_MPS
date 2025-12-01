export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var darkMode = localStorage.getItem('darkMode');
              // Por padrão, sempre inicia em modo claro
              if (darkMode === 'true') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
                // Se não existe, cria como false (claro)
                if (darkMode === null) {
                  localStorage.setItem('darkMode', 'false');
                }
              }
            } catch (e) {}
          })();
        `,
      }}
    />
  );
}

