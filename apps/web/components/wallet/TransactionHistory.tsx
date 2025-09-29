
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  TrendingUp, 
  Plus, 
  Minus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Gift,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'DEPOSIT':
      return Plus;
    case 'WITHDRAWAL':
      return Minus;
    case 'PURCHASE':
      return CreditCard;
    case 'EARNING':
      return TrendingUp;
    case 'TRANSFER':
      return ArrowUpRight;
    case 'REFUND':
      return ArrowDownLeft;
    case 'VOUCHER_REDEMPTION':
      return Gift;
    default:
      return History;
  }
};

const getTransactionColor = (type: string) => {
  switch (type) {
    case 'DEPOSIT':
    case 'EARNING':
    case 'REFUND':
    case 'VOUCHER_REDEMPTION':
      return 'text-green-500';
    case 'WITHDRAWAL':
    case 'PURCHASE':
    case 'FEE':
      return 'text-red-500';
    case 'TRANSFER':
      return 'text-blue-500';
    default:
      return 'text-muted-foreground';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'PENDING':
    case 'PROCESSING':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'FAILED':
    case 'CANCELLED':
    case 'EXPIRED':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const formatTransactionType = (type: string) => {
  return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

export function TransactionHistory() {
  const { transactions, getTransactionHistory, isLoading } = useWallet();
  const [filter, setFilter] = useState<'all' | 'deposits' | 'withdrawals' | 'purchases' | 'earnings'>('all');

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    if (filter === 'deposits') return transaction.type === 'DEPOSIT' || transaction.type === 'VOUCHER_REDEMPTION';
    if (filter === 'withdrawals') return transaction.type === 'WITHDRAWAL';
    if (filter === 'purchases') return transaction.type === 'PURCHASE';
    if (filter === 'earnings') return transaction.type === 'EARNING';
    return true;
  });

  const handleViewAll = () => {
    getTransactionHistory(100); // Load more transactions
  };

  return (
    <Card className="bg-card/30 rounded-3xl backdrop-blur-sm border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-poppins font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Transaction History
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewAll}
            className="text-secondary hover:text-secondary/80 font-inter"
          >
            View All
            <ExternalLink className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { key: 'all', label: 'All' },
            { key: 'deposits', label: 'Deposits' },
            { key: 'withdrawals', label: 'Withdrawals' },
            { key: 'purchases', label: 'Purchases' },
            { key: 'earnings', label: 'Earnings' }
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={filter === key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(key as any)}
              className={cn(
                'font-inter text-xs',
                filter === key && 'bg-primary text-primary-foreground glow-purple'
              )}
            >
              {label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground font-inter">Loading transactions...</div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground font-inter mb-2">No transactions found</p>
              <p className="text-sm text-muted-foreground/70 font-inter">
                Your transaction history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => {
                const Icon = getTransactionIcon(transaction.type);
                const isPositive = ['DEPOSIT', 'EARNING', 'REFUND', 'VOUCHER_REDEMPTION'].includes(transaction.type);
                
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200 border border-muted/20"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        isPositive 
                          ? 'bg-green-500/20 text-green-500' 
                          : 'bg-red-500/20 text-red-500'
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="space-y-1">
                        <p className="font-medium text-foreground font-inter">
                          {transaction.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground font-inter">
                            {format(new Date(transaction.createdAt), 'MMM d, yyyy • h:mm a')}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-xs font-inter border',
                              getStatusColor(transaction.status)
                            )}
                          >
                            {formatTransactionType(transaction.status)}
                          </Badge>
                        </div>
                        
                        {transaction.reference && (
                          <p className="text-xs text-muted-foreground font-mono">
                            Ref: {transaction.reference}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <p className={cn(
                        'font-bold font-poppins',
                        getTransactionColor(transaction.type)
                      )}>
                        {isPositive ? '+' : '-'}
                        {Math.abs(transaction.amount).toLocaleString()} {transaction.currency}
                      </p>
                      
                      {transaction.fee && transaction.fee > 0 && (
                        <p className="text-xs text-muted-foreground font-inter">
                          Fee: {transaction.fee} {transaction.currency}
                        </p>
                      )}
                      
                      {transaction.paymentProvider && (
                        <p className="text-xs text-muted-foreground font-inter capitalize">
                          via {transaction.paymentProvider.toLowerCase().replace('_', ' ')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
