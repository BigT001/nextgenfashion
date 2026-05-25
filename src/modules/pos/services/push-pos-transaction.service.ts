import { prisma } from "@/services/prisma.service";
import { PaymentMethod, SaleStatus } from "@prisma/client";

export class PushPosTransactionService {
  static getTransactionEndpoint(): string {
    const apiUrl = process.env.POS_API_URL;
    const endpoint = (process.env.POS_TRANSACTIONS_ENDPOINT || "transactions").trim();

    if (!apiUrl) {
      throw new Error("POS_API_URL must be configured to push transactions to PHP POS.");
    }

    const normalizedBase = apiUrl.replace(/\/+/g, "/").replace(/\/$/, "");
    const normalizedPath = endpoint.replace(/^\//, "");
    return `${normalizedBase}/${normalizedPath}`;
  }

  static buildTransactionPayload(sale: any) {
    return {
      order_number: sale.orderNumber,
      total_amount: Number(sale.totalAmount),
      payment_method: sale.paymentMethod,
      status: sale.status,
      payment_ref: sale.paymentRef,
      customer: sale.customer
        ? {
            name: sale.customer.name,
            email: sale.customer.email,
            phone: sale.customer.phone,
          }
        : undefined,
      items: sale.items
        .map((item: any) => {
          const sku = item.variant?.sku;
          const barcode = item.variant?.barcode;
          if (!sku && !barcode) return null;

          return {
            sku,
            barcode,
            quantity: item.quantity,
            unit_price: Number(item.price),
            total: Number(item.price) * item.quantity,
          };
        })
        .filter(Boolean),
      source: "NEXTGEN-FASHION",
    };
  }

  static async execute(saleId: string) {
    const apiKey = process.env.POS_API_KEY;
    const apiUrl = this.getTransactionEndpoint();

    if (!apiKey) {
      throw new Error("POS_API_KEY must be configured to push transactions to PHP POS.");
    }

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          include: {
            variant: true,
          },
        },
        customer: true,
      },
    });

    if (!sale) {
      throw new Error(`Sale ${saleId} not found.`);
    }

    if (sale.orderNumber?.startsWith("POS-")) {
      return {
        success: true,
        message: "Skipping transaction push for imported POS sale.",
      };
    }

    const payload = this.buildTransactionPayload(sale);
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to push sale to PHP POS (${response.status}): ${text}`);
    }

    return {
      success: true,
      message: "Sale pushed to PHP POS successfully.",
      endpoint: apiUrl,
    };
  }
}
