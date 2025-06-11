import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountManager } from './AccountManager';
import { ConnectionStatus } from './ConnectionStatus';
import { RelationshipManager } from './RelationshipManager';
import { TradeMonitor } from './TradeMonitor';
import { Activity, Users, Settings, BarChart3 } from 'lucide-react';
import { useTradingBridge } from '@/hooks/useTradingBridge';

export const TradingDashboard = () => {
  const [activeTab, setActiveTab] = useState('accounts');
  const bridge = useTradingBridge();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trading Bridge</h1>
            <p className="text-muted-foreground">MT5 ↔ cTrader Communication Bridge</p>
          </div>
          <ConnectionStatus isConnected={bridge.isConnected} onRefresh={bridge.refreshData} />
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
            <AccountManager accounts={bridge.accounts} />
          </TabsContent>

          <TabsContent value="relationships">
            <RelationshipManager 
              accounts={bridge.accounts}
              relationships={bridge.relationships}
              onCreateRelationship={bridge.createRelationship}
            />
          </TabsContent>

          <TabsContent value="monitor">
            <TradeMonitor trades={bridge.trades} />
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Recent system activities and events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {bridge.trades.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      No recent activity
                    </div>
                  ) : (
                    bridge.trades.slice(0, 10).map((trade) => (
                      <div key={trade.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>
                          {trade.trade.symbol} {trade.trade.action} copied from {trade.from} to {trade.to}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(trade.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};