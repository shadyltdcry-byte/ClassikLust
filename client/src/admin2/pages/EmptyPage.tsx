import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface EmptyPageProps {
  title: string;
  icon: LucideIcon;
}

const EmptyPage: React.FC<EmptyPageProps> = ({ title, icon: Icon }) => {
  return (
    <div className="p-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-12 text-center">
          <Icon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl text-white mb-2">{title}</h3>
          <p className="text-gray-400">This section will be added in the next update.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmptyPage;