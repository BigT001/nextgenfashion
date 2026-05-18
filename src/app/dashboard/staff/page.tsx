import { getStaffAction } from "@/modules/staff/actions/staff.actions";
import { StaffTable } from "@/modules/staff/components/staff-table";
import { auth } from "@/services/auth.service";
import { UserRole } from "@/modules/auth/constants";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Staff Management - NextGen Fashion",
  description: "Manage your staff members and their roles",
};

export default async function StaffPage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role as UserRole || UserRole.STAFF;

  if (userRole !== UserRole.SUPERADMIN && userRole !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  const res = await getStaffAction();
  
  if (!res.success) {
    return (
      <div className="flex-1 p-8 pt-6">
        <div className="rounded-md bg-destructive/15 p-4 text-destructive border border-destructive/20">
          <h3 className="font-semibold mb-1">Failed to load staff</h3>
          <p className="text-sm">{res.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <StaffTable data={res.data || []} />
    </div>
  );
}
