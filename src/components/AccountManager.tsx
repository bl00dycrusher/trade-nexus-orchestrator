import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Plus, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { Account } from '@/hooks/useTradingBridge';

interface AccountManagerProps {
  accounts: Account[];
}

export const AccountManager = ({ accounts }: AccountManagerProps) => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: '1',
      name: 'MT5 Main Account',
      platform: 'MT5',
      server: 'Demo-Server',
      accountNumber: '12345678',
      role: 'Provider',
      status: 'Connected'
    },
    {
      id: '2',
      name: 'cTrader Copy Account',
      platform: 'cTrader',
      server: 'ICMarkets-Live',
      accountNumber: '87654321',
      role: 'Copyer',
      status: 'Connected'
    }
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    platform: '',
    server: '',
    accountNumber: '',
    role: ''
  });

  const handleAddAccount = () => {
    if (!newAccount.name || !newAccount.platform || !newAccount.server || !newAccount.accountNumber || !newAccount.role) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const account: Account = {
      id: Date.now().toString(),
      name: newAccount.name,
      platform: newAccount.platform as 'MT5' | 'cTrader',
      server: newAccount.server,
      accountNumber: newAccount.accountNumber,
      role: newAccount.role as 'Provider' | 'Copyer' | 'Both',
      status: 'Disconnected'
    };

    setAccounts([...accounts, account]);
    setNewAccount({ name: '', platform: '', server: '', accountNumber: '', role: '' });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Account added successfully"
    });
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter(acc => acc.id !== id));
    toast({
      title: "Success",
      description: "Account deleted successfully"
    });
  };

  const getStatusBadge = (status: Account['status']) => {
    switch (status) {
      case 'Connected':
        return <Badge className="bg-trading-success text-trading-success-foreground">Connected</Badge>;
      case 'Disconnected':
        return <Badge className="bg-trading-neutral text-trading-neutral-foreground">Disconnected</Badge>;
      case 'Error':
        return <Badge className="bg-trading-danger text-trading-danger-foreground">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRoleBadge = (role: Account['role']) => {
    switch (role) {
      case 'Provider':
        return <Badge className="bg-trading-info text-trading-info-foreground">Provider</Badge>;
      case 'Copyer':
        return <Badge className="bg-trading-warning text-trading-warning-foreground">Copyer</Badge>;
      case 'Both':
        return <Badge className="bg-primary text-primary-foreground">Both</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Account Management</h2>
          <p className="text-muted-foreground">Manage your MT5 and cTrader accounts</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
              <DialogDescription>Configure a new MT5 or cTrader account for the bridge</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Account Name</Label>
                <Input
                  id="name"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  placeholder="Enter account name"
                />
              </div>
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select value={newAccount.platform} onValueChange={(value) => setNewAccount({ ...newAccount, platform: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MT5">MetaTrader 5</SelectItem>
                    <SelectItem value="cTrader">cTrader</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="server">Server</Label>
                <Input
                  id="server"
                  value={newAccount.server}
                  onChange={(e) => setNewAccount({ ...newAccount, server: e.target.value })}
                  placeholder="Enter server name"
                />
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={newAccount.accountNumber}
                  onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newAccount.role} onValueChange={(value) => setNewAccount({ ...newAccount, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Provider">Provider (Send Trades)</SelectItem>
                    <SelectItem value="Copyer">Copyer (Receive Trades)</SelectItem>
                    <SelectItem value="Both">Both (Send & Receive)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddAccount} className="w-full">Add Account</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {account.name}
                    <Badge variant="outline">{account.platform}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {account.server} • Account: {account.accountNumber}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(account.status)}
                  {getRoleBadge(account.role)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteAccount(account.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};