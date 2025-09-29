
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Save, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';

interface SecurityConfig {
  id?: string;
  deviceLockingEnabled: boolean;
  ipLockingEnabled: boolean;
  allowDeviceChange: boolean;
  deviceChangeLimit: number;
  maxRedemptionAttempts: number;
  rateLimitWindowHours: number;
  fraudDetectionEnabled: boolean;
  suspiciousAttemptThreshold: number;
  blockSuspiciousIPs: boolean;
  autoBlockDuration: number;
}

interface SecurityConfigurationProps {
  onConfigUpdate?: () => void;
}

export function SecurityConfiguration({ onConfigUpdate }: SecurityConfigurationProps) {
  const [config, setConfig] = useState<SecurityConfig>({
    deviceLockingEnabled: false,
    ipLockingEnabled: false,
    allowDeviceChange: true,
    deviceChangeLimit: 3,
    maxRedemptionAttempts: 10,
    rateLimitWindowHours: 1,
    fraudDetectionEnabled: true,
    suspiciousAttemptThreshold: 5,
    blockSuspiciousIPs: true,
    autoBlockDuration: 24,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/security/configuration');
      if (!response.ok) {
        throw new Error('Failed to fetch configuration');
      }
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Failed to fetch security configuration:', error);
      toast.error('Failed to load security configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/security/configuration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save configuration');
      }

      const updatedConfig = await response.json();
      setConfig(updatedConfig);
      toast.success('Security configuration saved successfully');
      onConfigUpdate?.();
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const updateConfig = (key: keyof SecurityConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCcw className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Configuration</CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure advanced security features for code redemption
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Device & IP Locking */}
        <div className="space-y-4">
          <h4 className="font-semibold">Device & IP Locking</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Device Locking</Label>
              <p className="text-xs text-muted-foreground">
                Lock codes to specific devices after first redemption
              </p>
            </div>
            <Switch
              checked={config.deviceLockingEnabled}
              onCheckedChange={(checked) => updateConfig('deviceLockingEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>IP Address Locking</Label>
              <p className="text-xs text-muted-foreground">
                Lock codes to specific IP addresses after first redemption
              </p>
            </div>
            <Switch
              checked={config.ipLockingEnabled}
              onCheckedChange={(checked) => updateConfig('ipLockingEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Device Change</Label>
              <p className="text-xs text-muted-foreground">
                Allow users to change locked device (with limits)
              </p>
            </div>
            <Switch
              checked={config.allowDeviceChange}
              onCheckedChange={(checked) => updateConfig('allowDeviceChange', checked)}
              disabled={!config.deviceLockingEnabled}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deviceChangeLimit">Device Change Limit</Label>
              <Input
                id="deviceChangeLimit"
                type="number"
                min="1"
                max="10"
                value={config.deviceChangeLimit}
                onChange={(e) => updateConfig('deviceChangeLimit', parseInt(e.target.value) || 3)}
                disabled={!config.deviceLockingEnabled || !config.allowDeviceChange}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Rate Limiting */}
        <div className="space-y-4">
          <h4 className="font-semibold">Rate Limiting</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxRedemptionAttempts">Max Attempts per Window</Label>
              <Input
                id="maxRedemptionAttempts"
                type="number"
                min="1"
                max="50"
                value={config.maxRedemptionAttempts}
                onChange={(e) => updateConfig('maxRedemptionAttempts', parseInt(e.target.value) || 10)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum redemption attempts per time window
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rateLimitWindowHours">Time Window (Hours)</Label>
              <Input
                id="rateLimitWindowHours"
                type="number"
                min="1"
                max="24"
                value={config.rateLimitWindowHours}
                onChange={(e) => updateConfig('rateLimitWindowHours', parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                Time window for rate limiting in hours
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Fraud Detection */}
        <div className="space-y-4">
          <h4 className="font-semibold">Fraud Detection</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Fraud Detection</Label>
              <p className="text-xs text-muted-foreground">
                Automatically detect and flag suspicious activity
              </p>
            </div>
            <Switch
              checked={config.fraudDetectionEnabled}
              onCheckedChange={(checked) => updateConfig('fraudDetectionEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Block Suspicious IPs</Label>
              <p className="text-xs text-muted-foreground">
                Automatically block IPs flagged for suspicious activity
              </p>
            </div>
            <Switch
              checked={config.blockSuspiciousIPs}
              onCheckedChange={(checked) => updateConfig('blockSuspiciousIPs', checked)}
              disabled={!config.fraudDetectionEnabled}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="suspiciousAttemptThreshold">Suspicious Attempt Threshold</Label>
              <Input
                id="suspiciousAttemptThreshold"
                type="number"
                min="1"
                max="20"
                value={config.suspiciousAttemptThreshold}
                onChange={(e) => updateConfig('suspiciousAttemptThreshold', parseInt(e.target.value) || 5)}
                disabled={!config.fraudDetectionEnabled}
              />
              <p className="text-xs text-muted-foreground">
                Failed attempts before flagging as suspicious
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="autoBlockDuration">Auto-Block Duration (Hours)</Label>
              <Input
                id="autoBlockDuration"
                type="number"
                min="1"
                max="168"
                value={config.autoBlockDuration}
                onChange={(e) => updateConfig('autoBlockDuration', parseInt(e.target.value) || 24)}
                disabled={!config.fraudDetectionEnabled || !config.blockSuspiciousIPs}
              />
              <p className="text-xs text-muted-foreground">
                How long to automatically block suspicious IPs
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={saveConfig} 
            disabled={saving}
            className="min-w-[120px]"
          >
            {saving ? (
              <RefreshCcw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
