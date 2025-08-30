import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default withAuth(
  function middleware(req: NextRequest) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Routes publiques autorisées
    const publicRoutes = ['/auth/signin', '/auth/signup', '/auth/error', '/']
    
    if (publicRoutes.includes(pathname)) {
      return NextResponse.next()
    }

    // Vérifier si l'utilisateur est connecté
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    // Vérifier si le compte est actif
    if (!token.isActive) {
      return NextResponse.redirect(new URL('/auth/error?error=AccountDisabled', req.url))
    }

    // Protection des routes admin (DIRECTEUR uniquement)
    const adminRoutes = ['/admin', '/settings', '/users']
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (token.role !== 'DIRECTEUR') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Protection des routes consultants
    const consultantRoutes = ['/consultant']
    if (consultantRoutes.some(route => pathname.startsWith(route))) {
      if (token.role !== 'CONSULTANT' && token.role !== 'DIRECTEUR') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Protection des routes finances (DIRECTEUR uniquement)
    const financeRoutes = ['/finances', '/transactions']
    if (financeRoutes.some(route => pathname.startsWith(route))) {
      if (token.role !== 'DIRECTEUR') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Routes publiques
        const publicRoutes = ['/auth/signin', '/auth/signup', '/auth/error', '/']
        if (publicRoutes.includes(pathname)) {
          return true
        }

        // Routes protégées nécessitent un token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}