
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info, QrCode, Shield, DollarSign } from 'lucide-react';

interface PhysicalUnlockToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  releaseType: string;
  className?: string;
}

export function PhysicalUnlockToggle({ 
  enabled, 
  onChange, 
  releaseType, 
  className = '' 
}: PhysicalUnlockToggleProps) {
  
  // Only show for physical and hybrid releases
  if (releaseType !== 'physical' && releaseType !== 'hybrid') {
    return null;
  }

  const features = [
    {
      icon: QrCode,
      title: 'Unique Unlock Codes',
      description: 'Generate QR codes and alphanumeric codes for each physical copy'
    },
    {
      icon: Shield,
      title: 'Anti-Piracy Protection',
      description: 'One-time use codes with device tracking and fraud detection'
    },
    {
      icon: DollarSign,
      title: 'Tiered Pricing',
      description: 'Volume discounts available - from $50 to $20 per code based on quantity'
    }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Physical Album Unlock System
          </div>
          {releaseType === 'physical' && (
            <Badge variant="secondary">Required</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch 
            id="physical-unlock"
            checked={enabled || releaseType === 'physical'} // Force enabled for physical-only
            onCheckedChange={onChange}
            disabled={releaseType === 'physical'} // Can't disable for physical-only releases
          />
          <Label htmlFor="physical-unlock" className="text-sm font-medium">
            Enable Physical Album Unlock Codes
          </Label>
        </div>

        {releaseType === 'physical' && (
          <div className="text-xs text-muted-foreground">
            <Info className="h-3 w-3 inline mr-1" />
            Physical-only releases require unlock codes to be enabled.
          </div>
        )}

        {enabled && (
          <>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm">
                <div className="font-medium mb-2">How it works:</div>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Generate unique unlock codes for your physical copies</li>
                  <li>Include codes/QR codes with your CDs, vinyl, or USB drives</li>
                  <li>Fans redeem codes to unlock digital access on Shellff</li>
                  <li>Track redemptions and analyze your physical sales</li>
                </ol>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium">Features included:</div>
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="flex items-start gap-3">
                    <IconComponent className="h-4 w-4 mt-0.5 text-primary" />
                    <div>
                      <div className="text-sm font-medium">{feature.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {feature.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border border-amber-200 bg-amber-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 mt-0.5 text-amber-600" />
                <div className="text-sm">
                  <div className="font-medium text-amber-900 mb-1">
                    Code Generation Pricing
                  </div>
                  <div className="text-amber-700 text-xs">
                    • 1-999 codes: $50 each • 1000-4999: $30 each • 5000+: $20 each
                    <br />
                    Pay with your Shellff wallet or USDT (multiple networks supported).
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
