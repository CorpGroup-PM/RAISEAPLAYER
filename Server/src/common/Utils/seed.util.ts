import { PrismaClient, UserRole, AuthProvider } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';

export class SeedUtils {
private static readonly logger = new Logger('SeedUtils');

static async seedAdmin(prisma: PrismaClient) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
     this.logger.warn('No ADMIN_PASSWORD found in env. Skipping admin seed.');
     return;
    }

    const existingAdmin = await prisma.user.findUnique({
     where: { email: adminEmail.toLowerCase() },
    });

    if (existingAdmin) {
     return; // Admin exists, do nothing
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await prisma.user.create({
     data: {
        email: adminEmail.toLowerCase(),
        phoneNumber: '0000000002', // Placeholder
        firstName: 'System',
        lastName: 'Admin',
        passwordHash: hashedPassword,
        role: UserRole.ADMIN,
        provider: AuthProvider.LOCAL,
        isEmailVerified: true,
     },
    });

    this.logger.log(`Bootstrap: Admin user created (${adminEmail})`);
}
}