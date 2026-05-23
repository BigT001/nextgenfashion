import { prisma } from "@/services/prisma.service";
import { PaymentMethod, SaleStatus } from "@prisma/client";

interface SyncResult {
  success: boolean;
  endpoint: string;
  totalFetched: number;
  totalCreated: number;
  totalUpdated: number;
  totalSkipped: number;
  errors: string[];
}

interface TransactionSyncOutcome {
  success: boolean;
  orderNumber: string;
  action: "CREATE" | "UPDATE" | "SKIP";
  error?: string;
}

interface NormalizedTransaction {
  orderNumber: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  paymentRef?: string;
  createdAt?: Date;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  items: Array<{ variantId: string; quantity: number; price: number }>;
}

const DEFAULT_TRANSACTION_ENDPOINTS = [
  process.env.POS_TRANSACTIONS_ENDPOINT?.trim(),
  "transactions",
  "sales",
  "history",
  "pos-transactions",
].filter((path): path is string => Boolean(path));

const getString = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
};

const getNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const getDate = (value: unknown): Date | undefined => {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.valueOf())) return parsed;
  }
  return undefined;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const normalizePaymentMethod = (value: string | undefined): PaymentMethod => {
  const raw = value?.toLowerCase() ?? "";

  if (raw.includes("pos")) return PaymentMethod.POS;
  if (raw.includes("cash")) return PaymentMethod.CASH;
  if (raw.includes("transfer") || raw.includes("bank")) return PaymentMethod.TRANSFER;
  return PaymentMethod.CARD;
};

const normalizeSaleStatus = (value: string | undefined): SaleStatus => {
  const raw = value?.toLowerCase() ?? "";

  if (raw.includes("pending")) return SaleStatus.PENDING;
  if (raw.includes("cancel")) return SaleStatus.CANCELLED;
  if (raw.includes("refund")) return SaleStatus.REFUNDED;
  if (raw.includes("process")) return SaleStatus.PROCESSING;
  if (raw.includes("ship")) return SaleStatus.SHIPPED;
  return SaleStatus.COMPLETED;
};

const normalizeTransactionsResponse = (value: unknown): unknown[] | null => {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return null;

  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.transactions)) return value.transactions;
  if (Array.isArray(value.sales)) return value.sales;
  if (Array.isArray(value.items)) return value.items;
  return null;
};

const buildPosUrl = (base: string, path: string) => {
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
};

const normalizeOrderNumber = (payload: Record<string, unknown>): string | undefined => {
  const rawIdentifiers = [
    payload.order_number,
    payload.orderNumber,
    payload.transaction_id,
    payload.transactionId,
    payload.sale_id,
    payload.saleId,
    payload.id,
    payload.reference,
    payload.invoice_number,
    payload.invoiceNumber,
  ];

  const firstValue = rawIdentifiers.map(getString).find(Boolean);
  if (!firstValue) return undefined;
  const normalized = firstValue.toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9\-]/g, "");
  if (normalized.startsWith("ORD-POS") || normalized.startsWith("POS-")) return normalized;
  return `POS-${normalized}`;
};

const normalizeCustomer = (payload: Record<string, unknown>) => {
  const customer = isRecord(payload.customer) ? payload.customer : {};
  const email = getString(customer.email) ?? getString(payload.email) ?? getString(payload.customer_email) ?? getString(payload.customerEmail);
  const phone = getString(customer.phone) ?? getString(payload.phone) ?? getString(payload.customer_phone) ?? getString(payload.customerPhone);
  const name = getString(customer.name) ?? getString(payload.customer_name) ?? getString(payload.customerName) ?? getString(payload.name);

  return { email, phone, name };
};

const normalizeItem = (item: Record<string, unknown>) => {
  const itemId = getString(item.item_id) ?? getString(item.id) ?? getString(item.sku) ?? getString(item.product_id) ?? getString(item.productId);
  const barcode = getString(item.barcode) ?? getString(item.barcode_name) ?? getString(item.barcodeName);
  const sku = getString(item.sku) ?? (itemId ? `POS-ITEM-${itemId}` : undefined);

  const quantity = getNumber(item.quantity) ?? getNumber(item.qty) ?? 1;
  const price = getNumber(item.unit_price) ?? getNumber(item.price) ?? getNumber(item.amount) ?? 0;

  return {
    skuCandidates: [sku, itemId ? `POS-ITEM-${itemId}` : undefined, barcode].filter((value): value is string => Boolean(value)),
    quantity: Math.max(1, Math.round(quantity)),
    price: Math.max(0, price),
  };
};

export class SyncPosTransactionsService {
  static async execute(): Promise<SyncResult> {
    const apiUrl = process.env.POS_API_URL;
    const apiKey = process.env.POS_API_KEY;
    if (!apiUrl || !apiKey) {
      throw new Error("POS_API_URL and POS_API_KEY must both be configured to synchronize transactions.");
    }

    const candidateEndpoints = DEFAULT_TRANSACTION_ENDPOINTS;
    const workingEndpoint = await this.findWorkingEndpoint(apiUrl, apiKey, candidateEndpoints);
    const limit = 100;
    let offset = 0;
    let totalFetched = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const errors: string[] = [];
    const seenOrderNumbers = new Set<string>();

    while (true) {
      const pageUrl = `${workingEndpoint}?limit=${limit}&offset=${offset}`;
      const rawResponse = await this.fetchPage(pageUrl, apiKey);
      const transactions = normalizeTransactionsResponse(rawResponse);

      if (!transactions || transactions.length === 0) break;

      const orderNumbers = transactions
        .map((transaction) => (isRecord(transaction) ? normalizeOrderNumber(transaction) : undefined))
        .filter((order): order is string => Boolean(order));

      const allDuplicates = offset > 0 && orderNumbers.length > 0 && orderNumbers.every((order) => seenOrderNumbers.has(order));
      if (allDuplicates) break;

      for (const transaction of transactions) {
        if (!isRecord(transaction)) {
          errors.push("Skipped non-object transaction payload.");
          totalSkipped++;
          continue;
        }

        try {
          const outcome = await this.processTransaction(transaction);
          if (!outcome.success) {
            totalSkipped++;
            if (outcome.error) errors.push(`${outcome.orderNumber || "UNKNOWN"}: ${outcome.error}`);
          } else {
            totalFetched++;
            if (outcome.action === "CREATE") totalCreated++;
            if (outcome.action === "UPDATE") totalUpdated++;
          }

          if (outcome.orderNumber) seenOrderNumbers.add(outcome.orderNumber);
        } catch (error: unknown) {
          totalSkipped++;
          const message = error instanceof Error ? error.message : "Unknown transaction sync failure.";
          errors.push(message);
        }
      }

      if (transactions.length < limit) break;
      offset += limit;
    }

    return {
      success: errors.length === 0,
      endpoint: workingEndpoint,
      totalFetched,
      totalCreated,
      totalUpdated,
      totalSkipped,
      errors,
    };
  }

  static async processTransaction(payload: unknown): Promise<TransactionSyncOutcome> {
    if (!isRecord(payload)) {
      return { success: false, orderNumber: "", action: "SKIP", error: "Invalid transaction payload." };
    }

    const normalized = await this.normalizeTransactionPayload(payload);
    if (!normalized.orderNumber) {
      return { success: false, orderNumber: "", action: "SKIP", error: "Missing external order identifier." };
    }

    return this.upsertTransaction(normalized);
  }

  private static async findWorkingEndpoint(apiUrl: string, apiKey: string, candidates: string[]): Promise<string> {
    const uniqueCandidates = Array.from(new Set(candidates.map((endpoint) => endpoint.trim()).filter(Boolean)));

    for (const endpoint of uniqueCandidates) {
      const url = buildPosUrl(apiUrl, endpoint);
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
        });

        if (!response.ok) continue;
        const body = await response.json();
        const transactions = normalizeTransactionsResponse(body);
        if (transactions && transactions.length >= 0) {
          return url;
        }
      } catch {
        continue;
      }
    }

    throw new Error("Could not locate a valid POS transaction endpoint. Please configure POS_TRANSACTIONS_ENDPOINT if your PHP POS transaction path differs.");
  }

  private static async fetchPage(pageUrl: string, apiKey: string): Promise<unknown> {
    const response = await fetch(pageUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`POS transaction sync failed with status ${response.status} at ${pageUrl}`);
    }

    return await response.json();
  }

  private static async normalizeTransactionPayload(payload: Record<string, unknown>): Promise<NormalizedTransaction> {
    const orderNumber = normalizeOrderNumber(payload) ?? `POS-${Date.now().toString(36).toUpperCase()}`;
    const totalAmount = getNumber(payload.total_amount) ?? getNumber(payload.total) ?? getNumber(payload.amount) ?? getNumber(payload.grand_total) ?? 0;
    const paymentRef = getString(payload.payment_ref) ?? getString(payload.paymentRef) ?? getString(payload.transaction_id) ?? getString(payload.transactionId) ?? getString(payload.reference);
    const status = normalizeSaleStatus(getString(payload.status) ?? getString(payload.sale_status) ?? getString(payload.order_status));
    const paymentMethod = normalizePaymentMethod(getString(payload.payment_method) ?? getString(payload.method) ?? getString(payload.paymentType));
    const createdAt = getDate(payload.created_at ?? payload.createdAt ?? payload.date ?? payload.transaction_date);
    const customer = normalizeCustomer(payload);

    const lines = this.normalizeTransactionItems(payload);
    const items = await Promise.all(lines.map(async (line) => this.mapToSaleItem(line)));

    return {
      orderNumber,
      totalAmount,
      paymentMethod,
      status,
      paymentRef: paymentRef ?? undefined,
      createdAt,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerName: customer.name,
      items: items.filter((item): item is { variantId: string; quantity: number; price: number } => Boolean(item)),
    };
  }

  private static normalizeTransactionItems(payload: Record<string, unknown>): Array<Record<string, unknown>> {
    if (Array.isArray(payload.items)) return payload.items.filter(isRecord);
    if (Array.isArray(payload.line_items)) return payload.line_items.filter(isRecord);
    if (Array.isArray(payload.products)) return payload.products.filter(isRecord);
    if (Array.isArray(payload.cart)) return payload.cart.filter(isRecord);
    if (isRecord(payload.transactions) && Array.isArray(payload.transactions.items)) return payload.transactions.items.filter(isRecord);
    return [];
  }

  private static async mapToSaleItem(item: Record<string, unknown>): Promise<{ variantId: string; quantity: number; price: number } | null> {
    const { skuCandidates, quantity, price } = normalizeItem(item);
    if (skuCandidates.length === 0) return null;

    const variant = await prisma.productVariant.findFirst({
      where: {
        OR: [
          ...skuCandidates.map((sku) => ({ sku })),
          ...skuCandidates.map((barcode) => ({ barcode })),
        ],
      },
    });

    if (!variant) return null;
    return {
      variantId: variant.id,
      quantity,
      price,
    };
  }

  private static async upsertTransaction(transaction: NormalizedTransaction): Promise<TransactionSyncOutcome> {
    const customer = transaction.customerEmail || transaction.customerPhone ? await this.findOrCreateCustomer(transaction) : undefined;

    const saleData = {
      totalAmount: transaction.totalAmount,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      paymentRef: transaction.paymentRef,
      customer: customer
        ? {
            connectOrCreate: {
              where: customer.email ? { email: customer.email } : { phone: customer.phone! },
              create: {
                name: customer.name ?? "POS Customer",
                email: customer.email,
                phone: customer.phone,
              },
            },
          }
        : undefined,
      ...(transaction.items.length > 0 ? { items: { create: transaction.items } } : {}),
      ...(transaction.createdAt ? { createdAt: transaction.createdAt } : {}),
    };

    const existingSale = await prisma.sale.findUnique({
      where: { orderNumber: transaction.orderNumber },
    });

    if (existingSale) {
      await prisma.sale.update({
        where: { orderNumber: transaction.orderNumber },
        data: {
          totalAmount: transaction.totalAmount,
          status: transaction.status,
          paymentMethod: transaction.paymentMethod,
          paymentRef: transaction.paymentRef,
          customer: saleData.customer,
        },
      });

      return { success: true, orderNumber: transaction.orderNumber, action: "UPDATE" };
    }

    await prisma.sale.create({
      data: {
        orderNumber: transaction.orderNumber,
        totalAmount: transaction.totalAmount,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        paymentRef: transaction.paymentRef,
        customer: saleData.customer,
        ...(transaction.items.length > 0 ? { items: { create: transaction.items } } : {}),
        ...(transaction.createdAt ? { createdAt: transaction.createdAt } : {}),
      },
    });

    return { success: true, orderNumber: transaction.orderNumber, action: "CREATE" };
  }

  private static async findOrCreateCustomer(transaction: NormalizedTransaction) {
    if (transaction.customerEmail) {
      return await prisma.customer.upsert({
        where: { email: transaction.customerEmail },
        create: {
          name: transaction.customerName ?? "POS Customer",
          email: transaction.customerEmail,
          phone: transaction.customerPhone,
        },
        update: {
          name: transaction.customerName ?? undefined,
          phone: transaction.customerPhone ?? undefined,
        },
      });
    }

    return await prisma.customer.upsert({
      where: { phone: transaction.customerPhone! },
      create: {
        name: transaction.customerName ?? "POS Customer",
        phone: transaction.customerPhone,
      },
      update: {
        name: transaction.customerName ?? undefined,
      },
    });
  }
}
