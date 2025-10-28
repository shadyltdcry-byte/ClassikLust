import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, TrendingUp, Image, Users, CheckSquare, Award, Zap, Crown, BarChart3, X } from 'lucide-react';

// Pages
import UpgradesPage from './pages/UpgradesPage';
import EmptyPage from './pages/EmptyPage';

interface AdminShellProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminShell: React.FC<AdminShellProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState('upgrades');

  const sections = [
    { id: 'upgrades', name: 'Upgrades', icon: TrendingUp, working: true },
    { id: 'media', name: 'Media', icon: Image, working: false },
    { id: 'characters', name: 'Characters', icon: Users, working: false },
    { id: 'tasks', name: 'Tasks', icon: CheckSquare, working: false },
    { id: 'achievements', name: 'Achievements', icon: Award, working: false },
    { id: 'energy', name: 'Energy', icon: Zap, working: false },
    { id: 'vip', name: 'VIP', icon: Crown, working: false },
    { id: 'analytics', name: 'Analytics', icon: BarChart3, working: false },
    { id: 'settings', name: 'Settings', icon: Settings, working: false }
  ];

  const renderContent = () => {
    if (activeSection === 'upgrades') return <UpgradesPage />;
    const section = sections.find(s => s.id === activeSection);
    return <EmptyPage title={section?.name || activeSection} icon={section?.icon || Settings} />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] bg-gray-900 border-gray-700 p-0">
        <div className="flex h-[90vh]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
            <DialogHeader className="p-4 border-b border-gray-700">
              <DialogTitle className="text-white text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Admin Panel v2
              </DialogTitle>
            </DialogHeader>
            
            <nav className="flex-1 p-4 space-y-2">
              {sections.map(section => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                      isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{section.name}</span>
                    {!section.working && (
                      <span className="text-xs bg-gray-600 px-1 rounded">Soon</span>
                    )}
                  </button>
                );
              })}
            </nav>
            
            <div className="p-4 border-t border-gray-700">
              <p className="text-gray-500 text-xs">
                Progressive rollout - features added incrementally
              </p>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-white text-xl font-semibold">
                {sections.find(s => s.id === activeSection)?.name || activeSection}
              </h2>
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-auto">
              {renderContent()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminShell;