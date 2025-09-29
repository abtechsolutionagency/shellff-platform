
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  CalendarIcon, 
  Percent, 
  DollarSign,
  Users,
  Filter,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface GroupDiscount {
  id: string;
  name: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: string;
  minMembers: number;
  maxMembers: number | null;
  packType: string | null;
  isActive: boolean;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

const GroupDiscountManager: React.FC = () => {
  const [discounts, setDiscounts] = useState<GroupDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [filterPackType, setFilterPackType] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    discountType: 'percentage' as 'percentage' | 'fixed_amount',
    discountValue: '',
    minMembers: 2,
    maxMembers: '',
    packType: '',
    validFrom: new Date(),
    validUntil: undefined as Date | undefined
  });
  const [formLoading, setFormLoading] = useState(false);

  const loadDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filterActive !== 'all') {
        params.append('isActive', filterActive);
      }
      if (filterPackType !== 'all') {
        params.append('packType', filterPackType);
      }

      const response = await fetch(`/api/admin/group-discounts/list?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setDiscounts(result.data.discounts);
      } else {
        setDiscounts([]);
        toast.error(result.error || 'Failed to load group discounts');
      }
    } catch (error) {
      console.error('Failed to load discounts:', error);
      toast.error('Failed to load group discounts');
    } finally {
      setLoading(false);
    }
  }, [filterActive, filterPackType]);

  useEffect(() => {
    void loadDiscounts();
  }, [loadDiscounts]);

  const handleCreateDiscount = async () => {
    if (!formData.name.trim() || !formData.discountValue) {
      toast.error('Name and discount value are required');
      return;
    }

    try {
      setFormLoading(true);
      const response = await fetch('/api/admin/group-discounts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue),
          minMembers: formData.minMembers,
          maxMembers: formData.maxMembers ? parseInt(formData.maxMembers) : null,
          packType: formData.packType || null,
          validFrom: formData.validFrom.toISOString(),
          validUntil: formData.validUntil?.toISOString() || null
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Group discount created successfully!');
        setIsCreateDialogOpen(false);
        resetForm();
        await loadDiscounts();
      } else {
        toast.error(result.error || 'Failed to create discount');
      }
    } catch (error) {
      console.error('Failed to create discount:', error);
      toast.error('Failed to create group discount');
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      discountType: 'percentage',
      discountValue: '',
      minMembers: 2,
      maxMembers: '',
      packType: '',
      validFrom: new Date(),
      validUntil: undefined
    });
  };

  const filteredDiscounts = discounts.filter(discount =>
    discount.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPackTypeLabel = (packType: string | null) => {
    if (!packType) return 'All Pack Types';
    const labels = {
      family: 'Family Pack',
      friends: 'Friends Pack',
      bulk: 'Bulk Pack',
      corporate: 'Corporate Pack'
    };
    return labels[packType as keyof typeof labels] || packType;
  };

  const getDiscountDisplay = (discount: GroupDiscount) => {
    if (discount.discountType === 'percentage') {
      return `${discount.discountValue}%`;
    } else {
      return `$${discount.discountValue}`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Group Discounts</h2>
          <p className="text-muted-foreground">
            Manage volume discounts for group code packs
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Discount
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Group Discount</DialogTitle>
              <DialogDescription>
                Set up a new volume discount for group code packs
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Discount Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Family Pack 20% Off"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select 
                    value={formData.discountType} 
                    onValueChange={(value: 'percentage' | 'fixed_amount') => 
                      setFormData({ ...formData, discountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">
                        <div className="flex items-center">
                          <Percent className="h-4 w-4 mr-2" />
                          Percentage
                        </div>
                      </SelectItem>
                      <SelectItem value="fixed_amount">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Fixed Amount
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    Value {formData.discountType === 'percentage' ? '(%)' : '($)'}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder={formData.discountType === 'percentage' ? '20' : '10.00'}
                    min="0"
                    max={formData.discountType === 'percentage' ? "100" : undefined}
                    step={formData.discountType === 'percentage' ? "1" : "0.01"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minMembers">Min Members</Label>
                  <Input
                    id="minMembers"
                    type="number"
                    value={formData.minMembers}
                    onChange={(e) => setFormData({ ...formData, minMembers: parseInt(e.target.value) || 2 })}
                    min="2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxMembers">Max Members (Optional)</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    value={formData.maxMembers}
                    onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pack Type (Optional)</Label>
                <Select 
                  value={formData.packType} 
                  onValueChange={(value) => setFormData({ ...formData, packType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All pack types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Pack Types</SelectItem>
                    <SelectItem value="family">Family Pack</SelectItem>
                    <SelectItem value="friends">Friends Pack</SelectItem>
                    <SelectItem value="bulk">Bulk Pack</SelectItem>
                    <SelectItem value="corporate">Corporate Pack</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valid From</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.validFrom, "MMM d, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.validFrom}
                        onSelect={(date) => date && setFormData({ ...formData, validFrom: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Valid Until (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.validUntil && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.validUntil ? format(formData.validUntil, "MMM d, yyyy") : "No expiration"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.validUntil}
                        onSelect={(date) => setFormData({ ...formData, validUntil: date })}
                        disabled={(date) => date < formData.validFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDiscount} disabled={formLoading}>
                {formLoading ? 'Creating...' : 'Create Discount'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search discounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterActive} onValueChange={setFilterActive}>
            <SelectTrigger className="w-[120px]">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPackType} onValueChange={setFilterPackType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="family">Family</SelectItem>
              <SelectItem value="friends">Friends</SelectItem>
              <SelectItem value="bulk">Bulk</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Discounts List */}
      <div className="space-y-4">
        {filteredDiscounts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Percent className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Group Discounts Found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first group discount to encourage bulk purchases.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Discount
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredDiscounts.map((discount) => (
            <Card key={discount.id} className={cn(
              "transition-all duration-200 hover:shadow-md",
              !discount.isActive && "opacity-60"
            )}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{discount.name}</CardTitle>
                      <Badge variant={discount.isActive ? "default" : "secondary"}>
                        {discount.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {discount.discountType === 'percentage' ? (
                        <Badge variant="outline">
                          <Percent className="h-3 w-3 mr-1" />
                          {getDiscountDisplay(discount)}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {getDiscountDisplay(discount)}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {getPackTypeLabel(discount.packType)} • {discount.minMembers}
                      {discount.maxMembers ? `-${discount.maxMembers}` : '+'} members
                    </CardDescription>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Valid From</p>
                    <p className="font-medium">
                      {format(new Date(discount.validFrom), 'MMM d, yyyy')}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Valid Until</p>
                    <p className="font-medium">
                      {discount.validUntil 
                        ? format(new Date(discount.validUntil), 'MMM d, yyyy')
                        : 'No expiration'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Pack Type</p>
                    <p className="font-medium">{getPackTypeLabel(discount.packType)}</p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Member Range</p>
                    <p className="font-medium">
                      <Users className="h-4 w-4 inline mr-1" />
                      {discount.minMembers}{discount.maxMembers ? `-${discount.maxMembers}` : '+'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default GroupDiscountManager;









