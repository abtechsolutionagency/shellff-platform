
import { UserType } from '@prisma/client'
import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string
      userType: UserType
      firstName?: string | null
      lastName?: string | null
      userId?: string
      sciId?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    userType: UserType
    firstName?: string | null
    lastName?: string | null
    userId?: string
    sciId?: string | null
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id: string
    userType: UserType
    firstName?: string | null
    lastName?: string | null
    userId?: string
    sciId?: string | null
  }
}
