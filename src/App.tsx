import { useEffect } from 'react';
import TrainingProgram from './TrainingProgram';
import { ImageService } from './lib/imageService';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  useEffect(() => {
    // Initialize image service when app starts
    ImageService.initializeImageService();
  }, []);

  return (
    <AuthProvider>
      <TrainingProgram />
    </AuthProvider>
  )
}

export default App