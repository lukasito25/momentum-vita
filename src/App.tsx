import { useEffect } from 'react';
import MobileApp from './components/MobileApp';
import { ImageService } from './lib/imageService';
import ErrorBoundary from './components/ErrorBoundary';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  useEffect(() => {
    // Initialize image service when app starts
    ImageService.initializeImageService();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <MobileApp />
        <PWAInstallPrompt />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App