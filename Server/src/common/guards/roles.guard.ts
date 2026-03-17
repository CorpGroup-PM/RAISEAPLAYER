import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client'; // UPDATED ENUM
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get roles defined on the route
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 2. No @Roles() decorator present → deny by default.
    // RolesGuard should only be applied alongside an explicit @Roles() decorator.
    // Returning false here ensures a missing decorator causes a 403, not open access.
    if (!requiredRoles) {
      return false;
    }

    // 3. Extract authenticated user
    const { user } = context.switchToHttp().getRequest();

    // 4. Validate role
    return requiredRoles.some((role) => user.role === role);
  }
}
