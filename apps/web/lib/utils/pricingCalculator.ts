
/**
 * Pricing Calculator for Physical Album Unlock Codes
 * Handles tiered pricing, discount calculations, and cost computations
 */

import { DiscountEngine } from '@/lib/discount-engine';
import { PurchaseType } from '@prisma/client';

export interface PricingTier {
  id: string;
  minQuantity: number;
  maxQuantity: number | null;
  pricePerCode: number;
  currency: string;
  isActive: boolean;
}

export interface PricingCalculation {
  quantity: number;
  totalCost: number;
  pricePerCode: number;
  tier: PricingTier;
  savings: number;
  breakdown: PricingBreakdown[];
  // Discount information
  originalAmount?: number;
  discountAmount?: number;
  finalAmount?: number;
  applicableDiscounts?: Array<{
    ruleName: string;
    discountType: string;
    discountAmount: number;
  }>;
}

export interface PricingBreakdown {
  tierName: string;
  quantity: number;
  pricePerCode: number;
  subtotal: number;
}

export class PricingCalculator {
  private static readonly DEFAULT_TIERS: PricingTier[] = [
    {
      id: 'tier_1',
      minQuantity: 1,
      maxQuantity: 999,
      pricePerCode: 50,
      currency: 'USD',
      isActive: true
    },
    {
      id: 'tier_2', 
      minQuantity: 1000,
      maxQuantity: 4999,
      pricePerCode: 30,
      currency: 'USD',
      isActive: true
    },
    {
      id: 'tier_3',
      minQuantity: 5000,
      maxQuantity: null,
      pricePerCode: 20,
      currency: 'USD',
      isActive: true
    }
  ];

  /**
   * Calculate pricing for a given quantity with discount integration
   */
  static async calculatePricingWithDiscounts(
    quantity: number, 
    userId: string,
    paymentMethodId?: string,
    customTiers?: PricingTier[]
  ): Promise<PricingCalculation> {
    // Get base pricing first
    const basePricing = this.calculatePricing(quantity, customTiers);
    
    try {
      // Calculate applicable discounts
      const discountResult = await DiscountEngine.calculateDiscounts({
        userId,
        purchaseType: PurchaseType.UNLOCK_CODES,
        amount: basePricing.totalCost,
        quantity,
        paymentMethodId
      });

      return {
        ...basePricing,
        originalAmount: discountResult.originalAmount,
        discountAmount: discountResult.totalDiscount,
        finalAmount: discountResult.finalAmount,
        totalCost: discountResult.finalAmount, // Update total cost with discounts
        applicableDiscounts: discountResult.discountBreakdown.map(discount => ({
          ruleName: discount.ruleName,
          discountType: discount.discountType,
          discountAmount: discount.discountAmount
        }))
      };
    } catch (error) {
      console.error('Error calculating discounts:', error);
      // Return base pricing without discounts if discount calculation fails
      return basePricing;
    }
  }

  /**
   * Calculate basic pricing for a given quantity (without discounts)
   */
  static calculatePricing(quantity: number, customTiers?: PricingTier[]): PricingCalculation {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const tiers = customTiers || this.DEFAULT_TIERS;
    const activeTiers = tiers.filter(t => t.isActive).sort((a, b) => a.minQuantity - b.minQuantity);
    
    if (activeTiers.length === 0) {
      throw new Error('No active pricing tiers available');
    }

    // For simplicity, we'll use the highest applicable tier
    const applicableTier = this.findApplicableTier(quantity, activeTiers);
    
    if (!applicableTier) {
      throw new Error(`No pricing tier found for quantity: ${quantity}`);
    }

    const totalCost = quantity * applicableTier.pricePerCode;
    
    // Calculate savings compared to the highest price tier
    const highestPriceTier = activeTiers[0]; // First tier has highest price
    const savingsAmount = quantity * (highestPriceTier.pricePerCode - applicableTier.pricePerCode);

    return {
      quantity,
      totalCost,
      pricePerCode: applicableTier.pricePerCode,
      tier: applicableTier,
      savings: savingsAmount,
      breakdown: this.calculateBreakdown(quantity, activeTiers)
    };
  }

  /**
   * Find the applicable tier for a given quantity
   */
  private static findApplicableTier(quantity: number, tiers: PricingTier[]): PricingTier | null {
    for (const tier of tiers.reverse()) { // Start from the lowest price tier
      if (quantity >= tier.minQuantity && (tier.maxQuantity === null || quantity <= tier.maxQuantity)) {
        return tier;
      }
    }
    return null;
  }

  /**
   * Calculate detailed breakdown across multiple tiers (if applicable)
   */
  private static calculateBreakdown(quantity: number, tiers: PricingTier[]): PricingBreakdown[] {
    const breakdown: PricingBreakdown[] = [];

    // For now, we use single-tier pricing. This can be extended to support
    // multi-tier pricing where different quantities use different price tiers
    const applicableTier = this.findApplicableTier(quantity, tiers);
    
    if (applicableTier) {
      breakdown.push({
        tierName: this.getTierName(applicableTier),
        quantity: quantity,
        pricePerCode: applicableTier.pricePerCode,
        subtotal: quantity * applicableTier.pricePerCode
      });
    }

    return breakdown;
  }

  /**
   * Get user-friendly tier name
   */
  private static getTierName(tier: PricingTier): string {
    if (tier.maxQuantity === null) {
      return `${tier.minQuantity.toLocaleString()}+ codes`;
    }
    return `${tier.minQuantity.toLocaleString()}-${tier.maxQuantity.toLocaleString()} codes`;
  }

  /**
   * Get all available tiers from database
   */
  static async getActiveTiers(): Promise<PricingTier[]> {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const dbTiers = await prisma.codePricingTier.findMany({
        where: { isActive: true },
        orderBy: { minQuantity: 'asc' }
      });
      
      await prisma.$disconnect();
      
      if (dbTiers.length === 0) {
        return this.DEFAULT_TIERS;
      }
      
      return dbTiers.map(tier => ({
        id: tier.id,
        minQuantity: tier.minQuantity,
        maxQuantity: tier.maxQuantity,
        pricePerCode: Number(tier.pricePerCode),
        currency: tier.currency,
        isActive: tier.isActive
      }));
    } catch (error) {
      console.error('Error fetching pricing tiers:', error);
      return this.DEFAULT_TIERS;
    }
  }

  /**
   * Get pricing summary for display
   */
  static getPricingSummary(calculation: PricingCalculation): {
    displayText: string;
    savingsText: string;
    costPerCode: string;
    totalCost: string;
  } {
    return {
      displayText: `${calculation.quantity.toLocaleString()} codes at $${calculation.pricePerCode} each`,
      savingsText: calculation.savings > 0 ? `Save $${calculation.savings.toLocaleString()}` : '',
      costPerCode: `$${calculation.pricePerCode}`,
      totalCost: `$${calculation.totalCost.toLocaleString()}`
    };
  }

  /**
   * Validate quantity input
   */
  static validateQuantity(quantity: number): {
    isValid: boolean;
    error?: string;
    warnings?: string[];
  } {
    const warnings: string[] = [];
    
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return {
        isValid: false,
        error: 'Quantity must be a positive integer'
      };
    }

    if (quantity > 100000) {
      return {
        isValid: false,
        error: 'Maximum quantity is 100,000 codes per batch'
      };
    }

    if (quantity > 10000) {
      warnings.push('Large batches may take several minutes to generate');
    }

    if (quantity < 100) {
      warnings.push('Consider ordering more codes to take advantage of volume pricing');
    }

    return {
      isValid: true,
      warnings
    };
  }
}

