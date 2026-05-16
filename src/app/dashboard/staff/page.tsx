import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getStaffAction } from "@/modules/staff/actions/staff.actions";
import { StaffTable } from "@/modules/staff/components/staff-table";
import { UserRole } from "@prisma/client";
import { authOptions } from "@/modules/auth/api/auth/[...nextauth]/route";

export const metadata = {
  title: "Staff Management - NextGen Fashion",
  description: "Manage your staff members and their roles",
};

export default async function StaffPage() {
  // Try to use a central auth utility if it exists, otherwise fallback to next-auth
  // Or check if there is an auth guard wrapper around this route.
  
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
      <StaffTable data={res.data} />
    </div>
  );
}
