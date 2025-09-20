import React, { useState } from 'react';
import { X, Moon, Sun, Monitor, Bell, BellOff, Shield, Eye, EyeOff } from 'lucide-react';
import { useTheme, Theme } from '../contexts/ThemeContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Theme Settings Modal
interface ThemeSettingsModalProps extends ModalProps {}

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  const themeOptions: Array<{ id: Theme; label: string; icon: React.ComponentType; description: string }> = [
    { id: 'light', label: 'Light', icon: Sun, description: 'Light mode all the time' },
    { id: 'dark', label: 'Dark', icon: Moon, description: 'Dark mode all the time' },
    { id: 'system', label: 'System', icon: Monitor, description: 'Follow system setting' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Theme Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {themeOptions.map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={`w-full flex items-center p-3 rounded-lg border transition-colors ${
                theme === id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                theme === id ? 'bg-indigo-500' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <Icon className={`w-5 h-5 ${theme === id ? 'text-white' : 'text-gray-600'}`} />
              </div>
              <div className="flex-1 text-left">
                <div className={`font-medium ${theme === id ? 'text-indigo-900' : 'text-gray-900'}`}>
                  {label}
                </div>
                <div className={`text-sm ${theme === id ? 'text-indigo-600' : 'text-gray-600'}`}>
                  {description}
                </div>
              </div>
              {theme === id && (
                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Notification Settings Modal
interface NotificationSettingsModalProps extends ModalProps {}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('momentum_vita_notifications');
    return saved ? JSON.parse(saved) : {
      workoutReminders: true,
      streakUpdates: true,
      weeklyProgress: true,
      achievements: true,
      emailUpdates: false,
    };
  });

  const updateSetting = (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('momentum_vita_notifications', JSON.stringify(newSettings));
  };

  if (!isOpen) return null;

  const notificationOptions = [
    { key: 'workoutReminders', label: 'Workout Reminders', description: 'Daily workout notifications' },
    { key: 'streakUpdates', label: 'Streak Updates', description: 'Celebrate your workout streaks' },
    { key: 'weeklyProgress', label: 'Weekly Progress', description: 'Weekly summary of your progress' },
    { key: 'achievements', label: 'Achievements', description: 'New badge and milestone alerts' },
    { key: 'emailUpdates', label: 'Email Updates', description: 'Receive updates via email' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {notificationOptions.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
              <div className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                  settings[key] ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {settings[key] ? (
                    <Bell className="w-5 h-5 text-green-600" />
                  ) : (
                    <BellOff className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{label}</div>
                  <div className="text-sm text-gray-600">{description}</div>
                </div>
              </div>
              <button
                onClick={() => updateSetting(key, !settings[key])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings[key] ? 'bg-indigo-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings[key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Privacy Settings Modal
interface PrivacySettingsModalProps extends ModalProps {}

export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('momentum_vita_privacy');
    return saved ? JSON.parse(saved) : {
      profileVisible: true,
      shareProgress: false,
      anonymousAnalytics: true,
      dataSaving: true,
      deleteAfterInactivity: false,
    };
  });

  const updateSetting = (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('momentum_vita_privacy', JSON.stringify(newSettings));
  };

  if (!isOpen) return null;

  const privacyOptions = [
    { key: 'profileVisible', label: 'Profile Visibility', description: 'Make your profile visible to others' },
    { key: 'shareProgress', label: 'Share Progress', description: 'Allow sharing workout progress' },
    { key: 'anonymousAnalytics', label: 'Anonymous Analytics', description: 'Help improve the app with usage data' },
    { key: 'dataSaving', label: 'Data Saving', description: 'Save your workout data locally' },
    { key: 'deleteAfterInactivity', label: 'Auto-Delete Data', description: 'Delete data after 90 days of inactivity' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Privacy Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {privacyOptions.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
              <div className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                  settings[key] ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {settings[key] ? (
                    <Eye className="w-5 h-5 text-blue-600" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{label}</div>
                  <div className="text-sm text-gray-600">{description}</div>
                </div>
              </div>
              <button
                onClick={() => updateSetting(key, !settings[key])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings[key] ? 'bg-indigo-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings[key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}

          <div className="pt-4 border-t border-gray-200">
            <button className="w-full flex items-center justify-center p-3 text-red-600 hover:bg-red-50 rounded-lg font-medium">
              <Shield className="w-5 h-5 mr-2" />
              Request Data Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};