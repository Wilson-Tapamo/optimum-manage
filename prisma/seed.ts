// Fichier: prisma/seed.ts (Version finale basée sur votre schéma complet)

import {
  PrismaClient, UserRole, ProjectStatus, TaskStatus,
  TransactionType, TransactionCategory, Priority, NotificationType
} from '@prisma/client';
import { Faker, fr } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const faker = new Faker({ locale: [fr] });

// --- DONNÉES DE BASE POUR LE CONTEXTE CAMEROUNAIS ---
const NOMS_CAMEROUNAIS = ['Ngassa', 'Kamdem', 'Tchinda', 'Fogue', 'Mbiaga', 'Wembe', 'Talla', 'Fotso', 'Kenfack', 'Noubissi', 'Toko', 'Eto\'o', 'Milla', 'N\'Kono', 'Song'];
const PRENOMS_CAMEROUNAIS = ['Yvan', 'Marthe', 'Serge', 'Carine', 'Didier', 'Josiane', 'Alain', 'Solange', 'Hervé', 'Nadège', 'Samuel', 'Gaëlle', 'Roger', 'Chantal', 'Rigobert'];
const SKILLS = ['React', 'Node.js', 'Gestion de Projet', 'Design UX/UI', 'DevOps', 'Base de données', 'Marketing Digital', 'PHP/Symfony', 'Flutter'];

const PROJETS_SIMPLES = [
  { title: "Création de logo pour la boutique 'Douala Market'", budget: 350000, estimatedHours: 40 },
  { title: "Développement d'une page vitrine pour 'Kribi Pêcheurs'", budget: 750000, estimatedHours: 80 },
  { title: "Campagne publicitaire pour 'Yaoundé Fashion Week'", budget: 500000, estimatedHours: 50 },
  { title: "Maintenance du site de l'hôtel 'Limbe Beach Resort'", budget: 400000, estimatedHours: 30 },
  { title: "Rédaction de contenu pour le blog 'Cuisine du Mboa'", budget: 250000, estimatedHours: 25 },
];
const PROJETS_POUSSES = [
  { title: "Développement de l'app de gestion de tontine 'TontinApp'", budget: 8500000, estimatedHours: 600 },
  { title: "Plateforme e-commerce pour 'Made in Cameroun'", budget: 12000000, estimatedHours: 950 },
  { title: "Système de billetterie en ligne pour la fédération de football", budget: 15000000, estimatedHours: 1200 },
  { title: "Digitalisation des archives de la Mairie de Bafoussam", budget: 7000000, estimatedHours: 550 },
  { title: "Création d'une application de VTC pour la ville de Douala", budget: 25000000, estimatedHours: 2000 },
];

// --- FONCTION PRINCIPALE DU SEED ---
async function main() {
  console.log('🏁 Démarrage du processus de seeding...');

  console.log('🧹 Nettoyage de la base de données (ordre important)...');
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.consultant.deleteMany({});
  await prisma.user.deleteMany({});
  
  console.log('👤 Création des utilisateurs...');
  const hashedPassword = await bcrypt.hash('password123', 12);

  const directeurUser = await prisma.user.create({
    data: {
      firstName: 'Jean-Pierre', lastName: 'Kamga', email: 'directeur@optimum.com',
      password: hashedPassword, role: UserRole.DIRECTEUR, isActive: true,
    },
  });

  const users = [directeurUser];
  for (let i = 0; i < 15; i++) {
    const firstName = faker.helpers.arrayElement(PRENOMS_CAMEROUNAIS);
    const lastName = faker.helpers.arrayElement(NOMS_CAMEROUNAIS);
    const user = await prisma.user.create({
      data: {
        firstName, lastName, email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        password: hashedPassword, role: UserRole.CONSULTANT, isActive: true,
      },
    });
    users.push(user);
  }
  
  const consultantsDb = await Promise.all(
    users.filter(u => u.role === UserRole.CONSULTANT).map(user => 
      prisma.consultant.create({
        data: {
          userId: user.id,
          tjm: faker.number.int({ min: 35000, max: 150000 }),
          specialization: faker.person.jobTitle(),
          skills: faker.helpers.arrayElements(SKILLS, { min: 2, max: 4 }),
          experience: faker.number.int({ min: 1, max: 15 }),
          biography: faker.lorem.paragraph(),
        }
      })
    )
  );
  console.log(`✅ ${users.length} utilisateurs et ${consultantsDb.length} consultants créés.`);

  console.log('🏗️ Création des projets...');
  const projectsDb = [];
  const allProjectTemplates = [...PROJETS_SIMPLES, ...PROJETS_POUSSES];
  for (const template of allProjectTemplates) {
    const manager = faker.helpers.arrayElement(users.filter(u => u.role === 'CONSULTANT'));
    const project = await prisma.project.create({
      data: {
        title: template.title,
        description: faker.lorem.paragraph(),
        budget: template.budget,
        estimatedHours: template.estimatedHours,
        status: faker.helpers.arrayElement(Object.values(ProjectStatus)),
        priority: faker.helpers.arrayElement(Object.values(Priority)),
        creatorId: directeurUser.id,
        managerId: manager.id,
        clientName: faker.company.name(),
      },
    });
    projectsDb.push(project);
  }
  console.log(`✅ ${projectsDb.length} projets créés.`);

  console.log('📋 Création des tâches pour chaque projet...');
  const tasksDb = [];
  for (const project of projectsDb) {
    const tasksCount = faker.number.int({ min: 5, max: 20 });
    for (let i = 0; i < tasksCount; i++) {
      const assignedUser = faker.helpers.arrayElement(users.filter(u => u.role === 'CONSULTANT'));
      const task = await prisma.task.create({
        data: {
          projectId: project.id,
          title: faker.commerce.productName().replace(/^./, (match) => match.toUpperCase()),
          description: faker.lorem.sentence(),
          status: faker.helpers.arrayElement(Object.values(TaskStatus)),
          priority: faker.helpers.arrayElement(Object.values(Priority)),
          estimatedHours: faker.number.int({ min: 5, max: 40 }),
          assignedUserId: assignedUser.id,
        },
      });
      tasksDb.push(task);
    }
  }
  console.log(`✅ ${tasksDb.length} tâches créées.`);

  console.log('💰 Génération des opérations financières journalières (1er juin - 20 août 2025)...');
  const startDate = new Date('2025-06-01T00:00:00Z');
  const endDate = new Date('2025-08-20T23:59:59Z');
  
  for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
    const transactionsCount = faker.number.int({ min: 1, max: 5 });
    for (let i = 0; i < transactionsCount; i++) {
      const randomProject = faker.helpers.arrayElement(projectsDb);
      const randomConsultant = faker.helpers.arrayElement(consultantsDb);
      const type = faker.helpers.arrayElement([TransactionType.ENTREE, TransactionType.SORTIE]);
      
      if (type === TransactionType.ENTREE) {
        await prisma.transaction.create({
          data: {
            type, category: TransactionCategory.REVENUS_PROJET,
            amount: faker.number.int({ min: 100000, max: 2500000 }),
            description: `Paiement client pour projet "${randomProject.title}"`,
            projectId: randomProject.id, isPaid: true, createdAt: day,
          }
        });
      } else { // SORTIE
        const category = faker.helpers.arrayElement([TransactionCategory.SALAIRE_CONSULTANT, TransactionCategory.FRAIS_DEPLACEMENT, TransactionCategory.FRAIS_MATERIELS]);
        if (category === TransactionCategory.SALAIRE_CONSULTANT) {
          await prisma.transaction.create({
            data: {
              type, category,
              amount: randomConsultant.tjm * faker.number.int({ min: 5, max: 20 }),
              description: `Paiement salaire pour consultant ID ${randomConsultant.id}`,
              consultantId: randomConsultant.id, isPaid: true, createdAt: day,
            }
          });
        } else {
          await prisma.transaction.create({
            data: {
              type, category,
              amount: faker.number.int({ min: 25000, max: 500000 }),
              description: `Achat: ${faker.commerce.productName()}`,
              isPaid: true, createdAt: day,
            }
          });
        }
      }
    }
  }
  console.log('✅ Transactions journalières générées.');

  console.log('✨ Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Une erreur est survenue pendant le seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Déconnexion du client Prisma.');
    await prisma.$disconnect();
  });