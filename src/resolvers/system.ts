import type { ApolloContext } from '../types/context.js';
import prisma from '@lib/prisma.js';
import { childLogger } from '@utils/logger.js';

const log = childLogger('system-resolver');

export const systemResolvers = {
  Query: {
    async notifications(
      _: any,
      args: { pagination?: { skip?: number; take?: number } },
      context: ApolloContext,
    ) {
      if (!context.isAuthenticated) {
        throw new Error('Authentication required');
      }
      const { skip = 0, take = 50 } = args.pagination || {};
      return prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      });
    },

    async systemHealth(_: any, __: any, context: ApolloContext) {
      if (!context.isAuthenticated) {
        throw new Error('Authentication required');
      }

      // Try to get latest system health record
      const latest = await prisma.systemHealth.findFirst({
        orderBy: { lastCheck: 'desc' },
        include: { components: true },
      });

      if (latest) {
        return {
          ...latest,
          components: latest.components.map((c) => ({
            name: c.name,
            status: c.status,
            responseTime: c.responseTime,
            errorRate: c.errorRate,
            lastCheck: c.lastCheck,
            details: c.details,
            errorMessage: c.errorMessage,
          })),
        };
      }

      // Synthesize health from live checks
      const startTime = Date.now();
      const components: Array<{
        name: string;
        status: string;
        responseTime: number;
        errorRate: number;
        lastCheck: Date;
        details: any;
        errorMessage: string | null;
      }> = [];

      // Check database
      try {
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        components.push({
          name: 'Database',
          status: 'HEALTHY',
          responseTime: Date.now() - dbStart,
          errorRate: 0,
          lastCheck: new Date(),
          details: { type: 'PostgreSQL' },
          errorMessage: null,
        });
      } catch (err: any) {
        components.push({
          name: 'Database',
          status: 'UNHEALTHY',
          responseTime: 0,
          errorRate: 100,
          lastCheck: new Date(),
          details: null,
          errorMessage: err.message,
        });
      }

      // Check GPS data freshness
      try {
        const latestReading = await prisma.gPSReading.findFirst({
          orderBy: { timestamp: 'desc' },
        });
        const stationCount = await prisma.gPSStation.count({ where: { isActive: true } });
        const isFresh = latestReading
          ? Date.now() - latestReading.timestamp.getTime() < 15 * 60 * 1000
          : false;
        components.push({
          name: 'GPS Ingestion',
          status: isFresh ? 'HEALTHY' : latestReading ? 'DEGRADED' : 'UNKNOWN',
          responseTime: 0,
          errorRate: 0,
          lastCheck: new Date(),
          details: {
            lastReading: latestReading?.timestamp,
            activeStations: stationCount,
          },
          errorMessage: null,
        });
      } catch (err: any) {
        components.push({
          name: 'GPS Ingestion',
          status: 'UNHEALTHY',
          responseTime: 0,
          errorRate: 100,
          lastCheck: new Date(),
          details: null,
          errorMessage: err.message,
        });
      }

      // Check Satellite data freshness
      try {
        const latestSat = await prisma.satelliteData.findFirst({
          orderBy: { timestamp: 'desc' },
        });
        const isFresh = latestSat
          ? Date.now() - latestSat.timestamp.getTime() < 60 * 60 * 1000
          : false;
        components.push({
          name: 'Satellite Processing',
          status: isFresh ? 'HEALTHY' : latestSat ? 'DEGRADED' : 'UNKNOWN',
          responseTime: 0,
          errorRate: 0,
          lastCheck: new Date(),
          details: { lastData: latestSat?.timestamp },
          errorMessage: null,
        });
      } catch (err: any) {
        components.push({
          name: 'Satellite Processing',
          status: 'UNHEALTHY',
          responseTime: 0,
          errorRate: 100,
          lastCheck: new Date(),
          details: null,
          errorMessage: err.message,
        });
      }

      // Check Alert Engine
      try {
        const activeAlerts = await prisma.alertStatusRecord.count({
          where: { isActive: true, resolved: false },
        });
        components.push({
          name: 'Alert Engine',
          status: 'HEALTHY',
          responseTime: 0,
          errorRate: 0,
          lastCheck: new Date(),
          details: { activeAlerts },
          errorMessage: null,
        });
      } catch (err: any) {
        components.push({
          name: 'Alert Engine',
          status: 'UNHEALTHY',
          responseTime: 0,
          errorRate: 100,
          lastCheck: new Date(),
          details: null,
          errorMessage: err.message,
        });
      }

      // Check Notification Service
      try {
        const recentFailed = await prisma.notification.count({
          where: {
            status: 'FAILED',
            createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
          },
        });
        const recentTotal = await prisma.notification.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
          },
        });
        const errorRate = recentTotal > 0 ? (recentFailed / recentTotal) * 100 : 0;
        components.push({
          name: 'Notification Service',
          status: errorRate > 50 ? 'UNHEALTHY' : errorRate > 10 ? 'DEGRADED' : 'HEALTHY',
          responseTime: 0,
          errorRate,
          lastCheck: new Date(),
          details: { recentFailed, recentTotal },
          errorMessage: null,
        });
      } catch (err: any) {
        components.push({
          name: 'Notification Service',
          status: 'UNKNOWN',
          responseTime: 0,
          errorRate: 0,
          lastCheck: new Date(),
          details: null,
          errorMessage: err.message,
        });
      }

      const unhealthyCount = components.filter((c) => c.status === 'UNHEALTHY').length;
      const degradedCount = components.filter((c) => c.status === 'DEGRADED').length;
      const overallStatus =
        unhealthyCount > 0 ? 'UNHEALTHY' : degradedCount > 0 ? 'DEGRADED' : 'HEALTHY';

      return {
        id: 'live-check',
        overallStatus,
        uptime: 99.9,
        components,
        metrics: {
          totalResponseTime: Date.now() - startTime,
          componentCount: components.length,
        },
        lastCheck: new Date(),
      };
    },

    async auditLogs(
      _: any,
      args: { pagination?: { skip?: number; take?: number } },
      context: ApolloContext,
    ) {
      if (!context.isAuthenticated || context.user?.role !== 'ADMIN') {
        throw new Error('Admin access required');
      }
      const { skip = 0, take = 50 } = args.pagination || {};
      return prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      });
    },
  },
};
