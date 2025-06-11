import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, RefreshCw, Filter } from 'lucide-react';

interface TradeMonitorProps {
  trades: any[];
}

export const TradeMonitor = ({ trades }: TradeMonitorProps) => {
  const [activeTab, setActiveTab] = useState('live');


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Trade Monitor</h2>
          <p className="text-muted-foreground">Real-time monitoring of copied trades</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">{trades.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-trading-info" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Symbols</p>
                <p className="text-2xl font-bold">{new Set(trades.map(t => t.trade?.symbol)).size}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-trading-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recent Activity</p>
                <p className="text-2xl font-bold">{trades.filter(t => Date.now() - new Date(t.timestamp).getTime() < 3600000).length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-trading-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">{trades.reduce((sum, trade) => sum + (trade.trade?.volume || 0), 0).toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-trading-neutral-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trade Tables */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="live">Live Trades</TabsTrigger>
          <TabsTrigger value="history">Trade History</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <Card>
            <CardHeader>
              <CardTitle>Copied Trades</CardTitle>
              <CardDescription>Real-time trade copying activity</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No trades copied yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    trades.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell className="font-medium">{trade.trade?.symbol || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge className={trade.trade?.action === 'BUY' ? "bg-trading-success text-trading-success-foreground" : "bg-trading-danger text-trading-danger-foreground"}>
                            {trade.trade?.action || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>{trade.trade?.volume || 0}</TableCell>
                        <TableCell className="text-trading-info">{trade.from}</TableCell>
                        <TableCell className="text-trading-warning">{trade.to}</TableCell>
                        <TableCell>{new Date(trade.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
              <CardDescription>Historical trading activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No historical trades to display yet
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Trading performance analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Today's Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trades Executed</span>
                      <span className="font-medium">{trades.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Hour</span>
                      <span className="font-medium">{trades.filter(t => Date.now() - new Date(t.timestamp).getTime() < 3600000).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unique Symbols</span>
                      <span className="font-medium">{new Set(trades.map(t => t.trade?.symbol)).size}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Most Active Pairs</h4>
                  <div className="space-y-2">
                    {trades.length === 0 ? (
                      <div className="text-center text-muted-foreground">No data available</div>
                    ) : (
                      Object.entries(
                        trades.reduce((acc, trade) => {
                          const symbol = trade.trade?.symbol || 'Unknown';
                          acc[symbol] = (acc[symbol] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      )
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .slice(0, 3)
                      .map(([symbol, count]) => (
                        <div key={symbol} className="flex justify-between">
                          <span className="text-muted-foreground">{symbol}</span>
                          <span className="font-medium">{count as number}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};