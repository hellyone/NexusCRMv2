import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Health check endpoint para containers Docker
 * Verifica: aplicação, banco de dados
 */
export async function GET() {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        checks: {
            application: 'ok',
            database: 'unknown',
        },
    };

    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;
        health.checks.database = 'ok';
    } catch (error) {
        health.status = 'error';
        health.checks.database = 'error';
        health.error = error.message;
        
        return NextResponse.json(health, { status: 503 });
    }

    return NextResponse.json(health, { status: 200 });
}

