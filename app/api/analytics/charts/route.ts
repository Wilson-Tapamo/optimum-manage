// Fichier : app/api/analytics/charts/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/response-utils' // On réutilise votre gestionnaire d'erreurs

export async function GET(request: NextRequest) {
  try {
    // 1. Définir la plage de dates : les 12 derniers mois
    const today = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(today.getMonth() - 11);
    twelveMonthsAgo.setDate(1); // Aller au début de ce mois pour avoir 12 mois complets

    // 2. Récupérer toutes les données brutes nécessaires en une seule fois
    const [transactions, projects] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: twelveMonthsAgo,
          },
        },
        select: {
          amount: true,
          type: true,
          createdAt: true,
        },
      }),
      prisma.project.findMany({
        where: {
          createdAt: {
            gte: twelveMonthsAgo,
          },
        },
        select: {
          createdAt: true,
        },
      }),
    ]);

    // 3. Agréger les données par mois (format AAAA-MM)
    const monthlyData = new Map<string, { revenus: number, depenses: number, projets: number }>();

    // Initialiser les 12 derniers mois pour s'assurer qu'il n'y a pas de trous
    for (let i = 0; i < 12; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData.set(key, { revenus: 0, depenses: 0, projets: 0 });
    }

    // Traiter les transactions
    transactions.forEach(tx => {
      const key = `${tx.createdAt.getFullYear()}-${String(tx.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const month = monthlyData.get(key);
      if (month) {
        if (tx.type === 'ENTREE') {
          month.revenus += tx.amount;
        } else if (tx.type === 'SORTIE') {
          month.depenses += tx.amount;
        }
      }
    });

    // Traiter les projets
    projects.forEach(project => {
      const key = `${project.createdAt.getFullYear()}-${String(project.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const month = monthlyData.get(key);
      if (month) {
        month.projets += 1;
      }
    });

    // 4. Transformer la Map en un tableau trié et formaté pour le graphique
    const chartData = Array.from(monthlyData.entries())
      .map(([key, value]) => {
        const [year, month] = key.split('-').map(Number);
        const date = new Date(year, month - 1);
        return {
          // Formatte le nom du mois de manière conviviale (ex: "Aoû '25")
          name: date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }),
          date,
          ...value,
        };
      })
      // Trier par date pour que le graphique soit dans le bon ordre
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return NextResponse.json(chartData);
    
  } catch (error) {
    return handleApiError(error);
  }
}
