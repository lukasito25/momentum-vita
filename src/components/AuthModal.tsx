import React, { useState } from 'react';
import { X, Mail, Eye, EyeOff, Sparkles, Lock, User } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuth: (user: { email: string; name: string; provider: string }) => void;
  trigger?: 'enhanced-mode' | 'program-switch' | 'manual';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuth, trigger = 'manual' }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const getModalTitle = () => {
    switch (trigger) {
      case 'enhanced-mode':
        return 'Unlock Enhanced Tracking';
      case 'program-switch':
        return 'Save Your Progress';
      default:
        return mode === 'login' ? 'Welcome Back' : 'Join Momentum Vita';
    }
  };

  const getModalSubtitle = () => {
    switch (trigger) {
      case 'enhanced-mode':
        return 'Get advanced set tracking, rest timers, and detailed analytics with a free account';
      case 'program-switch':
        return 'Create an account to sync your progress across devices and never lose your gains';
      default:
        return mode === 'login'
          ? 'Sign in to sync your fitness journey across all devices'
          : 'Start your personalized fitness journey with advanced tracking';
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call - replace with actual authentication
      await new Promise(resolve => setTimeout(resolve, 1000));

      onAuth({
        email,
        name: name || email.split('@')[0],
        provider: 'email'
      });

      onClose();
    } catch (error) {
      console.error('Authentication failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    setIsLoading(true);

    try {
      // Simulate social auth - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));

      onAuth({
        email: `user@${provider}.com`,
        name: 'User Name',
        provider
      });

      onClose();
    } catch (error) {
      console.error(`${provider} auth failed:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              {trigger === 'enhanced-mode' ? (
                <Sparkles className="w-8 h-8 text-white" />
              ) : trigger === 'program-switch' ? (
                <Lock className="w-8 h-8 text-white" />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{getModalTitle()}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{getModalSubtitle()}</p>
          </div>
        </div>

        {/* Social Auth Buttons */}
        <div className="px-6 space-y-3">
          <button
            onClick={() => handleSocialAuth('google')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <div className="w-5 h-5 bg-gradient-to-r from-red-500 to-yellow-500 rounded-sm flex items-center justify-center">
              <span className="text-white text-xs font-bold">G</span>
            </div>
            <span className="font-medium text-gray-700">Continue with Google</span>
          </button>

          <button
            onClick={() => handleSocialAuth('apple')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <span className="text-lg">🍎</span>
            <span className="font-medium">Continue with Apple</span>
          </button>
        </div>

        {/* Divider */}
        <div className="px-6 py-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="px-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Enter your name"
                required={mode === 'register'}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Enter your password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="p-6 pt-4 text-center">
          <p className="text-sm text-gray-600">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Benefits */}
        {trigger !== 'manual' && (
          <div className="px-6 pb-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">What you'll get:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Cloud sync across all devices
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Advanced workout analytics
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Progress tracking & achievements
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Enhanced workout modes
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Skip Option */}
        {trigger !== 'manual' && (
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              Continue without account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;