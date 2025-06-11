import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, Server } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  onRefresh: () => void;
}

export const ConnectionStatus = ({ isConnected, onRefresh }: ConnectionStatusProps) => {
  const [connections, setConnections] = useState<ConnectionInfo[]>([
    {
      service: 'Bridge Server',
      status: 'connected',
      lastUpdate: new Date()
    },
    {
      service: 'MT5 Gateway',
      status: 'connected',
      lastUpdate: new Date()
    },
    {
      service: 'cTrader Gateway',
      status: 'disconnected',
      lastUpdate: new Date()
    }
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const getStatusIcon = (status: ConnectionInfo['status']) => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-trading-success" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-trading-neutral-foreground" />;
      case 'error':
        return <WifiOff className="h-4 w-4 text-trading-danger" />;
      default:
        return <WifiOff className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: ConnectionInfo['status']) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-trading-success text-trading-success-foreground text-xs">Online</Badge>;
      case 'disconnected':
        return <Badge className="bg-trading-neutral text-trading-neutral-foreground text-xs">Offline</Badge>;
      case 'error':
        return <Badge className="bg-trading-danger text-trading-danger-foreground text-xs">Error</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update connection statuses (mock data)
    setConnections(prev => prev.map(conn => ({
      ...conn,
      lastUpdate: new Date(),
      status: Math.random() > 0.3 ? 'connected' : 'disconnected'
    })));
    
    setIsRefreshing(false);
  };

  const overallStatus = connections.every(conn => conn.status === 'connected') 
    ? 'connected' 
    : connections.some(conn => conn.status === 'error') 
    ? 'error' 
    : 'disconnected';

  return (
    <Card className="w-80">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            <span className="font-medium">System Status</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(overallStatus)}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {connections.map((connection, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {getStatusIcon(connection.status)}
                <span>{connection.service}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {connection.lastUpdate.toLocaleTimeString()}
                </span>
                {getStatusBadge(connection.status)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Bridge Protocol: {overallStatus === 'connected' ? 'Active' : 'Inactive'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};