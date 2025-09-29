
import { Decimal } from '@prisma/client/runtime/library';

export interface GroupPackPricingTier {
  id: string;
  name: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: Decimal;
  minMembers: number;
  maxMembers: number | null;
  packType: string | null;
  isActive: boolean;
}

export interface PackPricingCalculation {
  originalPrice: Decimal;
  discountedPrice: Decimal;
  discountAmount: Decimal;
  discountPercentage: number;
  appliedDiscount?: GroupPackPricingTier;
  savings: Decimal;
}

/**
 * Calculate group pack pricing with applicable discounts
 */
export function calculateGroupPackPricing(
  basePrice: Decimal,
  memberCount: number,
  packType: string,
  availableDiscounts: GroupPackPricingTier[]
): PackPricingCalculation {
  // Find applicable discounts for this pack configuration
  const applicableDiscounts = availableDiscounts.filter(discount => 
    discount.isActive &&
    memberCount >= discount.minMembers &&
    (discount.maxMembers === null || memberCount <= discount.maxMembers!) &&
    (discount.packType === null || discount.packType === packType)
  );

  // Sort by discount value (highest first) to get best discount
  const bestDiscount = applicableDiscounts.sort((a, b) => {
    if (a.discountType === 'percentage' && b.discountType === 'percentage') {
      return Number(b.discountValue) - Number(a.discountValue);
    } else if (a.discountType === 'fixed_amount' && b.discountType === 'fixed_amount') {
      return Number(b.discountValue) - Number(a.discountValue);
    }
    // Prefer percentage discounts for comparison
    return a.discountType === 'percentage' ? -1 : 1;
  })[0];

  const originalPrice = new Decimal(basePrice).mul(memberCount);
  let discountedPrice = originalPrice;
  let discountAmount = new Decimal(0);

  if (bestDiscount) {
    if (bestDiscount.discountType === 'percentage') {
      const discountPercent = Number(bestDiscount.discountValue) / 100;
      discountAmount = originalPrice.mul(discountPercent);
      discountedPrice = originalPrice.sub(discountAmount);
    } else {
      discountAmount = new Decimal(bestDiscount.discountValue);
      discountedPrice = originalPrice.sub(discountAmount);
      
      // Ensure price doesn't go negative
      if (discountedPrice.lt(0)) {
        discountedPrice = new Decimal(0);
        discountAmount = originalPrice;
      }
    }
  }

  const discountPercentage = originalPrice.gt(0) 
    ? Number(discountAmount.div(originalPrice).mul(100))
    : 0;

  return {
    originalPrice,
    discountedPrice,
    discountAmount,
    discountPercentage: Math.round(discountPercentage * 100) / 100,
    appliedDiscount: bestDiscount,
    savings: discountAmount
  };
}

/**
 * Get default group pack types with their configurations
 */
export function getDefaultPackTypes() {
  return [
    {
      value: 'family',
      label: 'Family Pack',
      description: 'Perfect for families sharing music',
      maxMembers: 6,
      icon: '👨‍👩‍👧‍👦'
    },
    {
      value: 'friends',
      label: 'Friends Pack', 
      description: 'Share with your close friends',
      maxMembers: 10,
      icon: '👥'
    },
    {
      value: 'bulk',
      label: 'Bulk Pack',
      description: 'Large quantity purchases',
      maxMembers: 50,
      icon: '📦'
    },
    {
      value: 'corporate',
      label: 'Corporate Pack',
      description: 'For businesses and organizations',
      maxMembers: 100,
      icon: '🏢'
    }
  ];
}

/**
 * Generate a unique invite code for pack members
 */
export function generatePackInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters
  const segments = [];
  
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return `GP-${segments.join('-')}`;
}

/**
 * Validate pack member limits
 */
export function validatePackMemberCount(
  currentMembers: number,
  maxMembers: number,
  newMembersToAdd: number = 1
): { valid: boolean; message?: string } {
  if (currentMembers + newMembersToAdd > maxMembers) {
    return {
      valid: false,
      message: `Cannot add ${newMembersToAdd} member(s). Pack is limited to ${maxMembers} members maximum.`
    };
  }
  
  return { valid: true };
}
