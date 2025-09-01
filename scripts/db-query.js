#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'users':
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          mobile: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' }
      });
      console.table(users);
      break;
      
    case 'sessions':
      const sessions = await prisma.session.findMany({
        include: {
          user: {
            select: { email: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      console.table(sessions.map(s => ({
        id: s.id,
        userEmail: s.user.email,
        userName: s.user.name,
        expiresAt: s.expiresAt,
        createdAt: s.createdAt
      })));
      break;
      
    case 'count':
      const userCount = await prisma.user.count();
      const sessionCount = await prisma.session.count();
      const activityCount = await prisma.activity.count();
      
      console.log(`📊 Database Stats:`);
      console.log(`👥 Users: ${userCount}`);
      console.log(`🔑 Sessions: ${sessionCount}`);
      console.log(`📈 Activities: ${activityCount}`);
      break;
      
    default:
      console.log(`
🔍 Quick Database Queries:

Usage: node scripts/db-query.js <command>

Commands:
  users     - Show all users
  sessions  - Show all sessions with user info
  count     - Show database statistics

Examples:
  node scripts/db-query.js users
  node scripts/db-query.js sessions
  node scripts/db-query.js count
      `);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
