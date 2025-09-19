import { useEffect } from 'react';
import TrainingProgram from './TrainingProgram';
import { ImageService } from './lib/imageService';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  useEffect(() => {
    // Initialize image service when app starts
    ImageService.initializeImageService();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <TrainingProgram />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App