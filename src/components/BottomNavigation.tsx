import React from 'react';
import { Home, Dumbbell, TrendingUp, User } from 'lucide-react';

export type TabType = 'home' | 'workout' | 'progress' | 'profile';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const navigationItems = [
  {
    id: 'home' as TabType,
    icon: Home,
    label: 'Home',
  },
  {
    id: 'workout' as TabType,
    icon: Dumbbell,
    label: 'Workout',
  },
  {
    id: 'progress' as TabType,
    icon: TrendingUp,
    label: 'Progress',
  },
  {
    id: 'profile' as TabType,
    icon: User,
    label: 'Profile',
  },
];

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <nav
      className="bottom-nav"
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex">
        {navigationItems.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`nav-tab flex-1 ${
                isActive ? 'nav-tab-active' : 'nav-tab-inactive'
              } touch-feedback`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${id}-panel`}
              aria-label={label}
            >
              <Icon
                size={20}
                className={`mb-1 ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'
                }`}
              />
              <span className={`text-xs font-medium ${
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'
              }`}>
                {label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-indigo-600 dark:bg-indigo-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;