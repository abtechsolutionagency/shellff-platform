import { SetMetadata } from '@nestjs/common';
import type { RoleType } from '@prisma/client';

export const ROLES_KEY = 'required_roles';

export const RequireRoles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);
