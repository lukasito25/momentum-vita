import React, { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';

const InstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showButton, setShowButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    // Check platform and conditions
    const shouldShowButton = () => {
      const isInstalled = checkInstalled();
      if (isInstalled) return false;

      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      const isDesktop = !isIOS && !isAndroid;

      // Show for all platforms that can install PWAs
      return isIOS || isAndroid || isDesktop;
    };

    if (!checkInstalled()) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Show button if platform supports PWA installation
      if (shouldShowButton()) {
        setShowButton(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Show native install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShowButton(false);
      }

      setDeferredPrompt(null);
    } else {
      // For iOS and other platforms, show manual instructions
      showInstallInstructions();
    }
  };

  const showInstallInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);

    if (isIOS) {
      alert(
        '📱 Install Momentum Vita:\n\n' +
        '1. Tap the Share button (⬆️) in Safari\n' +
        '2. Select "Add to Home Screen"\n' +
        '3. Tap "Add" to install\n\n' +
        'Access your workouts like a native app!'
      );
    } else {
      alert(
        '📱 Install Momentum Vita:\n\n' +
        '1. Look for the install icon in your browser address bar\n' +
        '2. Or use browser menu > Install/Add to Home Screen\n' +
        '3. Follow the prompts to install\n\n' +
        'Get the full app experience!'
      );
    }
  };

  if (!showButton || isInstalled) return null;

  return (
    <button
      onClick={handleInstall}
      className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
      title="Install Momentum Vita as an app"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Install App</span>
      <span className="sm:hidden">Install</span>
    </button>
  );
};

export default InstallButton;