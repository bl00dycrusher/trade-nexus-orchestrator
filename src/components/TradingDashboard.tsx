import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountManager } from './AccountManager';
import { ConnectionStatus } from './ConnectionStatus';
import { RelationshipManager } from './RelationshipManager';
import { TradeMonitor } from './TradeMonitor';
import { Activity, Users, Settings, BarChart3 } from 'lucide-react';

export const TradingDashboard = () => {
  const [activeTab, setActiveTab] = useState('accounts');

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trading Bridge</h1>
            <p className="text-muted-foreground">MT5 ↔ cTrader Communication Bridge</p>
          </div>
          <ConnectionStatus />
        </div>

        {/* Main Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Accounts
            </TabsTrigger>
            <TabsTrigger value="relationships" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Relationships
            </TabsTrigger>
            <TabsTrigger value="monitor" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts">
            <AccountManager />
          </TabsContent>

          <TabsContent value="relationships">
            <RelationshipManager />
          </TabsContent>

          <TabsContent value="monitor">
            <TradeMonitor />
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Recent system activities and events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span>MT5-001 connected successfully</span>
                    <span className="text-muted-foreground">2 min ago</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span>cTrader-001 established bridge connection</span>
                    <span className="text-muted-foreground">5 min ago</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span>Trade copied: EURUSD Buy 0.1 lot</span>
                    <span className="text-muted-foreground">8 min ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};