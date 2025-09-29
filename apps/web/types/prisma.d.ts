import type { Decimal } from "@prisma/client/runtime/library";

type DecimalLike = number | Decimal | { toNumber(): number } | null | undefined;

declare module "@prisma/client" {
  export const UserType: {
    readonly LISTENER: "LISTENER";
    readonly CREATOR: "CREATOR";
    readonly ADMIN: "ADMIN";
  };
  export type UserType = (typeof UserType)[keyof typeof UserType];

  export const AlbumType: {
    readonly ALBUM: "ALBUM";
    readonly EP: "EP";
    readonly SINGLE: "SINGLE";
    readonly COMPILATION: "COMPILATION";
  };
  export type AlbumType = (typeof AlbumType)[keyof typeof AlbumType];

  export const DiscountType: {
    readonly PERCENTAGE: "PERCENTAGE";
    readonly FIXED_AMOUNT: "FIXED_AMOUNT";
    readonly BUY_X_GET_Y: "BUY_X_GET_Y";
    readonly TIERED: "TIERED";
  };
  export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

  export const DiscountTarget: {
    readonly PAYMENT_METHOD: "PAYMENT_METHOD";
    readonly PURCHASE_TYPE: "PURCHASE_TYPE";
    readonly GLOBAL: "GLOBAL";
    readonly USER_TIER: "USER_TIER";
    readonly CREATOR_TIER: "CREATOR_TIER";
  };
  export type DiscountTarget = (typeof DiscountTarget)[keyof typeof DiscountTarget];

  export const PurchaseType: {
    readonly ALBUM: "ALBUM";
    readonly TRACK: "TRACK";
    readonly UNLOCK_CODES: "UNLOCK_CODES";
    readonly STREAMING_FEES: "STREAMING_FEES";
    readonly PREMIUM_SUBSCRIPTION: "PREMIUM_SUBSCRIPTION";
    readonly ARTIST_FEATURES: "ARTIST_FEATURES";
    readonly MARKETPLACE_TRANSACTION: "MARKETPLACE_TRANSACTION";
    readonly ALL: "ALL";
  };
  export type PurchaseType = (typeof PurchaseType)[keyof typeof PurchaseType];

  export const WalletType: {
    readonly PURCHASES: "PURCHASES";
    readonly EARNINGS: "EARNINGS";
  };
  export type WalletType = (typeof WalletType)[keyof typeof WalletType];

  export const TransactionType: {
    readonly DEPOSIT: "DEPOSIT";
    readonly WITHDRAWAL: "WITHDRAWAL";
    readonly PURCHASE: "PURCHASE";
    readonly EARNING: "EARNING";
    readonly TRANSFER: "TRANSFER";
    readonly FEE: "FEE";
    readonly REFUND: "REFUND";
    readonly VOUCHER_REDEMPTION: "VOUCHER_REDEMPTION";
  };
  export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

  export const TransactionStatus: {
    readonly PENDING: "PENDING";
    readonly PROCESSING: "PROCESSING";
    readonly COMPLETED: "COMPLETED";
    readonly FAILED: "FAILED";
    readonly CANCELLED: "CANCELLED";
    readonly EXPIRED: "EXPIRED";
  };
  export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

  export const PaymentProvider: {
    readonly PAYSTACK: "PAYSTACK";
    readonly OPAY: "OPAY";
    readonly STRIPE: "STRIPE";
    readonly MYFATOORAH: "MYFATOORAH";
    readonly CRYPTO_SOL: "CRYPTO_SOL";
    readonly VOUCHER: "VOUCHER";
    readonly ADMIN_CREDIT: "ADMIN_CREDIT";
  };
  export type PaymentProvider = (typeof PaymentProvider)[keyof typeof PaymentProvider];

  export const TagCategory: {
    readonly GENRE: "GENRE";
    readonly MOOD: "MOOD";
    readonly ACTIVITY: "ACTIVITY";
    readonly DECADE: "DECADE";
    readonly LANGUAGE: "LANGUAGE";
  };
  export type TagCategory = (typeof TagCategory)[keyof typeof TagCategory];

  export interface Playlist {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    coverArt: string | null;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface PlaylistTrack {
    id: string;
    playlistId: string;
    trackId: string;
    position: number;
    addedAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }

  export interface DiscountRule {
    id: string;
    name: string;
    description?: string | null;
    discountType: DiscountType;
    target: DiscountTarget;
    isStackable: boolean;
    paymentMethodId?: string | null;
    percentageDiscount?: DecimalLike;
    fixedAmountDiscount?: DecimalLike;
    buyQuantity?: number | null;
    getQuantity?: number | null;
    tierBreakpoints?: string | null;
    minOrderAmount?: DecimalLike;
    maxOrderAmount?: DecimalLike;
    minQuantity?: number | null;
    maxQuantity?: number | null;
    maxTotalUsage?: number | null;
    currentTotalUsage: number;
    maxUsagePerUser?: number | null;
    purchaseTypes?: string | null;
  }

  export namespace Prisma {
    export type AlbumWhereInput = Record<string, unknown>;
    export type AlbumOrderByWithRelationInput = Record<string, unknown>;
    export type ArtistWhereInput = Record<string, unknown>;
    export type ArtistOrderByWithRelationInput = Record<string, unknown>;
  }
}
