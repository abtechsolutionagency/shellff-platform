
'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Copy, 
  QrCode, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CryptoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: {
    batchId: string;
    quantity: number;
    totalCost: number;
    network: string;
    paymentAddress: string;
    qrCode: string;
    instructions: string;
    expiresAt: string;
    status: string;
  };
  onPaymentComplete: (batchId: string) => void;
}

export function CryptoPaymentModal({
  isOpen,
  onClose,
  paymentData,
  onPaymentComplete
}: CryptoPaymentModalProps) {
  const [paymentStatus, setPaymentStatus] = useState<string>(paymentData.status);
  const [confirmations, setConfirmations] = useState<number>(0);
  const [txHash, setTxHash] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timeLeftRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && paymentStatus === 'awaiting_payment') {
      startStatusPolling();
      startTimeCountdown();
    }

    return () => {
      stopStatusPolling();
      stopTimeCountdown();
    };
  }, [isOpen, paymentStatus]);

  useEffect(() => {
    if (paymentStatus === 'confirmed') {
      stopStatusPolling();
      setTimeout(() => {
        onPaymentComplete(paymentData.batchId);
      }, 2000);
    }
  }, [paymentStatus]);

  const startStatusPolling = () => {
    const checkStatus = async () => {
      setStatusLoading(true);
      try {
        const response = await fetch(`/api/crypto/payment-status/${paymentData.batchId}`);
        const data = await response.json();

        if (data.success) {
          setPaymentStatus(data.data.status);
          setConfirmations(data.data.confirmations || 0);
          setTxHash(data.data.txHash || '');
        }
      } catch (error) {
        console.error('Status check error:', error);
      } finally {
        setStatusLoading(false);
      }
    };

    // Check immediately
    checkStatus();
    
    // Then poll every 15 seconds
    pollingRef.current = setInterval(checkStatus, 15000);
  };

  const stopStatusPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startTimeCountdown = () => {
    const updateTimeLeft = () => {
      const expires = new Date(paymentData.expiresAt);
      const now = new Date();
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expired');
        setIsExpired(true);
        stopTimeCountdown();
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimeLeft();
    timeLeftRef.current = setInterval(updateTimeLeft, 1000);
  };

  const stopTimeCountdown = () => {
    if (timeLeftRef.current) {
      clearInterval(timeLeftRef.current);
      timeLeftRef.current = null;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusInfo = () => {
    switch (paymentStatus) {
      case 'awaiting_payment':
        return {
          icon: <Clock className="h-5 w-5 text-orange-600" />,
          title: 'Awaiting Payment',
          description: 'Send USDT to the address below to complete your purchase',
          color: 'orange'
        };
      case 'pending':
        return {
          icon: <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />,
          title: 'Payment Detected',
          description: `Waiting for blockchain confirmation (${confirmations}/3)`,
          color: 'blue'
        };
      case 'confirmed':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          title: 'Payment Confirmed',
          description: 'Your unlock codes are being generated!',
          color: 'green'
        };
      case 'failed':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
          title: 'Payment Failed',
          description: 'There was an issue with your payment',
          color: 'red'
        };
      default:
        return {
          icon: <Clock className="h-5 w-5 text-gray-600" />,
          title: 'Processing',
          description: 'Processing your payment...',
          color: 'gray'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {statusInfo.icon}
            {statusInfo.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Description */}
          <p className="text-sm text-muted-foreground">
            {statusInfo.description}
          </p>

          {/* Payment Details */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Amount:</span>
                <span className="font-semibold">${paymentData.totalCost.toLocaleString()} USDT</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span>Network:</span>
                <Badge variant="outline">{paymentData.network}</Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span>Quantity:</span>
                <span>{paymentData.quantity.toLocaleString()} codes</span>
              </div>

              {!isExpired && (
                <div className="flex items-center justify-between text-sm">
                  <span>Time remaining:</span>
                  <Badge variant={isExpired ? "destructive" : "secondary"}>
                    {timeLeft}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          {paymentStatus === 'awaiting_payment' && !isExpired && (
            <>
              <Separator />
              
              <div className="space-y-3">
                <div className="text-sm font-medium">Payment Address</div>
                
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="flex-1 text-xs break-all font-mono">
                    {paymentData.paymentAddress}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(paymentData.paymentAddress, 'Address')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {paymentData.instructions}
                  </AlertDescription>
                </Alert>
              </div>
            </>
          )}

          {/* Transaction Hash */}
          {txHash && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-sm font-medium">Transaction Hash</div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="flex-1 text-xs break-all font-mono">
                    {txHash}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(txHash, 'Transaction hash')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`https://tronscan.org/#/transaction/${txHash}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Expired State */}
          {isExpired && paymentStatus === 'awaiting_payment' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This payment session has expired. Please start a new code generation to try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {paymentStatus === 'awaiting_payment' && !isExpired && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => startStatusPolling()}
                disabled={statusLoading}
              >
                {statusLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Check Status
              </Button>
            )}
            
            {(paymentStatus === 'confirmed' || isExpired || paymentStatus === 'failed') && (
              <Button onClick={onClose} className="flex-1">
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
