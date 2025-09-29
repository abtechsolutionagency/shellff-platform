
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, Plus, Minus, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';

interface WalletTabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function WalletTab({ label, isActive, onClick }: WalletTabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-6 py-3 rounded-lg font-inter font-medium transition-all duration-200 transform hover:scale-105',
        isActive
          ? 'bg-primary text-primary-foreground shadow-lg glow-purple'
          : 'bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground glow-teal'
      )}
    >
      {label}
    </button>
  );
}

interface BalanceCardProps {
  balance: number;
  currency: string;
  type: 'PURCHASES' | 'EARNINGS';
  isHidden: boolean;
}

function BalanceCard({ balance, currency, type, isHidden }: BalanceCardProps) {
  const getDisplayBalance = () => {
    if (isHidden) return '****';
    return balance.toLocaleString('en-US', { 
      minimumFractionDigits: currency === 'SHC' ? 0 : 2,
      maximumFractionDigits: currency === 'SHC' ? 0 : 2
    });
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
      <div className="relative bg-card rounded-2xl p-8 text-center backdrop-blur-sm border border-primary/20 shadow-2xl">
        <div className="mb-4">
          <p className="text-muted-foreground mb-2 font-inter">
            {type === 'PURCHASES' ? 'Purchases Balance' : 'Earnings Balance'}
          </p>
          <div className="text-4xl lg:text-5xl text-foreground mb-1 font-poppins font-bold">
            {getDisplayBalance()}
          </div>
          <p className="text-primary text-lg font-inter">
            {currency}
          </p>
        </div>
        
        <div className="flex items-center justify-center">
          <div className={cn(
            'w-3 h-3 rounded-full animate-pulse',
            type === 'PURCHASES' ? 'bg-green-500' : 'bg-secondary'
          )}></div>
          <span className="ml-2 text-sm text-muted-foreground font-inter">
            {type === 'PURCHASES' ? 'Ready to spend' : 'Available to withdraw'}
          </span>
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  icon: React.ElementType;
  variant: 'primary' | 'secondary';
  onClick: () => void;
  feeText?: string;
  disabled?: boolean;
}

function ActionButton({ label, icon: Icon, variant, onClick, feeText, disabled }: ActionButtonProps) {
  return (
    <div className="flex flex-col">
      <Button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'px-8 py-4 rounded-xl font-inter font-medium transition-all duration-200 transform hover:scale-105',
          variant === 'primary' && 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg glow-purple',
          variant === 'secondary' && 'bg-muted hover:bg-secondary text-muted-foreground hover:text-secondary-foreground border border-muted-foreground/20'
        )}
      >
        <Icon className="w-5 h-5 mr-2" />
        {label}
      </Button>
      {feeText && (
        <p className="text-xs text-muted-foreground mt-2 text-center font-inter">
          {feeText}
        </p>
      )}
    </div>
  );
}

export function WalletOverview() {
  const { wallets, isLoading, refreshWallets, getWalletBalance } = useWallet();
  const [activeTab, setActiveTab] = useState<'PURCHASES' | 'EARNINGS'>('PURCHASES');
  const [balanceHidden, setBalanceHidden] = useState(false);

  const purchasesWallet = getWalletBalance('PURCHASES');
  const earningsWallet = getWalletBalance('EARNINGS');
  
  const currentWallet = activeTab === 'PURCHASES' ? purchasesWallet : earningsWallet;

  const handleTopUp = () => {
    // Open deposit modal
    console.log('Opening top-up modal...');
  };

  const handleWithdraw = () => {
    // Open withdrawal modal
    console.log('Opening withdrawal modal...');
  };

  const handleRefresh = async () => {
    await refreshWallets();
  };

  return (
    <Card className="bg-card/30 rounded-3xl backdrop-blur-sm border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-poppins font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            My Wallet
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBalanceHidden(!balanceHidden)}
              className="text-muted-foreground hover:text-foreground"
            >
              {balanceHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Wallet Tabs */}
        <div className="flex flex-col sm:flex-row gap-2">
          <WalletTab
            label="Purchases Wallet"
            isActive={activeTab === 'PURCHASES'}
            onClick={() => setActiveTab('PURCHASES')}
          />
          <WalletTab
            label="Earnings Wallet"
            isActive={activeTab === 'EARNINGS'}
            onClick={() => setActiveTab('EARNINGS')}
          />
        </div>

        {/* Balance Card */}
        <div className="mb-8">
          {currentWallet ? (
            <BalanceCard 
              balance={currentWallet.balance} 
              currency={currentWallet.currency} 
              type={activeTab}
              isHidden={balanceHidden}
            />
          ) : (
            <div className="relative bg-muted/50 rounded-2xl p-8 text-center border border-muted">
              <p className="text-muted-foreground font-inter">
                {isLoading ? 'Loading wallet...' : 'Wallet not found'}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <ActionButton
              label="Top Up"
              icon={Plus}
              variant="primary"
              onClick={handleTopUp}
              disabled={isLoading || activeTab === 'EARNINGS'} // Can't top up earnings wallet
            />
          </div>
          <div className="flex-1">
            <ActionButton
              label="Withdraw"
              icon={Minus}
              variant="secondary"
              onClick={handleWithdraw}
              feeText={activeTab === 'EARNINGS' ? 'Minimum: 50 SHC, Fee: $1 SOL' : undefined}
              disabled={isLoading || (currentWallet?.balance || 0) <= 0}
            />
          </div>
        </div>

        {/* Quick Stats for active wallet type */}
        <div className="pt-4 border-t border-muted">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-inter">Wallet Status</span>
            <Badge variant={currentWallet?.isActive ? "default" : "secondary"} className="font-inter">
              {currentWallet?.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
