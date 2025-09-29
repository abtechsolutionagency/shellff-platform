
export interface WalletBalance {
  type: 'PURCHASES' | 'EARNINGS';
  balance: number;
  currency: string;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PURCHASE' | 'EARNING' | 'TRANSFER' | 'FEE' | 'REFUND' | 'VOUCHER_REDEMPTION';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  amount: number;
  currency: string;
  description: string;
  createdAt: Date;
  completedAt?: Date;
  reference?: string;
  paymentProvider?: string;
  fee?: number;
}

export interface PaymentMethod {
  id: string;
  provider: 'PAYSTACK' | 'OPAY' | 'STRIPE' | 'MYFATOORAH' | 'CRYPTO_SOL' | 'VOUCHER' | 'ADMIN_CREDIT';
  name: string;
  isEnabled: boolean;
  discountRate: number;
  currency: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface DepositRequest {
  amount: number;
  paymentProvider: string;
  currency: string;
  returnUrl?: string;
}

export interface WithdrawRequest {
  amount: number;
  walletAddress?: string;
  currency: string;
}

export interface VoucherRedemption {
  code: string;
}
