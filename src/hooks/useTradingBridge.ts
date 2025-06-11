import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Account {
  account_id: string;
  platform: 'mt5' | 'ctrader';
  account_type: 'provider' | 'copyer' | 'both';
  display_name: string;
  is_connected: boolean;
}

export interface Relationship {
  provider_id: string;
  copyer_id: string;
  volume_multiplier: number;
  is_active: boolean;
}

export interface TradeData {
  symbol: string;
  action: string;
  volume: number;
  price: number;
  sl?: number;
  tp?: number;
  comment?: string;
  magic_number?: number;
  timestamp?: string;
}

export interface BridgeMessage {
  type: string;
  [key: string]: any;
}

export const useTradingBridge = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const connect = useCallback(() => {
    try {
      const websocket = new WebSocket('ws://localhost:8765/gui');
      
      websocket.onopen = () => {
        console.log('Connected to Trading Bridge');
        setIsConnected(true);
        setConnectionAttempts(0);
        setWs(websocket);
        
        toast({
          title: "Connected",
          description: "Successfully connected to Trading Bridge server"
        });

        // Request initial data
        websocket.send(JSON.stringify({ type: 'get_accounts' }));
        websocket.send(JSON.stringify({ type: 'get_relationships' }));
      };

      websocket.onmessage = (event) => {
        try {
          const message: BridgeMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      websocket.onclose = () => {
        console.log('Disconnected from Trading Bridge');
        setIsConnected(false);
        setWs(null);
        
        // Attempt to reconnect
        if (connectionAttempts < maxReconnectAttempts) {
          setConnectionAttempts(prev => prev + 1);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else {
          toast({
            title: "Connection Lost",
            description: "Could not reconnect to Trading Bridge server",
            variant: "destructive"
          });
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to Trading Bridge server",
          variant: "destructive"
        });
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      toast({
        title: "Connection Failed",
        description: "Unable to establish connection to bridge server",
        variant: "destructive"
      });
    }
  }, [connectionAttempts, toast]);

  const handleMessage = useCallback((message: BridgeMessage) => {
    switch (message.type) {
      case 'accounts_list':
        setAccounts(message.accounts || []);
        break;
        
      case 'relationships_list':
        setRelationships(message.relationships || []);
        break;
        
      case 'account_registered':
        setAccounts(prev => {
          const existing = prev.find(acc => acc.account_id === message.account.account_id);
          if (existing) {
            return prev.map(acc => 
              acc.account_id === message.account.account_id ? message.account : acc
            );
          }
          return [...prev, message.account];
        });
        toast({
          title: "Account Connected",
          description: `${message.account.display_name} has connected`
        });
        break;
        
      case 'trade_copied':
        setTrades(prev => [{
          id: Date.now().toString(),
          from: message.from,
          to: message.to,
          trade: message.trade,
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 99)]); // Keep last 100 trades
        
        toast({
          title: "Trade Copied",
          description: `${message.trade.symbol} ${message.trade.action} copied from ${message.from} to ${message.to}`
        });
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }, [toast]);

  const sendMessage = useCallback((message: BridgeMessage) => {
    if (ws && isConnected) {
      ws.send(JSON.stringify(message));
    }
  }, [ws, isConnected]);

  const createRelationship = useCallback((providerId: string, copyerId: string, volumeMultiplier: number = 1.0) => {
    sendMessage({
      type: 'create_relationship',
      provider_id: providerId,
      copyer_id: copyerId,
      volume_multiplier: volumeMultiplier
    });
  }, [sendMessage]);

  const refreshData = useCallback(() => {
    if (isConnected) {
      sendMessage({ type: 'get_accounts' });
      sendMessage({ type: 'get_relationships' });
    }
  }, [isConnected, sendMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (ws) {
      ws.close();
    }
    setIsConnected(false);
    setWs(null);
  }, [ws]);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    accounts,
    relationships,
    trades,
    connect,
    disconnect,
    createRelationship,
    refreshData,
    sendMessage
  };
};