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

  const customerId = (session.user as any)?.customerId;

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
