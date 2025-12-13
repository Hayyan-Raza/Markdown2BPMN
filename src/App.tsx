import { useState } from 'react';
import { Header } from './components/Header';
import { GeneratorView } from './components/GeneratorView';
import { SyntaxGuide } from './components/SyntaxGuide';

export default function App() {
  const [activeTab, setActiveTab] = useState<'generator' | 'guide'>('generator');

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 overflow-hidden">
        {activeTab === 'generator' && <GeneratorView />}
        {activeTab === 'guide' && <SyntaxGuide />}
      </main>
    </div>
  );
}