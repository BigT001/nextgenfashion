import { auth } from "@/services/auth.service";
import { redirect } from "next/navigation";
import { getCustomerDetailAction } from "@/modules/customers/actions/customer.actions";
import { getPatronOrdersAction } from "@/modules/orders/actions/order.actions";
import AccountClient from "./AccountClient";

export default async function AccountPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/login?callbackUrl=/account");
  }

  let customerId = (session.user as any)?.customerId;
  const email = session.user?.email;

  // Since the DB was purged, the session customerId might be stale.
  // Look up the customer by email to get the true customerId.
  if (email && customerId) {
    const { prisma } = await import("@/services/prisma.service");
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (customer) {
      customerId = customer.id;
    }
  }

  if (!customerId) {
      // It's a staff/admin, they don't have a customer profile
      return <AccountClient initialPatronData={null} initialOrders={[]} />;
  }

  // Pre-fetch data on the server for instant load
  const [patronResult, ordersResult] = await Promise.all([
    getCustomerDetailAction(customerId),
    getPatronOrdersAction(customerId)
  ]);

  return (
    <AccountClient 
      initialPatronData={patronResult.success ? patronResult.data : null} 
      initialOrders={ordersResult.success ? ordersResult.data : []} 
    />
  );
}
