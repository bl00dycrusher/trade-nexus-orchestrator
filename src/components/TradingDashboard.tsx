import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
          <div className="text-sm">
            <span className={`px-2 py-1 rounded text-xs ${bridge.isConnected ? 'bg-trading-success text-trading-success-foreground' : 'bg-trading-danger text-trading-danger-foreground'}`}>
              {bridge.isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Main Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Accounts ({bridge.accounts.length})
            </TabsTrigger>
            <TabsTrigger value="relationships" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Relationships ({bridge.relationships.length})
            </TabsTrigger>
            <TabsTrigger value="monitor" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity ({bridge.trades.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Connected Accounts</CardTitle>
                  <CardDescription>Accounts connected from bridge server</CardDescription>
                </CardHeader>
                <CardContent>
                  {bridge.accounts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No accounts connected. Start your MT5 EA or cTrader cBot to register accounts.
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {bridge.accounts.map((account) => (
                        <div key={account.account_id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{account.display_name}</h3>
                              <p className="text-sm text-muted-foreground">{account.account_id}</p>
                            </div>
                            <div className="flex gap-2">
                              <span className={`px-2 py-1 rounded text-xs ${account.is_connected ? 'bg-trading-success text-trading-success-foreground' : 'bg-trading-neutral text-trading-neutral-foreground'}`}>
                                {account.is_connected ? 'Connected' : 'Disconnected'}
                              </span>
                              <span className="px-2 py-1 rounded text-xs bg-primary text-primary-foreground capitalize">
                                {account.account_type}
                              </span>
                              <span className="px-2 py-1 rounded text-xs bg-muted text-muted-foreground uppercase">
                                {account.platform}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="relationships">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Copy Relationships</CardTitle>
                  <CardDescription>Active trade copying relationships</CardDescription>
                </CardHeader>
                <CardContent>
                  {bridge.relationships.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No relationships configured yet.
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {bridge.relationships.map((rel, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{rel.provider_id} → {rel.copyer_id}</p>
                              <p className="text-sm text-muted-foreground">Volume multiplier: {rel.volume_multiplier}x</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${rel.is_active ? 'bg-trading-success text-trading-success-foreground' : 'bg-trading-neutral text-trading-neutral-foreground'}`}>
                              {rel.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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