import React from 'react';

interface HeaderProps {
  activeTab: 'generator' | 'guide';
  onTabChange: (tab: 'generator' | 'guide') => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-gray-800">
          <span className="text-blue-600">MarkDown</span>2BPMN
        </h1>
      </div>

      <nav className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => onTabChange('generator')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            activeTab === 'generator'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Generator
        </button>
        <button
          onClick={() => onTabChange('guide')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            activeTab === 'guide'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Syntax Guide
        </button>
      </nav>
      
      <div className="w-[100px]">
        {/* Spacer for potential future actions */}
      </div>
    </header>
  );
}
