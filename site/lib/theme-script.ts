export const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('scan-sell-ai-theme');
      var theme = stored === 'dark' ? 'dark' : 'light';
      document.documentElement.dataset.theme = theme;
    } catch (e) {
      document.documentElement.dataset.theme = 'light';
    }
  })();
`;
