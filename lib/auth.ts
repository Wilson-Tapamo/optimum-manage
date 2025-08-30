import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis')
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            consultant: true
          }
        })

        if (!user) {
          throw new Error('Aucun utilisateur trouvé avec cet email')
        }

        if (!user.isActive) {
          throw new Error('Compte désactivé. Contactez l\'administrateur.')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Mot de passe incorrect')
        }

        // Mise à jour de la dernière connexion
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        })

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          isActive: user.isActive,
          consultant: user.consultant ? {
            id: user.consultant.id,
            tjm: user.consultant.tjm,
            specialization: user.consultant.specialization,
            reliability: user.consultant.reliability,
            isAvailable: user.consultant.isAvailable
          } : null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 heures
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.phone = user.phone
        token.avatar = user.avatar
        token.isActive = user.isActive
        token.consultant = user.consultant
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string
        session.user.role = token.role as UserRole
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.phone = token.phone as string
        session.user.avatar = token.avatar as string
        session.user.isActive = token.isActive as boolean
        session.user.consultant = token.consultant as any
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Redirection après connexion selon le rôle
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl + "/dashboard"
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error'
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
}

// Types pour TypeScript
declare module 'next-auth' {
  interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    phone?: string
    avatar?: string
    role: UserRole
    isActive: boolean
    consultant?: {
      id: string
      tjm: number
      specialization: string
      reliability: number
      isAvailable: boolean
    } | null
  }

  interface Session {
    user: User
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    firstName: string
    lastName: string
    phone?: string
    avatar?: string
    isActive: boolean
    consultant?: {
      id: string
      tjm: number
      specialization: string
      reliability: number
      isAvailable: boolean
    } | null
  }
}