'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Email ou mot de passe incorrect'
      case 'AccountDisabled':
        return 'Votre compte a été désactivé. Contactez l\'administrateur.'
      case 'AccessDenied':
        return 'Accès refusé. Vous n\'avez pas les permissions nécessaires.'
      case 'Configuration':
        return 'Erreur de configuration du serveur'
      default:
        return 'Une erreur inattendue s\'est produite'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          {/* Icône d'erreur */}
          <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Erreur d'authentification
          </h2>
          
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              {getErrorMessage(error)}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/auth/signin"
            className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la connexion
          </Link>
          
          <Link
            href="/"
            className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}