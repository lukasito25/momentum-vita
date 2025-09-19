import React, { useState, useEffect } from 'react';
import { X, Download, Share, Plus, Smartphone, Monitor } from 'lucide-react';

interface PWAInstallPromptProps {
  onClose?: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
    };

    // Detect platform
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      const isDesktop = !isIOS && !isAndroid;

      if (isIOS) setPlatform('ios');
      else if (isAndroid) setPlatform('android');
      else if (isDesktop) setPlatform('desktop');
    };

    // Listen for beforeinstallprompt event (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform('android'); // Likely Android Chrome
    };

    // Check if should show prompt
    const shouldShowPrompt = () => {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const lastShown = localStorage.getItem('pwa-install-last-shown');
      const now = Date.now();
      const threeDays = 3 * 24 * 60 * 60 * 1000;

      // Don't show if dismissed recently or already installed
      if (isInstalled || (dismissed && now - parseInt(dismissed) < threeDays)) {
        return false;
      }

      // Show if never shown, or last shown was more than 7 days ago
      if (!lastShown || now - parseInt(lastShown) > 7 * 24 * 60 * 60 * 1000) {
        return true;
      }

      return false;
    };

    checkInstalled();
    detectPlatform();

    if (!isInstalled) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Show prompt after 30 seconds if conditions met
      const timer = setTimeout(() => {
        if (shouldShowPrompt()) {
          setIsVisible(true);
          localStorage.setItem('pwa-install-last-shown', Date.now().toString());
        }
      }, 30000);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        clearTimeout(timer);
      };
    }
  }, [isInstalled]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Show native install prompt for supported browsers
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsVisible(false);
      }

      setDeferredPrompt(null);
    } else {
      // Show manual instructions for other platforms
      // Keep prompt open to show instructions
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    onClose?.();
  };

  const getInstructions = () => {
    switch (platform) {
      case 'ios':
        return {
          title: 'Install Momentum Vita',
          steps: [
            { icon: Share, text: 'Tap the Share button' },
            { icon: Plus, text: 'Select "Add to Home Screen"' },
            { icon: Smartphone, text: 'Tap "Add" to install' }
          ],
          note: 'Access your workouts like a native app!'
        };
      case 'android':
        return {
          title: 'Install Momentum Vita',
          steps: [
            { icon: Download, text: 'Tap "Install" below' },
            { icon: Smartphone, text: 'Confirm installation' },
            { icon: Plus, text: 'Find app on home screen' }
          ],
          note: 'Get the full app experience!'
        };
      case 'desktop':
        return {
          title: 'Install Momentum Vita',
          steps: [
            { icon: Download, text: 'Click install icon in address bar' },
            { icon: Monitor, text: 'Or use browser menu > Install' },
            { icon: Plus, text: 'Access from desktop/taskbar' }
          ],
          note: 'Track workouts right from your desktop!'
        };
      default:
        return {
          title: 'Install Momentum Vita',
          steps: [
            { icon: Download, text: 'Use browser menu to install' },
            { icon: Smartphone, text: 'Add to home screen' },
            { icon: Plus, text: 'Access like a native app' }
          ],
          note: 'Get the full app experience!'
        };
    }
  };

  if (!isVisible || isInstalled) return null;

  const instructions = getInstructions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{instructions.title}</h3>
              <p className="text-blue-100 text-sm">{instructions.note}</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-6">
          <div className="space-y-4 mb-6">
            {instructions.steps.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <step.icon className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-700">{step.text}</span>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">App Benefits:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Offline workout tracking</li>
              <li>• Faster loading times</li>
              <li>• Native app experience</li>
              <li>• Home screen access</li>
              <li>• Push notifications</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {deferredPrompt && platform === 'android' ? (
              <button
                onClick={handleInstall}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Install Now
              </button>
            ) : (
              <div className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium text-center opacity-75">
                Follow steps above
              </div>
            )}

            <button
              onClick={handleDismiss}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;