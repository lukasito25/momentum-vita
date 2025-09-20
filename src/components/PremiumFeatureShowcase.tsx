import React from 'react';
import { X, Crown, Zap, TrendingUp, Users, Database, Star, Lock, Unlock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface PremiumFeatureShowcaseProps {
  feature: 'analytics' | 'programs' | 'customization';
  onUpgrade: () => void;
  onClose: () => void;
}

const PremiumFeatureShowcase: React.FC<PremiumFeatureShowcaseProps> = ({
  feature,
  onUpgrade,
  onClose
}) => {
  const { login } = useAuth();

  const featureContent = {
    analytics: {
      title: 'Advanced Analytics',
      description: 'Get deep insights into your workout performance',
      icon: TrendingUp,
      color: 'from-blue-600 to-indigo-600',
      features: [
        'Detailed progress tracking',
        'Strength progression analytics',
        'Volume load calculations',
        'Personal record tracking',
        'Workout efficiency metrics',
        'Body composition tracking'
      ],
      demoImages: [
        '/api/placeholder/300/200?text=Progress+Charts',
        '/api/placeholder/300/200?text=Strength+Analytics',
        '/api/placeholder/300/200?text=Volume+Tracking'
      ]
    },
    programs: {
      title: 'Unlimited Programs',
      description: 'Access to all workout programs and templates',
      icon: Database,
      color: 'from-purple-600 to-pink-600',
      features: [
        'All premium workout programs',
        'Expert-designed templates',
        'Specialized training plans',
        'Sport-specific workouts',
        'Periodization programs',
        'Recovery protocols'
      ],
      demoImages: [
        '/api/placeholder/300/200?text=Premium+Programs',
        '/api/placeholder/300/200?text=Expert+Templates',
        '/api/placeholder/300/200?text=Specialized+Plans'
      ]
    },
    customization: {
      title: 'Advanced Customization',
      description: 'Create unlimited custom workouts with advanced features',
      icon: Zap,
      color: 'from-green-600 to-emerald-600',
      features: [
        'Unlimited custom workouts',
        'Advanced exercise filters',
        'Superset support',
        'Custom rest timers',
        'Workout sharing',
        'Exercise substitutions'
      ],
      demoImages: [
        '/api/placeholder/300/200?text=Workout+Builder',
        '/api/placeholder/300/200?text=Exercise+Library',
        '/api/placeholder/300/200?text=Custom+Plans'
      ]
    }
  };

  const content = featureContent[feature];
  const IconComponent = content.icon;

  const handleUpgrade = () => {
    // In a real app, this would redirect to payment/subscription flow
    login(); // For demo purposes, just trigger login
    onUpgrade();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`bg-gradient-to-r ${content.color} text-white p-6 rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{content.title}</h2>
                <p className="text-white/90">{content.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              aria-label="Close premium showcase"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Feature Comparison */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">What you're missing out on</h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Free Tier */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <h4 className="text-lg font-semibold text-gray-600">Free Plan</h4>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-gray-600">
                    <span className="w-4 h-4 rounded-full bg-gray-300 flex-shrink-0"></span>
                    3 basic workout programs
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <span className="w-4 h-4 rounded-full bg-gray-300 flex-shrink-0"></span>
                    Limited custom workouts (3 max)
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <span className="w-4 h-4 rounded-full bg-gray-300 flex-shrink-0"></span>
                    Basic progress tracking
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <span className="w-4 h-4 rounded-full bg-gray-300 flex-shrink-0"></span>
                    Standard achievements
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <span className="w-4 h-4 rounded-full bg-gray-300 flex-shrink-0"></span>
                    No workout sharing
                  </li>
                </ul>
              </div>

              {/* Premium Tier */}
              <div className={`bg-gradient-to-br ${content.color} text-white rounded-xl p-6 relative overflow-hidden`}>
                <div className="absolute top-2 right-2">
                  <Crown className="w-6 h-6 text-yellow-300" />
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Unlock className="w-5 h-5" />
                  <h4 className="text-lg font-semibold">Premium Plan</h4>
                </div>
                <ul className="space-y-2">
                  {content.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-300 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Feature Demo */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">See it in action</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {content.demoImages.map((image, index) => (
                <div key={index} className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <p className="text-sm">Feature Demo {index + 1}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">What users say</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    A
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Alex M.</p>
                    <p className="text-xs text-gray-600">Premium user for 6 months</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  "The analytics helped me identify weak points in my training. I've seen 30% strength gains since upgrading!"
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    S
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Sarah K.</p>
                    <p className="text-xs text-gray-600">Premium user for 1 year</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  "Creating custom workouts for my specific goals changed everything. The variety keeps me motivated!"
                </p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Unlock Premium Features</h3>
              <p className="text-gray-600">Join thousands of users achieving their fitness goals</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <h4 className="font-semibold mb-2">Monthly</h4>
                <div className="text-3xl font-bold mb-1">$9.99</div>
                <p className="text-sm text-gray-600 mb-4">per month</p>
                <button
                  onClick={handleUpgrade}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold transition-colors"
                >
                  Start Monthly
                </button>
              </div>

              <div className={`bg-gradient-to-br ${content.color} text-white rounded-lg p-4 text-center relative`}>
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                    BEST VALUE
                  </span>
                </div>
                <h4 className="font-semibold mb-2">Yearly</h4>
                <div className="text-3xl font-bold mb-1">$79.99</div>
                <p className="text-sm opacity-90 mb-1">per year</p>
                <p className="text-xs opacity-75 mb-4">Save $40 vs monthly</p>
                <button
                  onClick={handleUpgrade}
                  className="w-full bg-white text-gray-800 hover:bg-gray-100 py-2 rounded-lg font-semibold transition-colors"
                >
                  Start Yearly
                </button>
              </div>
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                7-day free trial • Cancel anytime • No commitment
              </p>
            </div>
          </div>

          {/* Benefits Summary */}
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="p-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${content.color} text-white rounded-lg flex items-center justify-center mx-auto mb-3`}>
                <TrendingUp className="w-6 h-6" />
              </div>
              <h4 className="font-semibold mb-2">Faster Progress</h4>
              <p className="text-sm text-gray-600">
                Track your improvements with detailed analytics and personalized insights
              </p>
            </div>

            <div className="p-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${content.color} text-white rounded-lg flex items-center justify-center mx-auto mb-3`}>
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-semibold mb-2">Expert Support</h4>
              <p className="text-sm text-gray-600">
                Access to premium content created by certified fitness professionals
              </p>
            </div>

            <div className="p-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${content.color} text-white rounded-lg flex items-center justify-center mx-auto mb-3`}>
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="font-semibold mb-2">Unlimited Access</h4>
              <p className="text-sm text-gray-600">
                No restrictions on custom workouts, programs, or advanced features
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>Questions? <a href="#" className="text-blue-600 hover:underline">Contact support</a></p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Maybe later
              </button>
              <button
                onClick={handleUpgrade}
                className={`px-6 py-2 bg-gradient-to-r ${content.color} text-white rounded-lg font-semibold hover:shadow-lg transition-all`}
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumFeatureShowcase;