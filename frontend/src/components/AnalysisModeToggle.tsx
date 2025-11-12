'use client';

import React from 'react';
import { BuildingIcon, SearchIcon } from '@/components/icons/TabIcons';

interface AnalysisModeToggleProps {
  mode: 'full' | 'research_only';
  onChange: (mode: 'full' | 'research_only') => void;
}

export const AnalysisModeToggle: React.FC<AnalysisModeToggleProps> = ({
  mode,
  onChange,
}) => {
  return (
    <div className="flex flex-col space-y-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Analysis Mode
      </label>
      
      <div className="relative">
        {/* Toggle Container with 3D depth effects */}
        <div className="relative w-full h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-inner overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Background track with inner shadow */}
          <div className="absolute inset-1 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-inner" />
          
          {/* Animated slider with 3D effect */}
          <div 
            className={`absolute top-1 h-14 w-1/2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg transform transition-all duration-300 ease-in-out ${
              mode === 'research_only' ? 'translate-x-full' : 'translate-x-0'
            }`}
            style={{
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            }}
          />
          
          {/* Option buttons */}
          <div className="relative flex h-full">
            {/* Full Analysis Option */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange('full');
              }}
              className={`flex-1 flex flex-col items-center justify-center space-y-1 transition-all duration-300 z-10 ${
                mode === 'full'
                  ? 'text-white font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center space-x-1">
                {/* Full analysis icon */}
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-medium">Full</span>
              </div>
              <span className="text-xs opacity-80">8 Steps + Reports</span>
            </button>
            
            {/* Research Only Option */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange('research_only');
              }}
              className={`flex-1 flex flex-col items-center justify-center space-y-1 transition-all duration-300 z-10 ${
                mode === 'research_only'
                  ? 'text-white font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center space-x-1">
                {/* Research only icon */}
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium">Research</span>
              </div>
              <span className="text-xs opacity-80">2 Steps Only</span>
            </button>
          </div>
        </div>
        
        {/* Enhanced glow effect for active state */}
        <div 
          className={`absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-sm opacity-0 transition-opacity duration-300 -z-10 ${
            mode === 'research_only' ? 'opacity-20' : 'opacity-15'
          }`}
        />
      </div>
      
      {/* Description text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 px-1 flex items-center gap-2">
        {mode === 'full' ? (
          <>
            <BuildingIcon className="w-3 h-3" />
            <span>Complete policy analysis with all reports and presentations</span>
          </>
        ) : (
          <>
            <SearchIcon className="w-3 h-3" />
            <span>Quick research phase only - elaboration and deep research</span>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalysisModeToggle;
