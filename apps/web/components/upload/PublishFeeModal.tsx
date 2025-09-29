
'use client';

import { X, DollarSign, AlertTriangle, Check, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface PublishFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  releaseType: 'SINGLE' | 'ALBUM' | 'EP';
  fee: number;
}

export function PublishFeeModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  releaseType, 
  fee 
}: PublishFeeModalProps) {
  if (!isOpen) return null;

  const releaseTypeLabels = {
    SINGLE: 'Single',
    ALBUM: 'Album', 
    EP: 'EP'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl
        w-[90vw] max-w-md mx-4 p-6 space-y-6 transform transition-all
        shadow-[0_0_40px_rgba(155,93,229,0.2)]">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white font-poppins flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Publishing Fee
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Ready to Publish Your {releaseTypeLabels[releaseType]}?
            </h3>
            <p className="text-gray-400 text-sm">
              Your music will be reviewed and published within 24-48 hours
            </p>
          </div>

          {/* Fee breakdown */}
          <Card className="bg-gray-800/50 border-gray-600 p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-inter">
                  {releaseTypeLabels[releaseType]} Publishing Fee
                </span>
                <span className="text-white font-semibold">
                  ${fee}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Processing Fee</span>
                <span className="text-gray-400">$0</span>
              </div>
              <div className="border-t border-gray-600 pt-2">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-white">Total</span>
                  <span className="text-green-400">${fee}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Important notes */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-amber-300 font-medium mb-1">Important Notes:</p>
                <ul className="text-amber-200/80 space-y-1">
                  <li>• Fee is fully refundable if your release is rejected</li>
                  <li>• Review process takes 24-48 hours</li>
                  <li>• You&apos;ll be notified of the review status via email</li>
                  <li>• Fee will be deducted from your Purchases Wallet</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-green-300 font-medium mb-1">What You Get:</p>
                <ul className="text-green-200/80 space-y-1">
                  <li>• Professional content review</li>
                  <li>• Global distribution on Shellff platform</li>
                  <li>• Automatic royalty management</li>
                  <li>• Stream-to-Earn eligibility (when enabled)</li>
                  <li>• Detailed analytics and insights</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
          >
            Pay ${fee} & Publish
          </Button>
        </div>
      </div>
    </div>
  );
}

