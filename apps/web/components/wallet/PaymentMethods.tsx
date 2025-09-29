
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Coins,
  Gift,
  Check,
  AlertCircle,
  Percent
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';

const getProviderIcon = (provider: string) => {
  switch (provider) {
    case 'PAYSTACK':
    case 'STRIPE':
      return CreditCard;
    case 'OPAY':
      return Smartphone;
    case 'MYFATOORAH':
      return Banknote;
    case 'CRYPTO_SOL':
      return Coins;
    case 'VOUCHER':
      return Gift;
    default:
      return CreditCard;
  }
};

const getProviderColor = (provider: string) => {
  switch (provider) {
    case 'PAYSTACK':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'OPAY':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'STRIPE':
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'MYFATOORAH':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    case 'CRYPTO_SOL':
      return 'bg-gradient-to-r from-purple-500/10 to-green-500/10 text-primary border-primary/20';
    case 'VOUCHER':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

interface PaymentMethodCardProps {
  method: {
    id: string;
    provider: string;
    name: string;
    isEnabled: boolean;
    discountRate: number;
    currency: string;
    minAmount?: number;
    maxAmount?: number;
  };
  isSelected: boolean;
  onSelect: () => void;
}

function PaymentMethodCard({ method, isSelected, onSelect }: PaymentMethodCardProps) {
  const Icon = getProviderIcon(method.provider);
  
  return (
    <div
      onClick={method.isEnabled ? onSelect : undefined}
      className={cn(
        'relative p-4 rounded-xl border transition-all duration-200 cursor-pointer',
        'hover:shadow-lg hover:scale-105',
        method.isEnabled ? 'border-muted hover:border-primary/50' : 'border-muted/50 opacity-50 cursor-not-allowed',
        isSelected && 'border-primary bg-primary/5 glow-purple'
      )}
    >
      {/* Selected indicator */}
      {isSelected && method.isEnabled && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      <div className="flex items-center space-x-3">
        <div className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center border',
          getProviderColor(method.provider)
        )}>
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium font-inter text-foreground">
              {method.name}
            </h4>
            {!method.isEnabled && (
              <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                Disabled
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-inter">{method.currency}</span>
            
            {method.discountRate > 0 && (
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                <Percent className="w-3 h-3 mr-1" />
                {(method.discountRate * 100).toFixed(1)}% off
              </Badge>
            )}
          </div>
          
          {(method.minAmount || method.maxAmount) && (
            <p className="text-xs text-muted-foreground font-inter">
              {method.minAmount && `Min: ${method.minAmount} ${method.currency}`}
              {method.minAmount && method.maxAmount && ' • '}
              {method.maxAmount && `Max: ${method.maxAmount} ${method.currency}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface PaymentMethodsProps {
  selectedMethod?: string;
  onMethodSelect: (methodId: string) => void;
  amount?: number;
  onAmountChange?: (amount: number) => void;
  showAmountInput?: boolean;
}

export function PaymentMethods({ 
  selectedMethod, 
  onMethodSelect, 
  amount = 0, 
  onAmountChange, 
  showAmountInput = false 
}: PaymentMethodsProps) {
  const { paymentMethods, isLoading } = useWallet();
  const [localAmount, setLocalAmount] = useState(amount);

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setLocalAmount(numValue);
    onAmountChange?.(numValue);
  };

  const getFilteredMethods = () => {
    if (!showAmountInput || localAmount === 0) return paymentMethods;
    
    return paymentMethods.filter(method => {
      if (!method.isEnabled) return false;
      if (method.minAmount && localAmount < method.minAmount) return false;
      if (method.maxAmount && localAmount > method.maxAmount) return false;
      return true;
    });
  };

  const filteredMethods = getFilteredMethods();

  return (
    <Card className="bg-card/30 rounded-3xl backdrop-blur-sm border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl font-poppins font-bold flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Payment Methods
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {showAmountInput && (
          <div className="space-y-2">
            <Label htmlFor="amount" className="font-inter font-medium">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={localAmount || ''}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="font-inter"
              min="0"
              step="0.01"
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground font-inter">Loading payment methods...</div>
          </div>
        ) : filteredMethods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-inter mb-2">
              {showAmountInput && localAmount > 0 
                ? 'No payment methods available for this amount'
                : 'No payment methods available'
              }
            </p>
            <p className="text-sm text-muted-foreground/70 font-inter">
              Contact support if you need assistance
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                isSelected={selectedMethod === method.id}
                onSelect={() => onMethodSelect(method.id)}
              />
            ))}
          </div>
        )}

        {showAmountInput && localAmount > 0 && (
          <div className="pt-4 border-t border-muted">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span className="font-inter">
                Only showing payment methods available for ${localAmount.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
