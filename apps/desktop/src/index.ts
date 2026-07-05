console.log('CodeAgent Desktop (scaffold)');

export function createWindow() {
  return {
    title: 'CodeAgent',
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  };
}
