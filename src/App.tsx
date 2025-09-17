import { useEffect } from 'react';
import TrainingProgram from './TrainingProgram';
import { ImageService } from './lib/imageService';

function App() {
  useEffect(() => {
    // Initialize image service when app starts
    ImageService.initializeImageService();
  }, []);

  return <TrainingProgram />
}

export default App