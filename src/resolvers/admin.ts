import type { ApolloContext } from '../types/context.js';
import prisma from '@lib/prisma.js';
import { childLogger } from '@utils/logger.js';

const log = childLogger('admin-resolver');

function requireAdmin(context: ApolloContext) {
  if (!context.isAuthenticated || !context.user) {
    throw new Error('Authentication required');
  }
  if (context.user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
}

export const adminResolvers = {
  Query: {
    async users(
      _: any,
      args: { pagination?: { skip?: number; take?: number } },
      context: ApolloContext,
    ) {
      requireAdmin(context);
      const { skip = 0, take = 50 } = args.pagination || {};
      return prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: { preferences: true },
        skip,
        take,
      });
    },

    async adminStats(_: any, __: any, context: ApolloContext) {
      requireAdmin(context);

      const [
        totalUsers,
        activeUsers,
        totalAlerts,
        activeAlerts,
        totalStations,
        activeStations,
        totalNotifications,
        recentIngestionLogs,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.alertStatusRecord.count(),
        prisma.alertStatusRecord.count({ where: { isActive: true, resolved: false } }),
        prisma.gPSStation.count(),
        prisma.gPSStation.count({ where: { isActive: true } }),
        prisma.notification.count(),
        prisma.dataIngestionLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      return {
        totalUsers,
        activeUsers,
        totalAlerts,
        activeAlerts,
        totalStations,
        activeStations,
        totalNotifications,
        recentIngestionLogs,
      };
    },
  },

  Mutation: {
    async updateUserRole(_: any, args: { userId: string; role: string }, context: ApolloContext) {
      requireAdmin(context);

      const user = await prisma.user.update({
        where: { id: args.userId },
        data: { role: args.role as any },
        include: { preferences: true },
      });

      log.info({ userId: args.userId, newRole: args.role }, 'User role updated');
      return user;
    },

    async toggleUserActive(_: any, args: { userId: string }, context: ApolloContext) {
      requireAdmin(context);

      const existing = await prisma.user.findUnique({ where: { id: args.userId } });
      if (!existing) throw new Error('User not found');

      const user = await prisma.user.update({
        where: { id: args.userId },
        data: { isActive: !existing.isActive },
        include: { preferences: true },
      });

      log.info({ userId: args.userId, isActive: user.isActive }, 'User active status toggled');
      return user;
    },
  },
};
