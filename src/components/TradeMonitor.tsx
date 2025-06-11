import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, RefreshCw, Filter } from 'lucide-react';

interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  openTime: Date;
  provider: string;
  copyer: string;
  status: 'Open' | 'Closed' | 'Pending';
}

export const TradeMonitor = () => {
  const [trades] = useState<Trade[]>([
    {
      id: '1',
      symbol: 'EURUSD',
      type: 'BUY',
      volume: 0.1,
      openPrice: 1.0850,
      currentPrice: 1.0865,
      profit: 15.0,
      openTime: new Date(Date.now() - 1000 * 60 * 30),
      provider: 'MT5 Main Account',
      copyer: 'cTrader Copy Account',
      status: 'Open'
    },
    {
      id: '2',
      symbol: 'GBPUSD',
      type: 'SELL',
      volume: 0.2,
      openPrice: 1.2650,
      currentPrice: 1.2635,
      profit: 30.0,
      openTime: new Date(Date.now() - 1000 * 60 * 60),
      provider: 'MT5 Main Account',
      copyer: 'cTrader Copy Account',
      status: 'Open'
    },
    {
      id: '3',
      symbol: 'USDJPY',
      type: 'BUY',
      volume: 0.15,
      openPrice: 150.25,
      currentPrice: 150.10,
      profit: -22.5,
      openTime: new Date(Date.now() - 1000 * 60 * 45),
      provider: 'MT5 Secondary',
      copyer: 'cTrader Pro',
      status: 'Open'
    }
  ]);

  const [activeTab, setActiveTab] = useState('live');

  const getTradeTypeIcon = (type: Trade['type']) => {
    return type === 'BUY' ? (
      <TrendingUp className="h-4 w-4 text-trading-success" />
    ) : (
      <TrendingDown className="h-4 w-4 text-trading-danger" />
    );
  };

  const getTradeTypeBadge = (type: Trade['type']) => {
    return type === 'BUY' ? (
      <Badge className="bg-trading-success text-trading-success-foreground">BUY</Badge>
    ) : (
      <Badge className="bg-trading-danger text-trading-danger-foreground">SELL</Badge>
    );
  };

  const getProfitDisplay = (profit: number) => {
    const isProfit = profit >= 0;
    return (
      <span className={`font-medium ${isProfit ? 'text-trading-success' : 'text-trading-danger'}`}>
        {isProfit ? '+' : ''}${profit.toFixed(2)}
      </span>
    );
  };

  const getStatusBadge = (status: Trade['status']) => {
    switch (status) {
      case 'Open':
        return <Badge className="bg-trading-info text-trading-info-foreground">Open</Badge>;
      case 'Closed':
        return <Badge className="bg-trading-neutral text-trading-neutral-foreground">Closed</Badge>;
      case 'Pending':
        return <Badge className="bg-trading-warning text-trading-warning-foreground">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const calculateTotalProfit = () => {
    return trades.reduce((sum, trade) => sum + trade.profit, 0);
  };

  const getOpenTrades = () => trades.filter(trade => trade.status === 'Open');

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
                <p className="text-sm text-muted-foreground">Open Trades</p>
                <p className="text-2xl font-bold">{getOpenTrades().length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-trading-info" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <p className="text-2xl font-bold">{getProfitDisplay(calculateTotalProfit())}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-trading-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Pairs</p>
                <p className="text-2xl font-bold">{new Set(trades.map(t => t.symbol)).size}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-trading-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">{trades.reduce((sum, trade) => sum + trade.volume, 0).toFixed(2)}</p>
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
              <CardTitle>Open Positions</CardTitle>
              <CardDescription>Currently active trades being copied</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Open Price</TableHead>
                    <TableHead>Current Price</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Provider → Copyer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Open Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getOpenTrades().map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="font-medium">{trade.symbol}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTradeTypeIcon(trade.type)}
                          {getTradeTypeBadge(trade.type)}
                        </div>
                      </TableCell>
                      <TableCell>{trade.volume}</TableCell>
                      <TableCell>{trade.openPrice.toFixed(5)}</TableCell>
                      <TableCell>{trade.currentPrice.toFixed(5)}</TableCell>
                      <TableCell>{getProfitDisplay(trade.profit)}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div className="text-trading-info">{trade.provider}</div>
                          <div className="text-muted-foreground">↓</div>
                          <div className="text-trading-warning">{trade.copyer}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(trade.status)}</TableCell>
                      <TableCell>{trade.openTime.toLocaleTimeString()}</TableCell>
                    </TableRow>
                  ))}
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
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-medium">75%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total P&L</span>
                      <span className="font-medium">{getProfitDisplay(calculateTotalProfit())}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Most Active Pairs</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">EURUSD</span>
                      <span className="font-medium">40%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GBPUSD</span>
                      <span className="font-medium">30%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">USDJPY</span>
                      <span className="font-medium">30%</span>
                    </div>
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