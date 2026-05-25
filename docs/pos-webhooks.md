# POS Webhooks

This document describes the POS webhook integration contract for NextGen Fashion OS.

## Endpoint Overview

- `POST /api/webhooks/pos`
  - General POS webhook receiver.
  - Handles product sync, stock sync, and transaction sync.
- `POST /api/webhooks/pos/transactions`
  - Dedicated transaction webhook endpoint.
  - Use this for PHP POS sale/export webhooks that publish completed transactions.

## Security

All POS webhook requests must include the shared secret header:

- Header: `x-pos-webhook-secret`
- Value: `POS_WEBHOOK_SECRET`

In production, requests without a matching secret are rejected with `401 Unauthorized`.

## Supported Transaction Payloads

The dedicated transaction endpoint accepts either:

- A single transaction object
- An array of transaction objects

A valid transaction payload should include one of these identifiers:

- `order_number`
- `orderNumber`
- `transaction_id`
- `transactionId`
- `invoice_number`
- `invoiceNumber`

And a list of items in any of these fields:

- `items`
- `line_items`
- `products`
- `cart`

### Example transaction payload

```json
{
  "order_number": "POS-12345",
  "total_amount": 175.50,
  "status": "COMPLETED",
  "payment_method": "CASH",
  "payment_ref": "CASH-001",
  "created_at": "2026-05-24T12:34:56Z",
  "customer": {
    "email": "jane.doe@example.com",
    "phone": "+15551234567",
    "name": "Jane Doe"
  },
  "items": [
    {
      "sku": "SKU-001",
      "quantity": 2,
      "price": 45.00
    },
    {
      "sku": "SKU-002",
      "quantity": 1,
      "price": 85.50
    }
  ]
}
```

## Supported Product / Item Payloads

The general POS webhook endpoint accepts product/item updates from PHP POS in the same request body or as an array of item objects.

A typical product payload should include:

- `item_id` (required)
- `name`
- `description` or `long_description`
- `category` or `category_name`
- `unit_price`, `price`, or `selling_price`
- `cost_price`
- `quantity`, `stock`, or `locations`
- `item_number`, `barcode_name`, or `barcode`
- `size`, `variant_size`
- `color`
- image fields: `image`, `image_url`, `thumbnail`, `images`, `photos`, `media`

### Example product payload

```json
{
  "item_id": "12345",
  "name": "Denim Jacket",
  "description": "Premium denim jacket with washed finish.",
  "category": "Outerwear",
  "unit_price": 85.00,
  "cost_price": 45.00,
  "stock": 18,
  "item_number": "DJ-001",
  "barcode": "123456789012",
  "size": "M",
  "color": "Blue",
  "image_url": "https://php-pos.example.com/images/products/12345.jpg"
}
```

## PHP POS Webhook Settings

Configure these webhooks in PHP POS for full automatic sync:

- `New Item Web Hook URL` → `https://nextgenkiddies.com/api/webhooks/pos`
- `Edit Item Web Hook URL` → `https://nextgenkiddies.com/api/webhooks/pos`
- `New Sale Web Hook URL` → `https://nextgenkiddies.com/api/webhooks/pos/transactions`
- `Edit Sale Web Hook URL` → `https://nextgenkiddies.com/api/webhooks/pos/transactions`
- `New Receiving Web Hook URL` → `https://nextgenkiddies.com/api/webhooks/pos` (optional, for stock receipt updates)

> If PHP POS cannot set a custom header, update these webhook URLs to include the shared secret as a query parameter.

Example with secret fallback:

- `New Item Web Hook URL` → `https://nextgenkiddies.com/api/webhooks/pos?secret=-XqbOe-x_zOSnqzzGwoRAKs9HIaYV3kaO2805Gk3ShFbwuC7DvULD5MTknskIhY9`
- `Edit Item Web Hook URL` → `https://nextgenkiddies.com/api/webhooks/pos?secret=-XqbOe-x_zOSnqzzGwoRAKs9HIaYV3kaO2805Gk3ShFbwuC7DvULD5MTknskIhY9`
- `New Sale Web Hook URL` → `https://nextgenkiddies.com/api/webhooks/pos/transactions?secret=-XqbOe-x_zOSnqzzGwoRAKs9HIaYV3kaO2805Gk3ShFbwuC7DvULD5MTknskIhY9`
- `Edit Sale Web Hook URL` → `https://nextgenkiddies.com/api/webhooks/pos/transactions?secret=-XqbOe-x_zOSnqzzGwoRAKs9HIaYV3kaO2805Gk3ShFbwuC7DvULD5MTknskIhY9`
- `New Receiving Web Hook URL` → `https://nextgenkiddies.com/api/webhooks/pos?secret=-XqbOe-x_zOSnqzzGwoRAKs9HIaYV3kaO2805Gk3ShFbwuC7DvULD5MTknskIhY9`

## Copy / Paste Webhook URLs

Use these exact URLs in PHP POS if headers are not configurable:

- New Item Web Hook URL:
  `https://nextgenkiddies.com/api/webhooks/pos?secret=-XqbOe-x_zOSnqzzGwoRAKs9HIaYV3kaO2805Gk3ShFbwuC7DvULD5MTknskIhY9`
- Edit Item Web Hook URL:
  `https://nextgenkiddies.com/api/webhooks/pos?secret=-XqbOe-x_zOSnqzzGwoRAKs9HIaYV3kaO2805Gk3ShFbwuC7DvULD5MTknskIhY9`
- New Sale Web Hook URL:
  `https://nextgenkiddies.com/api/webhooks/pos/transactions?secret=-XqbOe-x_zOSnqzzGwoRAKs9HIaYV3kaO2805Gk3ShFbwuC7DvULD5MTknskIhY9`
- Edit Sale Web Hook URL:
  `https://nextgenkiddies.com/api/webhooks/pos/transactions?secret=-XqbOe-x_zOSnqzzGwoRAKs9HIaYV3kaO2805Gk3ShFbwuC7DvULD5MTknskIhY9`
- New Receiving Web Hook URL:
  `https://nextgenkiddies.com/api/webhooks/pos?secret=-XqbOe-x_zOSnqzzGwoRAKs9HIaYV3kaO2805Gk3ShFbwuC7DvULD5MTknskIhY9`

### Recommended webhook payload behavior

- Use `POST /api/webhooks/pos` for product/item and stock updates.
- Use `POST /api/webhooks/pos/transactions` for sale and transaction events.
- Include the `x-pos-webhook-secret` header with each request when possible.
- If PHP POS cannot set headers, use query string `?secret=YOUR_SECRET` on the webhook URL instead.
- If your POS sends arrays of objects, both endpoints handle that automatically.

## Behavior

- Creates or updates the local sale record based on `order_number`.
- Finds or creates the associated customer by email or phone.
- Decrements local inventory for each imported sale item.
- If the sale already exists, inventory changes are applied relative to the previous item quantities.

## Environment Variables

- `POS_WEBHOOK_SECRET`
- `POS_API_URL` (for outbound POS pushes)
- `POS_API_KEY` (for outbound POS pushes)
- `POS_TRANSACTIONS_ENDPOINT` (optional custom transaction endpoint path)

## Integration Tips

- Prefer `POST /api/webhooks/pos/transactions` for sale-only webhooks.
- Use `POST /api/webhooks/pos` when sending mixed payloads including product and stock updates.
- Keep the webhook secret confidential and rotate it if exposed.
