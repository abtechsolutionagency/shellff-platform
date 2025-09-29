
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Users, Package, Sparkles, Info } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Release {
  id: string;
  title: string;
  coverArt: string | null;
  basePrice: string;
}

interface PackType {
  value: string;
  label: string;
  description: string;
  maxMembers: number;
  icon: string;
}

interface PricingCalculation {
  originalPrice: string;
  discountedPrice: string;
  discountAmount: string;
  discountPercentage: number;
  savings: string;
}

interface AppliedDiscount {
  id: string;
  name: string;
  discountType: string;
  discountValue: string;
}

interface GroupCodePackCreatorProps {
  releaseId: string;
  onPackCreated?: (packId: string) => void;
}

const GroupCodePackCreator: React.FC<GroupCodePackCreatorProps> = ({
  releaseId,
  onPackCreated
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(false);
  
  // Form data
  const [packName, setPackName] = useState('');
  const [packDescription, setPackDescription] = useState('');
  const [packType, setPackType] = useState('family');
  const [maxMembers, setMaxMembers] = useState(5);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>();
  
  // Pricing data
  const [release, setRelease] = useState<Release | null>(null);
  const [availablePackTypes, setAvailablePackTypes] = useState<PackType[]>([]);
  const [pricingCalculation, setPricingCalculation] = useState<PricingCalculation | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);

  // Load pricing information when pack type or max members change
  useEffect(() => {
    if (releaseId && packType && maxMembers > 0) {
      loadPricing();
    }
  }, [releaseId, packType, maxMembers]);

  const loadPricing = async () => {
    try {
      setPricingLoading(true);
      const response = await fetch(
        `/api/creator/group-packs/pricing?releaseId=${releaseId}&packType=${packType}&memberCount=${maxMembers}`
      );

      if (!response.ok) {
        throw new Error('Failed to load pricing');
      }

      const result = await response.json();
      if (result.success) {
        setRelease(result.data.release);
        setAvailablePackTypes(result.data.availablePackTypes);
        setPricingCalculation(result.data.pricing);
        setAppliedDiscount(result.data.appliedDiscount);
        
        // Auto-generate pack name if empty
        if (!packName && result.data.release.title) {
          const selectedPackType = result.data.availablePackTypes.find(
            (pt: PackType) => pt.value === packType
          );
          setPackName(`${selectedPackType?.label || 'Group'} - ${result.data.release.title}`);
        }
      }
    } catch (error) {
      console.error('Failed to load pricing:', error);
      toast.error('Failed to load pricing information');
    } finally {
      setPricingLoading(false);
    }
  };

  const handlePackTypeChange = (newPackType: string) => {
    setPackType(newPackType);
    const selectedType = availablePackTypes.find(pt => pt.value === newPackType);
    if (selectedType) {
      setMaxMembers(selectedType.maxMembers);
    }
  };

  const handleCreatePack = async () => {
    if (!packName.trim()) {
      toast.error('Pack name is required');
      return;
    }

    if (maxMembers < 2) {
      toast.error('Pack must allow at least 2 members');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/creator/group-packs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          releaseId,
          packName,
          packDescription,
          packType,
          maxMembers,
          expiresAt: expiresAt?.toISOString()
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Group pack created successfully!');
        onPackCreated?.(result.data.groupPack.id);
        
        // Reset form
        setPackName('');
        setPackDescription('');
        setExpiresAt(undefined);
      } else {
        toast.error(result.error || 'Failed to create group pack');
      }
    } catch (error) {
      console.error('Failed to create group pack:', error);
      toast.error('Failed to create group pack');
    } finally {
      setLoading(false);
    }
  };

  const selectedPackType = availablePackTypes.find(pt => pt.value === packType);

  return (
    <div className="space-y-6">
      {/* Release Information */}
      {release && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Release Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {release.coverArt && (
                <img 
                  src={release.coverArt} 
                  alt={release.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div>
                <h3 className="font-semibold text-lg">{release.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Base Price: {release.basePrice} SHC per member
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pack Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pack Configuration
          </CardTitle>
          <CardDescription>
            Configure your group pack settings and member limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pack Name */}
          <div className="space-y-2">
            <Label htmlFor="packName">Pack Name *</Label>
            <Input
              id="packName"
              value={packName}
              onChange={(e) => setPackName(e.target.value)}
              placeholder="e.g., Family Pack - My Album"
              required
            />
          </div>

          {/* Pack Description */}
          <div className="space-y-2">
            <Label htmlFor="packDescription">Description (Optional)</Label>
            <Textarea
              id="packDescription"
              value={packDescription}
              onChange={(e) => setPackDescription(e.target.value)}
              placeholder="Describe who this pack is for..."
              rows={3}
            />
          </div>

          {/* Pack Type */}
          <div className="space-y-2">
            <Label>Pack Type</Label>
            <Select value={packType} onValueChange={handlePackTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availablePackTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">
                          Up to {type.maxMembers} members
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPackType && (
              <p className="text-sm text-muted-foreground">
                {selectedPackType.description}
              </p>
            )}
          </div>

          {/* Max Members */}
          <div className="space-y-2">
            <Label htmlFor="maxMembers">Maximum Members</Label>
            <Input
              id="maxMembers"
              type="number"
              value={maxMembers}
              onChange={(e) => setMaxMembers(parseInt(e.target.value) || 1)}
              min={2}
              max={selectedPackType?.maxMembers || 100}
            />
            <p className="text-xs text-muted-foreground">
              Includes yourself as the pack owner
            </p>
          </div>

          {/* Expiration Date (Optional) */}
          <div className="space-y-2">
            <Label>Expiration Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expiresAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiresAt ? format(expiresAt, "PPP") : "No expiration"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expiresAt}
                  onSelect={setExpiresAt}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Summary */}
      {pricingCalculation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Pricing Summary
            </CardTitle>
            <CardDescription>
              Total cost for {maxMembers} members
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pricingLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Calculating pricing...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Original Price:</span>
                  <span className="line-through text-muted-foreground">
                    {pricingCalculation.originalPrice} SHC
                  </span>
                </div>
                
                {appliedDiscount && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Discount Applied:</span>
                      <Badge variant="secondary" className="text-xs">
                        {appliedDiscount.name}
                      </Badge>
                    </div>
                    <span className="text-green-600 font-medium">
                      -{pricingCalculation.savings} SHC ({pricingCalculation.discountPercentage}% off)
                    </span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Price:</span>
                  <span className="text-primary">
                    {pricingCalculation.discountedPrice} SHC
                  </span>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-muted-foreground">
                      <p>Each member will get individual access to your release.</p>
                      <p>You'll be automatically added as the pack owner.</p>
                      {appliedDiscount && (
                        <p className="text-green-600 font-medium mt-1">
                          You're saving {pricingCalculation.savings} SHC with the {appliedDiscount.name}!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Button */}
      <div className="flex gap-4">
        <Button
          onClick={handleCreatePack}
          disabled={loading || pricingLoading || !packName.trim()}
          className="flex-1"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating Pack...
            </>
          ) : (
            <>
              <Package className="mr-2 h-4 w-4" />
              Create Group Pack
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default GroupCodePackCreator;
