import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

interface Upgrade {
  id: string;
  name: string;
  description: string;
  category: string;
  baseCost: number;
  baseEffect: number;
  maxLevel: number;
  requiredLevel: number;
  currentLevel?: number;
  nextCost?: number;
}

const UpgradesPage: React.FC = () => {
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/upgrades'],
    queryFn: async () => {
      console.log('🔄 [ADMIN2] Fetching upgrades...');
      const res = await fetch('/api/admin/upgrades?userId=telegram_5134006535');
      if (!res.ok) throw new Error(`API Error ${res.status}`);
      return res.json();
    },
    retry: 1,
    staleTime: 10000
  });

  const upgrades: Upgrade[] = response?.data || [];

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg text-white mb-2">API Error</h3>
            <p className="text-gray-400 mb-4">{error instanceof Error ? error.message : 'Unknown error'}</p>
            <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Upgrade Definitions ({upgrades.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Loading upgrades...</div>
            </div>
          ) : upgrades.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No upgrades found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upgrades.map(upgrade => (
                <div key={upgrade.id} className="bg-gray-700 p-4 rounded border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{upgrade.name}</h4>
                      <p className="text-gray-400 text-sm">{upgrade.description}</p>
                      <div className="flex gap-4 text-sm text-gray-300 mt-2">
                        <span>Category: {upgrade.category}</span>
                        <span>Base Cost: {upgrade.baseCost.toLocaleString()} LP</span>
                        {upgrade.currentLevel !== undefined && (
                          <span>Current Level: {upgrade.currentLevel}</span>
                        )}
                        {upgrade.nextCost && (
                          <span>Next Cost: {upgrade.nextCost.toLocaleString()} LP</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UpgradesPage;