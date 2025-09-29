
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { WalletBalance, Transaction, PaymentMethod } from '@/lib/types/wallet';
import { toast } from 'sonner';

interface WalletContextType {
  wallets: WalletBalance[];
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  
  // Wallet operations
  refreshWallets: () => Promise<void>;
  getWalletBalance: (type: 'PURCHASES' | 'EARNINGS') => WalletBalance | null;
  
  // Transactions
  getTransactionHistory: (limit?: number) => Promise<void>;
  
  // Payment operations
  initiateDeposit: (amount: number, provider: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  requestWithdrawal: (amount: number, walletAddress?: string) => Promise<{ success: boolean; error?: string }>;
  redeemVoucher: (code: string) => Promise<{ success: boolean; error?: string }>;
  
  // Payment methods
  getPaymentMethods: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { data: session } = useSession() || {};
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize wallets when user logs in
  useEffect(() => {
    if (session?.user) {
      refreshWallets();
      getPaymentMethods();
      getTransactionHistory(10);
    }
  }, [session?.user]);

  const refreshWallets = async () => {
    if (!session?.user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/wallet/balances');
      
      if (response.ok) {
        const data = await response.json();
        setWallets(data.wallets || []);
      } else {
        console.error('Failed to fetch wallet balances');
      }
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
      toast.error('Failed to load wallet balances');
    } finally {
      setIsLoading(false);
    }
  };

  const getWalletBalance = (type: 'PURCHASES' | 'EARNINGS') => {
    return wallets.find(wallet => wallet.type === type) || null;
  };

  const getTransactionHistory = async (limit = 50) => {
    if (!session?.user) return;
    
    try {
      const response = await fetch(`/api/wallet/transactions?limit=${limit}`);
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const initiateDeposit = async (amount: number, provider: string) => {
    if (!session?.user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          paymentProvider: provider,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Deposit initiated successfully');
        await refreshWallets();
        await getTransactionHistory();
        return { success: true, data };
      } else {
        toast.error(data.error || 'Failed to initiate deposit');
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error initiating deposit:', error);
      toast.error('Failed to initiate deposit');
      return { success: false, error: 'Network error' };
    }
  };

  const requestWithdrawal = async (amount: number, walletAddress?: string) => {
    if (!session?.user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          walletAddress,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Withdrawal request submitted');
        await refreshWallets();
        await getTransactionHistory();
        return { success: true };
      } else {
        toast.error(data.error || 'Failed to request withdrawal');
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      toast.error('Failed to request withdrawal');
      return { success: false, error: 'Network error' };
    }
  };

  const redeemVoucher = async (code: string) => {
    if (!session?.user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const response = await fetch('/api/wallet/voucher/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Voucher redeemed! ${data.amount} ${data.currency} added to your wallet`);
        await refreshWallets();
        await getTransactionHistory();
        return { success: true };
      } else {
        toast.error(data.error || 'Failed to redeem voucher');
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error redeeming voucher:', error);
      toast.error('Failed to redeem voucher');
      return { success: false, error: 'Network error' };
    }
  };

  const getPaymentMethods = async () => {
    try {
      const response = await fetch('/api/wallet/payment-methods');
      
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.methods || []);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const value = {
    wallets,
    transactions,
    paymentMethods,
    isLoading,
    refreshWallets,
    getWalletBalance,
    getTransactionHistory,
    initiateDeposit,
    requestWithdrawal,
    redeemVoucher,
    getPaymentMethods,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}
