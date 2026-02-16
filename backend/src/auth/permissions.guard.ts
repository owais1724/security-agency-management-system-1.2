import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    ) || [];

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('You are not authenticated');
    }

    // Super Admin, Agency Admin, and HR/Supervisors often have broad permissions
    const userRole = user.role || '';
    const normalizedRole = typeof userRole === 'string' ? userRole.toLowerCase().trim() : '';

    // Log role check for debugging
    if (process.env.DEBUG_AUTH === 'true') {
      console.log(`[PermissionsGuard] Checking role: "${normalizedRole}" for user: ${user.email}`);
    }

    if (normalizedRole.includes('admin') || normalizedRole.includes('hr') || normalizedRole.includes('supervisor')) {
      return true;
    }

    // If no specific permissions are required for this route, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      console.log(`[PermissionsGuard] No permissions required for ${context.getHandler().name}, allowing access.`);
      return true;
    }

    // Check if user has any of the required permissions
    const userPermissions = user.permissions || [];
    const hasPermission = requiredPermissions.some(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      console.log(`[PermissionsGuard] Access Denied for ${user.email}. Required: ${requiredPermissions}, User has: ${userPermissions}`);
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}
