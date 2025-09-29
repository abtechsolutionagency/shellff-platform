
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  Settings
} from 'lucide-react';

interface DiscountRule {
  id: string;
  name: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y' | 'TIERED';
  target: 'PAYMENT_METHOD' | 'PURCHASE_TYPE' | 'GLOBAL' | 'USER_TIER' | 'CREATOR_TIER';
  percentageDiscount?: number;
  fixedAmountDiscount?: number;
  buyQuantity?: number;
  getQuantity?: number;
  tierBreakpoints?: string;
  minOrderAmount?: number;
  maxOrderAmount?: number;
  minQuantity?: number;
  maxQuantity?: number;
  maxUsagePerUser?: number;
  maxTotalUsage?: number;
  currentTotalUsage: number;
  paymentMethodId?: string;
  purchaseTypes?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  isStackable: boolean;
  priority: number;
  createdAt: string;
  paymentMethod?: {
    name: string;
  };
}

interface PaymentMethod {
  id: string;
  name: string;
  provider: string;
  isEnabled: boolean;
}

interface DiscountStats {
  totalDiscounts: number;
  totalSavings: number;
  topDiscounts: Array<{
    discountRuleId: string;
    _count: number;
    _sum: { discountAmount: number };
  }>;
}

const DISCOUNT_TYPES = [
  { value: 'PERCENTAGE', label: 'Percentage Discount' },
  { value: 'FIXED_AMOUNT', label: 'Fixed Amount Discount' },
  { value: 'BUY_X_GET_Y', label: 'Buy X Get Y Free' },
  { value: 'TIERED', label: 'Tiered Discount' }
];

const DISCOUNT_TARGETS = [
  { value: 'PAYMENT_METHOD', label: 'Payment Method Specific' },
  { value: 'PURCHASE_TYPE', label: 'Purchase Type Specific' },
  { value: 'GLOBAL', label: 'Global Discount' },
  { value: 'USER_TIER', label: 'User Tier Specific' },
  { value: 'CREATOR_TIER', label: 'Creator Tier Specific' }
];

const PURCHASE_TYPES = [
  { value: 'UNLOCK_CODES', label: 'Unlock Codes' },
  { value: 'STREAMING_FEES', label: 'Streaming Fees' },
  { value: 'PREMIUM_SUBSCRIPTION', label: 'Premium Subscription' },
  { value: 'ARTIST_FEATURES', label: 'Artist Features' },
  { value: 'MARKETPLACE_TRANSACTION', label: 'Marketplace Transaction' },
  { value: 'ALL', label: 'All Purchase Types' }
];

export default function DiscountManagement() {
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [stats, setStats] = useState<DiscountStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<DiscountRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('rules');

  // Form state
  const [formData, setFormData] = useState<Partial<DiscountRule>>({
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    target: 'GLOBAL',
    percentageDiscount: 0,
    fixedAmountDiscount: 0,
    buyQuantity: 1,
    getQuantity: 1,
    tierBreakpoints: '[]',
    minOrderAmount: 0,
    maxOrderAmount: undefined,
    minQuantity: 1,
    maxQuantity: undefined,
    maxUsagePerUser: undefined,
    maxTotalUsage: undefined,
    purchaseTypes: '["ALL"]',
    isActive: true,
    isStackable: false,
    priority: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulesRes, methodsRes, statsRes] = await Promise.all([
        fetch('/api/admin/discount-rules'),
        fetch('/api/admin/payment-methods'),
        fetch('/api/admin/discount-stats')
      ]);

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setDiscountRules(rulesData);
      }

      if (methodsRes.ok) {
        const methodsData = await methodsRes.json();
        setPaymentMethods(methodsData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading discount data:', error);
      toast.error('Failed to load discount data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async () => {
    try {
      const method = selectedRule ? 'PUT' : 'POST';
      const url = selectedRule 
        ? `/api/admin/discount-rules/${selectedRule.id}` 
        : '/api/admin/discount-rules';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(`Discount rule ${selectedRule ? 'updated' : 'created'} successfully`);
        setIsDialogOpen(false);
        setSelectedRule(null);
        resetForm();
        await loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save discount rule');
      }
    } catch (error) {
      console.error('Error saving discount rule:', error);
      toast.error('Failed to save discount rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this discount rule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/discount-rules/${ruleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Discount rule deleted successfully');
        await loadData();
      } else {
        toast.error('Failed to delete discount rule');
      }
    } catch (error) {
      console.error('Error deleting discount rule:', error);
      toast.error('Failed to delete discount rule');
    }
  };

  const openEditDialog = (rule: DiscountRule) => {
    setSelectedRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      discountType: rule.discountType,
      target: rule.target,
      percentageDiscount: rule.percentageDiscount,
      fixedAmountDiscount: rule.fixedAmountDiscount,
      buyQuantity: rule.buyQuantity,
      getQuantity: rule.getQuantity,
      tierBreakpoints: rule.tierBreakpoints,
      minOrderAmount: rule.minOrderAmount,
      maxOrderAmount: rule.maxOrderAmount,
      minQuantity: rule.minQuantity,
      maxQuantity: rule.maxQuantity,
      maxUsagePerUser: rule.maxUsagePerUser,
      maxTotalUsage: rule.maxTotalUsage,
      paymentMethodId: rule.paymentMethodId,
      purchaseTypes: rule.purchaseTypes,
      startDate: rule.startDate,
      endDate: rule.endDate,
      isActive: rule.isActive,
      isStackable: rule.isStackable,
      priority: rule.priority
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discountType: 'PERCENTAGE',
      target: 'GLOBAL',
      percentageDiscount: 0,
      fixedAmountDiscount: 0,
      buyQuantity: 1,
      getQuantity: 1,
      tierBreakpoints: '[]',
      minOrderAmount: 0,
      maxOrderAmount: undefined,
      minQuantity: 1,
      maxQuantity: undefined,
      maxUsagePerUser: undefined,
      maxTotalUsage: undefined,
      purchaseTypes: '["ALL"]',
      isActive: true,
      isStackable: false,
      priority: 0
    });
  };

  const renderDiscountValue = (rule: DiscountRule) => {
    switch (rule.discountType) {
      case 'PERCENTAGE':
        return `${(rule.percentageDiscount || 0) * 100}%`;
      case 'FIXED_AMOUNT':
        return `$${rule.fixedAmountDiscount || 0}`;
      case 'BUY_X_GET_Y':
        return `Buy ${rule.buyQuantity || 0}, Get ${rule.getQuantity || 0} Free`;
      case 'TIERED':
        return 'Tiered Pricing';
      default:
        return 'N/A';
    }
  };

  const renderFormFields = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter discount rule name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter discount description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="discountType">Discount Type</Label>
            <Select
              value={formData.discountType}
              onValueChange={(value) => setFormData({ ...formData, discountType: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select discount type" />
              </SelectTrigger>
              <SelectContent>
                {DISCOUNT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">Target</Label>
            <Select
              value={formData.target}
              onValueChange={(value) => setFormData({ ...formData, target: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target" />
              </SelectTrigger>
              <SelectContent>
                {DISCOUNT_TARGETS.map(target => (
                  <SelectItem key={target.value} value={target.value}>
                    {target.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Discount Value Fields */}
        {formData.discountType === 'PERCENTAGE' && (
          <div className="space-y-2">
            <Label htmlFor="percentageDiscount">Percentage Discount (0-1)</Label>
            <Input
              id="percentageDiscount"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={formData.percentageDiscount}
              onChange={(e) => setFormData({ ...formData, percentageDiscount: parseFloat(e.target.value) })}
              placeholder="0.10 for 10%"
            />
          </div>
        )}

        {formData.discountType === 'FIXED_AMOUNT' && (
          <div className="space-y-2">
            <Label htmlFor="fixedAmountDiscount">Fixed Amount Discount ($)</Label>
            <Input
              id="fixedAmountDiscount"
              type="number"
              step="0.01"
              min="0"
              value={formData.fixedAmountDiscount}
              onChange={(e) => setFormData({ ...formData, fixedAmountDiscount: parseFloat(e.target.value) })}
              placeholder="10.00"
            />
          </div>
        )}

        {formData.discountType === 'BUY_X_GET_Y' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buyQuantity">Buy Quantity</Label>
              <Input
                id="buyQuantity"
                type="number"
                min="1"
                value={formData.buyQuantity}
                onChange={(e) => setFormData({ ...formData, buyQuantity: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="getQuantity">Get Quantity (Free)</Label>
              <Input
                id="getQuantity"
                type="number"
                min="1"
                value={formData.getQuantity}
                onChange={(e) => setFormData({ ...formData, getQuantity: parseInt(e.target.value) })}
              />
            </div>
          </div>
        )}

        {formData.discountType === 'TIERED' && (
          <div className="space-y-2">
            <Label htmlFor="tierBreakpoints">Tier Breakpoints (JSON)</Label>
            <Textarea
              id="tierBreakpoints"
              value={formData.tierBreakpoints}
              onChange={(e) => setFormData({ ...formData, tierBreakpoints: e.target.value })}
              placeholder='[{"min": 10, "discount": 0.05}, {"min": 50, "discount": 0.10}]'
              rows={3}
            />
          </div>
        )}

        {/* Payment Method Selection */}
        {formData.target === 'PAYMENT_METHOD' && (
          <div className="space-y-2">
            <Label htmlFor="paymentMethodId">Payment Method</Label>
            <Select
              value={formData.paymentMethodId}
              onValueChange={(value) => setFormData({ ...formData, paymentMethodId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(method => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Constraints */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minOrderAmount">Min Order Amount ($)</Label>
            <Input
              id="minOrderAmount"
              type="number"
              step="0.01"
              min="0"
              value={formData.minOrderAmount}
              onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxOrderAmount">Max Order Amount ($)</Label>
            <Input
              id="maxOrderAmount"
              type="number"
              step="0.01"
              min="0"
              value={formData.maxOrderAmount || ''}
              onChange={(e) => setFormData({ ...formData, maxOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minQuantity">Min Quantity</Label>
            <Input
              id="minQuantity"
              type="number"
              min="1"
              value={formData.minQuantity}
              onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxQuantity">Max Quantity</Label>
            <Input
              id="maxQuantity"
              type="number"
              min="1"
              value={formData.maxQuantity || ''}
              onChange={(e) => setFormData({ ...formData, maxQuantity: e.target.value ? parseInt(e.target.value) : undefined })}
            />
          </div>
        </div>

        {/* Usage Limits */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxUsagePerUser">Max Usage Per User</Label>
            <Input
              id="maxUsagePerUser"
              type="number"
              min="1"
              value={formData.maxUsagePerUser || ''}
              onChange={(e) => setFormData({ ...formData, maxUsagePerUser: e.target.value ? parseInt(e.target.value) : undefined })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxTotalUsage">Max Total Usage</Label>
            <Input
              id="maxTotalUsage"
              type="number"
              min="1"
              value={formData.maxTotalUsage || ''}
              onChange={(e) => setFormData({ ...formData, maxTotalUsage: e.target.value ? parseInt(e.target.value) : undefined })}
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
        </div>

        {/* Switches */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isStackable"
              checked={formData.isStackable}
              onCheckedChange={(checked) => setFormData({ ...formData, isStackable: checked })}
            />
            <Label htmlFor="isStackable">Stackable</Label>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading discount management...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Discount Management</h2>
          <p className="text-muted-foreground">
            Manage discount rules for payment methods and purchase types
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setSelectedRule(null);
                resetForm();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Discount Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedRule ? 'Edit Discount Rule' : 'Create Discount Rule'}
              </DialogTitle>
              <DialogDescription>
                Configure discount parameters and targeting options.
              </DialogDescription>
            </DialogHeader>
            
            {renderFormFields()}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRule}>
                {selectedRule ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">Discount Rules</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Discounts Used</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDiscounts}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.totalSavings}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {discountRules.filter(rule => rule.isActive).length}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Discount Rules</CardTitle>
              <CardDescription>
                Manage all discount rules and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {discountRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{rule.name}</h3>
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {rule.isStackable && (
                          <Badge variant="outline">Stackable</Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{rule.description}</p>
                        <div className="flex items-center gap-4">
                          <span>Type: {rule.discountType.replace('_', ' ')}</span>
                          <span>Value: {renderDiscountValue(rule)}</span>
                          <span>Target: {rule.target.replace('_', ' ')}</span>
                          <span>Priority: {rule.priority}</span>
                          <span>Used: {rule.currentTotalUsage}/{rule.maxTotalUsage || '∞'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {discountRules.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No discount rules configured yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Discount Statistics</CardTitle>
              <CardDescription>
                Performance metrics for discount rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Overall Performance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Discounts Applied:</span>
                          <span className="font-medium">{stats.totalDiscounts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Customer Savings:</span>
                          <span className="font-medium">${stats.totalSavings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Rules:</span>
                          <span className="font-medium">
                            {discountRules.filter(rule => rule.isActive).length}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Top Performing Rules</h4>
                      <div className="space-y-2">
                        {stats.topDiscounts.slice(0, 5).map((discount, index) => {
                          const rule = discountRules.find(r => r.id === discount.discountRuleId);
                          return (
                            <div key={discount.discountRuleId} className="flex justify-between text-sm">
                              <span className="truncate">
                                {index + 1}. {rule?.name || 'Unknown Rule'}
                              </span>
                              <span>{discount._count} uses</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No statistics available yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Discount System Settings</CardTitle>
              <CardDescription>
                Configure global discount system behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="globalEnabled" className="text-base">
                      Enable Global Discount System
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Turn on/off the entire discount system
                    </p>
                  </div>
                  <Switch id="globalEnabled" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxStackable">Max Stackable Discounts</Label>
                  <Input
                    id="maxStackable"
                    type="number"
                    min="1"
                    max="10"
                    defaultValue="3"
                    className="max-w-xs"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Discount Calculation Order</Label>
                  <Select defaultValue="priority">
                    <SelectTrigger className="max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priority">By Priority</SelectItem>
                      <SelectItem value="amount">By Amount (Highest First)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoBest" className="text-base">
                      Auto-Apply Best Discount
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically apply the best available discount for users
                    </p>
                  </div>
                  <Switch id="autoBest" defaultChecked />
                </div>
              </div>
              
              <div className="mt-6">
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
