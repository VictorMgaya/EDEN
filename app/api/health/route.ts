import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // Check if required environment variables are set
    const requiredEnvVars = [
      'MONGODB_URI',
      'NEXTAUTH_SECRET',
      'STRIPE_SECRET_KEY'
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        name: mongoose.connection.name || 'not connected'
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development'
      },
      missingEnvironmentVariables: missingEnvVars,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      }
    };

    // If critical services are down, return unhealthy status
    if (dbStatus !== 'connected' || missingEnvVars.length > 0) {
      healthStatus.status = 'unhealthy';
      return NextResponse.json(healthStatus, { status: 503 });
    }

    return NextResponse.json(healthStatus);
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
