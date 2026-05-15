import { EventEmitter } from "events";

/**
 * SYSTEM EVENTS
 * Global event dispatcher for decoupled module communication.
 */
class AppEventEmitter extends EventEmitter {}

export const events = new AppEventEmitter();

/**
 * Standardized Event Names
 */
export const SYSTEM_EVENTS = {
  SALE: {
    CREATED: "sale:created",
    CANCELLED: "sale:cancelled",
    REFUNDED: "sale:refunded",
  },
  INVENTORY: {
    LOW_STOCK: "inventory:low_stock",
    ADJUSTED: "inventory:adjusted",
  },
  CUSTOMER: {
    CREATED: "customer:created",
    UPDATED: "customer:updated",
  },
};

/**
 * EXAMPLE USAGE:
 * events.emit(SYSTEM_EVENTS.SALE.CREATED, { saleId, totalAmount, customerEmail });
 */
