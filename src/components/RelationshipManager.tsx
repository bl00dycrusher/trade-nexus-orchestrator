import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowRight, Plus, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Account, Relationship } from '@/hooks/useTradingBridge';

interface RelationshipManagerProps {
  accounts: Account[];
  relationships: Relationship[];
  onCreateRelationship: (providerId: string, copyerId: string, volumeMultiplier?: number) => void;
}

export const RelationshipManager = ({ accounts, relationships, onCreateRelationship }: RelationshipManagerProps) => {
  const { toast } = useToast();
  
  // Mock accounts data
  const [accounts] = useState<Account[]>([
    { id: '1', name: 'MT5 Main Account', platform: 'MT5', role: 'Provider' },
    { id: '2', name: 'cTrader Copy Account', platform: 'cTrader', role: 'Copyer' },
    { id: '3', name: 'MT5 Secondary', platform: 'MT5', role: 'Both' },
    { id: '4', name: 'cTrader Pro', platform: 'cTrader', role: 'Both' }
  ]);

  const [relationships, setRelationships] = useState<Relationship[]>([
    {
      id: '1',
      providerId: '1',
      copyerId: '2',
      multiplier: 1.0,
      maxLots: 10.0,
      enabled: true,
      createdAt: new Date()
    },
    {
      id: '2',
      providerId: '3',
      copyerId: '4',
      multiplier: 0.5,
      maxLots: 5.0,
      enabled: false,
      createdAt: new Date()
    }
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRelationship, setNewRelationship] = useState({
    providerId: '',
    copyerId: '',
    multiplier: '1.0',
    maxLots: '10.0'
  });

  const getAccount = (id: string) => accounts.find(acc => acc.id === id);

  const getProviders = () => accounts.filter(acc => acc.role === 'Provider' || acc.role === 'Both');
  const getCopyers = () => accounts.filter(acc => acc.role === 'Copyer' || acc.role === 'Both');

  const handleAddRelationship = () => {
    if (!newRelationship.providerId || !newRelationship.copyerId) {
      toast({
        title: "Error",
        description: "Please select both provider and copyer accounts",
        variant: "destructive"
      });
      return;
    }

    if (newRelationship.providerId === newRelationship.copyerId) {
      toast({
        title: "Error",
        description: "Provider and copyer cannot be the same account",
        variant: "destructive"
      });
      return;
    }

    const relationship: Relationship = {
      id: Date.now().toString(),
      providerId: newRelationship.providerId,
      copyerId: newRelationship.copyerId,
      multiplier: parseFloat(newRelationship.multiplier),
      maxLots: parseFloat(newRelationship.maxLots),
      enabled: true,
      createdAt: new Date()
    };

    setRelationships([...relationships, relationship]);
    setNewRelationship({ providerId: '', copyerId: '', multiplier: '1.0', maxLots: '10.0' });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Relationship created successfully"
    });
  };

  const handleToggleRelationship = (id: string) => {
    setRelationships(relationships.map(rel => 
      rel.id === id ? { ...rel, enabled: !rel.enabled } : rel
    ));
  };

  const handleDeleteRelationship = (id: string) => {
    setRelationships(relationships.filter(rel => rel.id !== id));
    toast({
      title: "Success",
      description: "Relationship deleted successfully"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Account Relationships</h2>
          <p className="text-muted-foreground">Configure trade copying relationships between accounts</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Relationship
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Relationship</DialogTitle>
              <DialogDescription>Set up a trade copying relationship between two accounts</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="provider">Provider Account</Label>
                <Select value={newRelationship.providerId} onValueChange={(value) => setNewRelationship({ ...newRelationship, providerId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider account" />
                  </SelectTrigger>
                  <SelectContent>
                    {getProviders().map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.platform})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="copyer">Copyer Account</Label>
                <Select value={newRelationship.copyerId} onValueChange={(value) => setNewRelationship({ ...newRelationship, copyerId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select copyer account" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCopyers().map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.platform})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="multiplier">Volume Multiplier</Label>
                  <Input
                    id="multiplier"
                    type="number"
                    step="0.1"
                    value={newRelationship.multiplier}
                    onChange={(e) => setNewRelationship({ ...newRelationship, multiplier: e.target.value })}
                    placeholder="1.0"
                  />
                </div>
                <div>
                  <Label htmlFor="maxLots">Max Lots</Label>
                  <Input
                    id="maxLots"
                    type="number"
                    step="0.1"
                    value={newRelationship.maxLots}
                    onChange={(e) => setNewRelationship({ ...newRelationship, maxLots: e.target.value })}
                    placeholder="10.0"
                  />
                </div>
              </div>
              <Button onClick={handleAddRelationship} className="w-full">Create Relationship</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {relationships.map((relationship) => {
          const provider = getAccount(relationship.providerId);
          const copyer = getAccount(relationship.copyerId);
          
          return (
            <Card key={relationship.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">Trade Copy Relationship</CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={relationship.enabled}
                      onCheckedChange={() => handleToggleRelationship(relationship.id)}
                    />
                    <Badge className={relationship.enabled ? "bg-trading-success text-trading-success-foreground" : "bg-trading-neutral text-trading-neutral-foreground"}>
                      {relationship.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Account Flow */}
                  <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="font-medium">{provider?.name}</div>
                        <Badge variant="outline" className="text-xs">{provider?.platform}</Badge>
                        <div className="text-xs text-trading-info">Provider</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      <div className="text-center px-3">
                        <div className="text-sm font-medium">×{relationship.multiplier}</div>
                        <div className="text-xs text-muted-foreground">multiplier</div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="font-medium">{copyer?.name}</div>
                        <Badge variant="outline" className="text-xs">{copyer?.platform}</Badge>
                        <div className="text-xs text-trading-warning">Copyer</div>
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Volume Multiplier</Label>
                      <div className="font-medium">{relationship.multiplier}x</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Max Lots</Label>
                      <div className="font-medium">{relationship.maxLots}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Created</Label>
                      <div className="font-medium">{relationship.createdAt.toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                      Status: {relationship.enabled ? 'Monitoring for trades' : 'Paused'}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteRelationship(relationship.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {relationships.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-center">
              <h3 className="text-lg font-medium text-foreground mb-2">No Relationships Configured</h3>
              <p className="text-muted-foreground mb-4">Create your first trade copying relationship to get started</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Relationship
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};