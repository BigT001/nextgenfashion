import { auth } from "@/services/auth.service";
import { UserRole } from "@/modules/auth/constants";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

/**
 * ROLE GUARD COMPONENT
 * Use this to wrap UI elements that should only be visible to specific roles.
 * Supports both Server and Client contexts (but primarily designed for Server-side checks).
 */
export async function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
}: RoleGuardProps) {
  const session = await auth();

  if (!session?.user || !allowedRoles.includes((session.user as any).role as UserRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
