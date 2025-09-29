
import { PrismaClient } from '@prisma/client';
import { 
  DiscountType, 
  PurchaseType, 
  DiscountTarget,
  DiscountRule,
  PaymentMethod 
} from '@prisma/client';

const prisma = new PrismaClient();

interface PurchaseContext {
  userId: string;
  purchaseType: PurchaseType;
  amount: number;
  quantity: number;
  paymentMethodId?: string;
  orderItems?: Array<{
    id: string;
    price: number;
    quantity: number;
  }>;
}

interface DiscountCalculation {
  applicableDiscounts: DiscountRule[];
  totalDiscount: number;
  finalAmount: number;
  originalAmount: number;
  discountBreakdown: Array<{
    ruleId: string;
    ruleName: string;
    discountType: DiscountType;
    discountAmount: number;
  }>;
}

export class DiscountEngine {
  /**
   * Calculate applicable discounts for a purchase
   */
  static async calculateDiscounts(
    context: PurchaseContext
  ): Promise<DiscountCalculation> {
    const { userId, purchaseType, amount, quantity, paymentMethodId } = context;

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { discountUsages: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get admin discount configuration
    const adminConfig = await prisma.adminDiscountConfiguration.findFirst();
    
    if (!adminConfig?.globalDiscountEnabled) {
      return {
        applicableDiscounts: [],
        totalDiscount: 0,
        finalAmount: amount,
        originalAmount: amount,
        discountBreakdown: []
      };
    }

    // Get all active discount rules
    const now = new Date();
    const discountRules = await prisma.discountRule.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } }
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } }
            ]
          }
        ]
      },
      include: { paymentMethod: true },
      orderBy: { priority: 'desc' }
    });

    // Filter applicable discount rules
    const applicableDiscounts = await this.filterApplicableDiscounts(
      discountRules,
      context,
      user.discountUsages
    );

    // Calculate discounts
    let finalAmount = amount;
    const discountBreakdown: DiscountCalculation['discountBreakdown'] = [];
    let totalDiscount = 0;

    // Apply discounts based on configuration
    const maxStackable = adminConfig?.maxStackableDiscounts || 3;
    let appliedCount = 0;

    for (const rule of applicableDiscounts) {
      if (!rule.isStackable && appliedCount > 0) {
        break;
      }
      
      if (appliedCount >= maxStackable) {
        break;
      }

      const discountAmount = await this.calculateSingleDiscount(
        rule,
        finalAmount,
        quantity,
        context
      );

      if (discountAmount > 0) {
        finalAmount -= discountAmount;
        totalDiscount += discountAmount;
        
        discountBreakdown.push({
          ruleId: rule.id,
          ruleName: rule.name,
          discountType: rule.discountType,
          discountAmount: discountAmount
        });

        appliedCount++;
      }
    }

    // Ensure final amount doesn't go below 0
    finalAmount = Math.max(0, finalAmount);
    totalDiscount = amount - finalAmount;

    return {
      applicableDiscounts,
      totalDiscount,
      finalAmount,
      originalAmount: amount,
      discountBreakdown
    };
  }

  /**
   * Filter discount rules that are applicable to the purchase
   */
  private static async filterApplicableDiscounts(
    rules: DiscountRule[],
    context: PurchaseContext,
    userDiscountUsages: any[]
  ): Promise<DiscountRule[]> {
    const applicable: DiscountRule[] = [];

    for (const rule of rules) {
      // Check target compatibility
      if (!this.isTargetCompatible(rule, context)) {
        continue;
      }

      // Check purchase type compatibility
      if (!this.isPurchaseTypeCompatible(rule, context.purchaseType)) {
        continue;
      }

      // Check amount constraints
      if (!this.isAmountConstraintMet(rule, context.amount)) {
        continue;
      }

      // Check quantity constraints
      if (!this.isQuantityConstraintMet(rule, context.quantity)) {
        continue;
      }

      // Check usage limits
      if (!this.isUsageLimitMet(rule, context.userId, userDiscountUsages)) {
        continue;
      }

      applicable.push(rule);
    }

    return applicable;
  }

  /**
   * Calculate discount amount for a single rule
   */
  private static async calculateSingleDiscount(
    rule: DiscountRule,
    currentAmount: number,
    quantity: number,
    context: PurchaseContext
  ): Promise<number> {
    switch (rule.discountType) {
      case DiscountType.PERCENTAGE:
        const percentage = rule.percentageDiscount?.toNumber() || 0;
        return currentAmount * percentage;

      case DiscountType.FIXED_AMOUNT:
        const fixedAmount = rule.fixedAmountDiscount?.toNumber() || 0;
        return Math.min(fixedAmount, currentAmount);

      case DiscountType.BUY_X_GET_Y:
        if (rule.buyQuantity && rule.getQuantity) {
          const freeItems = Math.floor(quantity / rule.buyQuantity) * rule.getQuantity;
          const itemPrice = currentAmount / quantity;
          return freeItems * itemPrice;
        }
        return 0;

      case DiscountType.TIERED:
        return this.calculateTieredDiscount(rule, currentAmount, quantity);

      default:
        return 0;
    }
  }

  /**
   * Calculate tiered discount based on quantity/amount breakpoints
   */
  private static calculateTieredDiscount(
    rule: DiscountRule,
    amount: number,
    quantity: number
  ): number {
    if (!rule.tierBreakpoints) return 0;

    try {
      const breakpoints = JSON.parse(rule.tierBreakpoints as string) as Array<{
        min: number;
        discount: number;
      }>;

      // Sort breakpoints by minimum value (descending) to get highest applicable tier
      breakpoints.sort((a, b) => b.min - a.min);

      for (const breakpoint of breakpoints) {
        if (quantity >= breakpoint.min) {
          return amount * breakpoint.discount;
        }
      }
    } catch (error) {
      console.error('Error parsing tier breakpoints:', error);
    }

    return 0;
  }

  /**
   * Check if discount target is compatible with purchase context
   */
  private static isTargetCompatible(
    rule: DiscountRule,
    context: PurchaseContext
  ): boolean {
    switch (rule.target) {
      case DiscountTarget.PAYMENT_METHOD:
        return rule.paymentMethodId === context.paymentMethodId;
      
      case DiscountTarget.PURCHASE_TYPE:
      case DiscountTarget.GLOBAL:
      case DiscountTarget.USER_TIER:
      case DiscountTarget.CREATOR_TIER:
        return true; // Further checks done in other methods
      
      default:
        return false;
    }
  }

  /**
   * Check if purchase type is compatible with discount rule
   */
  private static isPurchaseTypeCompatible(
    rule: DiscountRule,
    purchaseType: PurchaseType
  ): boolean {
    if (!rule.purchaseTypes) return true;

    try {
      const supportedTypes = JSON.parse(rule.purchaseTypes as string) as PurchaseType[];
      return supportedTypes.includes(purchaseType) || supportedTypes.includes(PurchaseType.ALL);
    } catch (error) {
      console.error('Error parsing purchase types:', error);
      return false;
    }
  }

  /**
   * Check if amount constraints are met
   */
  private static isAmountConstraintMet(rule: DiscountRule, amount: number): boolean {
    if (rule.minOrderAmount && amount < rule.minOrderAmount.toNumber()) {
      return false;
    }
    
    if (rule.maxOrderAmount && amount > rule.maxOrderAmount.toNumber()) {
      return false;
    }

    return true;
  }

  /**
   * Check if quantity constraints are met
   */
  private static isQuantityConstraintMet(rule: DiscountRule, quantity: number): boolean {
    if (rule.minQuantity && quantity < rule.minQuantity) {
      return false;
    }
    
    if (rule.maxQuantity && quantity > rule.maxQuantity) {
      return false;
    }

    return true;
  }

  /**
   * Check if usage limits are met
   */
  private static isUsageLimitMet(
    rule: DiscountRule,
    userId: string,
    userDiscountUsages: any[]
  ): boolean {
    // Check global usage limit
    if (rule.maxTotalUsage && rule.currentTotalUsage >= rule.maxTotalUsage) {
      return false;
    }

    // Check per-user usage limit
    if (rule.maxUsagePerUser) {
      const userUsageCount = userDiscountUsages.filter(
        usage => usage.discountRuleId === rule.id
      ).length;
      
      if (userUsageCount >= rule.maxUsagePerUser) {
        return false;
      }
    }

    return true;
  }

  /**
   * Record discount usage after successful purchase
   */
  static async recordDiscountUsage(
    userId: string,
    discountRuleId: string,
    orderId: string,
    discountAmount: number,
    originalAmount: number,
    finalAmount: number,
    purchaseType: PurchaseType
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Record usage
      await tx.discountUsage.create({
        data: {
          userId,
          discountRuleId,
          orderId,
          discountAmount,
          originalAmount,
          finalAmount,
          purchaseType
        }
      });

      // Update total usage counter
      await tx.discountRule.update({
        where: { id: discountRuleId },
        data: {
          currentTotalUsage: { increment: 1 }
        }
      });
    });
  }

  /**
   * Get discount statistics for admin dashboard
   */
  static async getDiscountStatistics(startDate?: Date, endDate?: Date) {
    const whereClause = startDate && endDate ? {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    } : {};

    const [totalDiscounts, totalSavings, topDiscounts] = await Promise.all([
      prisma.discountUsage.count({ where: whereClause }),
      
      prisma.discountUsage.aggregate({
        where: whereClause,
        _sum: { discountAmount: true }
      }),
      
      prisma.discountUsage.groupBy({
        by: ['discountRuleId'],
        where: whereClause,
        _count: true,
        _sum: { discountAmount: true },
        orderBy: { _count: { discountRuleId: 'desc' } },
        take: 10
      })
    ]);

    return {
      totalDiscounts,
      totalSavings: totalSavings._sum.discountAmount || 0,
      topDiscounts
    };
  }
}

export default DiscountEngine;
