/*
 * GENERATED from Perly Pay's OpenAPI document (src/services/api/openapi.ts,
 * served at /api/v1/openapi.json) by packages/mcp/src/generate.ts. Do not edit.
 * After the API or src/curation.ts changes, regenerate:
 *
 *   npx vitest run packages/mcp/src/operations.drift.test.ts -u
 */
import type { Operation } from "./generate.js";

export const OPERATIONS: readonly Operation[] = [
  {
    "operationId": "listInvoices",
    "tool": "list_invoices",
    "method": "GET",
    "path": "/invoices",
    "summary": "List invoices",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [
      "limit",
      "cursor",
      "status",
      "customer",
      "subscription"
    ],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "limit": {
          "default": 10,
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "How many objects to return, 1–100. Default 10."
        },
        "cursor": {
          "type": "string",
          "minLength": 1,
          "maxLength": 300,
          "description": "`next_cursor` from the previous page."
        },
        "status": {
          "type": "string",
          "enum": [
            "open",
            "seen",
            "underpaid",
            "paid",
            "overpaid",
            "review",
            "expired",
            "canceled",
            "refunded",
            "partially_refunded"
          ]
        },
        "customer": {
          "type": "string",
          "maxLength": 80,
          "description": "A customer id, `cus_…`."
        },
        "subscription": {
          "type": "string",
          "maxLength": 80,
          "description": "A subscription id, `sub_…`."
        }
      },
      "additionalProperties": false
    }
  },
  {
    "operationId": "createInvoice",
    "tool": "create_invoice",
    "method": "POST",
    "path": "/invoices",
    "summary": "Create an invoice",
    "description": "Lines are prices (`{ price, quantity }`) or your own (`{ description, amount, quantity }`), in one currency. For a single amount, `amount` + `description` is short for one line. `customer` is an id or `{ email }`. A price line may carry its own `description` (\"Seat #12\"), and `discount` takes an amount off this invoice alone. The buyer pays at `url`, choosing bitcoin or a stablecoin there. Live mode: once a calendar month's paid sales pass the plan's limit and its 10% buffer, a new invoice is refused with 403 `plan_limit_reached` until the plan moves up; invoices already made are still paid.",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [],
    "bodyParams": [
      "line_items",
      "amount",
      "description",
      "currency",
      "customer",
      "customer_email",
      "coupon",
      "discount",
      "subscription",
      "return_url",
      "expires_in_minutes",
      "locale",
      "metadata"
    ],
    "hasBody": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "line_items": {
          "minItems": 1,
          "maxItems": 50,
          "type": "array",
          "items": {
            "anyOf": [
              {
                "type": "object",
                "properties": {
                  "price": {
                    "description": "A price id, `price_…`.",
                    "type": "string",
                    "maxLength": 80
                  },
                  "quantity": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 100000
                  },
                  "custom_amount": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 100000000000,
                    "description": "Pay-what-you-want: the amount per unit in minor units (cents), an integer."
                  },
                  "description": {
                    "description": "Default: the product's name.",
                    "type": "string",
                    "minLength": 1,
                    "maxLength": 300
                  }
                },
                "required": [
                  "price"
                ],
                "additionalProperties": false
              },
              {
                "type": "object",
                "properties": {
                  "description": {
                    "type": "string",
                    "minLength": 1,
                    "maxLength": 300
                  },
                  "amount": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 100000000000,
                    "description": "Price per unit in minor units (cents), an integer."
                  },
                  "quantity": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 100000
                  }
                },
                "required": [
                  "description",
                  "amount"
                ],
                "additionalProperties": false
              }
            ]
          }
        },
        "amount": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100000000000,
          "description": "One amount instead of line_items in minor units (cents), an integer."
        },
        "description": {
          "description": "With `amount`: what it is for.",
          "type": "string",
          "minLength": 1,
          "maxLength": 300
        },
        "currency": {
          "description": "For lines without a price. Default: your account's currency.",
          "type": "string",
          "enum": [
            "USD",
            "EUR"
          ]
        },
        "customer": {
          "description": "A customer id, or `{ email }` to find or make one.",
          "anyOf": [
            {
              "description": "A customer id, `cus_…`.",
              "type": "string",
              "maxLength": 80
            },
            {
              "type": "object",
              "properties": {
                "email": {
                  "type": "string",
                  "maxLength": 254,
                  "format": "email",
                  "pattern": "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$"
                }
              },
              "required": [
                "email"
              ],
              "additionalProperties": false
            }
          ]
        },
        "customer_email": {
          "description": "Without `customer`: finds or makes the customer by email.",
          "type": "string",
          "maxLength": 254,
          "format": "email",
          "pattern": "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$"
        },
        "coupon": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_-]{3,40}$"
        },
        "discount": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100000000000,
          "description": "A one-off amount off this invoice (a credit you owe the buyer; not with `coupon`) in minor units (cents), an integer."
        },
        "subscription": {
          "description": "A subscription id, `sub_…`.",
          "type": "string",
          "maxLength": 80
        },
        "return_url": {
          "description": "Where the buyer's page sends them back.",
          "type": "string",
          "maxLength": 2000,
          "format": "uri"
        },
        "expires_in_minutes": {
          "description": "Until when a rail may be chosen.",
          "type": "integer",
          "minimum": 30,
          "maximum": 129600
        },
        "locale": {
          "type": "string",
          "pattern": "^[a-z]{2}$"
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string",
            "minLength": 1,
            "maxLength": 40
          },
          "additionalProperties": {
            "type": "string",
            "maxLength": 500
          },
          "description": "Your own key–value pairs (≤ 50 keys, values ≤ 500 characters). On an update they are merged in; an empty value removes its key."
        }
      },
      "additionalProperties": false
    }
  },
  {
    "operationId": "retrieveInvoice",
    "tool": "retrieve_invoice",
    "method": "GET",
    "path": "/invoices/{id}",
    "summary": "Retrieve an invoice",
    "testOnly": false,
    "pathParams": [
      "id"
    ],
    "queryParams": [],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "The object's id."
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": false
    }
  },
  {
    "operationId": "cancelInvoice",
    "tool": "cancel_invoice",
    "method": "POST",
    "path": "/invoices/{id}/cancel",
    "summary": "Cancel an invoice",
    "description": "Only while nothing has arrived. Money that arrives later is still seen (the address stays watched) and lands in review.",
    "testOnly": false,
    "pathParams": [
      "id"
    ],
    "queryParams": [],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "The object's id."
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": false
    }
  },
  {
    "operationId": "simulatePayment",
    "tool": "simulate_payment",
    "method": "POST",
    "path": "/invoices/{id}/simulate",
    "summary": "Simulate a payment (test mode only)",
    "description": "Test keys only. `full` pays the amount due: the invoice turns paid and is fulfilled — entitlements, license keys, a receipt, and the events your webhooks get. `short` sends half (underpaid), `over` a tenth more (overpaid); those two need the buyer's chain and asset chosen first. For `full`, an invoice with no chain yet gets one: `chain` and `asset` if given, else the first stablecoin offered (refund terms count as accepted).",
    "testOnly": true,
    "pathParams": [
      "id"
    ],
    "queryParams": [],
    "bodyParams": [
      "outcome",
      "chain",
      "asset"
    ],
    "hasBody": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "The object's id."
        },
        "outcome": {
          "description": "Default full.",
          "type": "string",
          "enum": [
            "full",
            "short",
            "over"
          ]
        },
        "chain": {
          "type": "string",
          "maxLength": 40
        },
        "asset": {
          "type": "string",
          "enum": [
            "BTC",
            "USDC",
            "USDT"
          ]
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": false
    }
  },
  {
    "operationId": "createCheckoutSession",
    "tool": "create_checkout_session",
    "method": "POST",
    "path": "/checkout_sessions",
    "summary": "Create a checkout session",
    "description": "A cart of 1–20 prices in one currency. Send the buyer to `url`, or open it in an overlay with pay.js (`data-session=\"cs_…\"`). The buyer comes back to `return_url` after paying, `cancel_url` if they leave. Live mode: once a calendar month's paid sales pass the plan's limit and its 10% buffer, a new session is refused with 403 `plan_limit_reached` until the plan moves up.",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [],
    "bodyParams": [
      "line_items",
      "return_url",
      "cancel_url",
      "customer",
      "customer_email",
      "coupon",
      "expires_in_minutes",
      "metadata"
    ],
    "hasBody": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "line_items": {
          "minItems": 1,
          "maxItems": 20,
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "price": {
                "description": "A price id, `price_…`.",
                "type": "string",
                "maxLength": 80
              },
              "quantity": {
                "type": "integer",
                "minimum": 1,
                "maximum": 1000
              },
              "custom_amount": {
                "type": "integer",
                "minimum": 1,
                "maximum": 100000000000,
                "description": "Pay-what-you-want: the amount per unit in minor units (cents), an integer."
              }
            },
            "required": [
              "price"
            ],
            "additionalProperties": false
          }
        },
        "return_url": {
          "type": "string",
          "maxLength": 2000,
          "format": "uri",
          "description": "An http(s) URL."
        },
        "cancel_url": {
          "type": "string",
          "maxLength": 2000,
          "format": "uri",
          "description": "An http(s) URL."
        },
        "customer": {
          "description": "A customer id, `cus_…`.",
          "type": "string",
          "maxLength": 80
        },
        "customer_email": {
          "type": "string",
          "maxLength": 254,
          "format": "email",
          "pattern": "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$"
        },
        "coupon": {
          "description": "A coupon code.",
          "type": "string",
          "pattern": "^[A-Za-z0-9_-]{3,40}$"
        },
        "expires_in_minutes": {
          "description": "Default 1440 (24 hours).",
          "type": "integer",
          "minimum": 30,
          "maximum": 1440
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string",
            "minLength": 1,
            "maxLength": 40
          },
          "additionalProperties": {
            "type": "string",
            "maxLength": 500
          },
          "description": "Your own key–value pairs (≤ 50 keys, values ≤ 500 characters). On an update they are merged in; an empty value removes its key."
        }
      },
      "required": [
        "line_items"
      ],
      "additionalProperties": false
    }
  },
  {
    "operationId": "retrieveCheckoutSession",
    "tool": "retrieve_checkout_session",
    "method": "GET",
    "path": "/checkout_sessions/{id}",
    "summary": "Retrieve a checkout session",
    "testOnly": false,
    "pathParams": [
      "id"
    ],
    "queryParams": [],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "The object's id."
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": false
    }
  },
  {
    "operationId": "listProducts",
    "tool": "list_products",
    "method": "GET",
    "path": "/products",
    "summary": "List products",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [
      "limit",
      "cursor",
      "active"
    ],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "limit": {
          "default": 10,
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "How many objects to return, 1–100. Default 10."
        },
        "cursor": {
          "type": "string",
          "minLength": 1,
          "maxLength": 300,
          "description": "`next_cursor` from the previous page."
        },
        "active": {
          "type": "string",
          "enum": [
            "true",
            "false"
          ]
        }
      },
      "additionalProperties": false
    }
  },
  {
    "operationId": "createProduct",
    "tool": "create_product",
    "method": "POST",
    "path": "/products",
    "summary": "Create a product",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [],
    "bodyParams": [
      "name",
      "description",
      "image_url",
      "issues_license",
      "license_activation_limit",
      "active",
      "metadata"
    ],
    "hasBody": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 120
        },
        "description": {
          "type": "string",
          "maxLength": 2000
        },
        "image_url": {
          "type": "string",
          "maxLength": 2000,
          "format": "uri"
        },
        "issues_license": {
          "description": "Issue a license key with every purchase.",
          "type": "boolean"
        },
        "license_activation_limit": {
          "description": "Instances a key may be active on.",
          "type": "integer",
          "minimum": 1,
          "maximum": 10000
        },
        "active": {
          "type": "boolean"
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string",
            "minLength": 1,
            "maxLength": 40
          },
          "additionalProperties": {
            "type": "string",
            "maxLength": 500
          },
          "description": "Your own key–value pairs (≤ 50 keys, values ≤ 500 characters). On an update they are merged in; an empty value removes its key."
        }
      },
      "required": [
        "name"
      ],
      "additionalProperties": false
    }
  },
  {
    "operationId": "updateProduct",
    "tool": "update_product",
    "method": "POST",
    "path": "/products/{id}",
    "summary": "Update a product",
    "description": "Set `active: false` to stop selling it; products are never deleted (invoices point at them).",
    "testOnly": false,
    "pathParams": [
      "id"
    ],
    "queryParams": [],
    "bodyParams": [
      "name",
      "description",
      "image_url",
      "issues_license",
      "license_activation_limit",
      "active",
      "metadata"
    ],
    "hasBody": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "The object's id."
        },
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 120
        },
        "description": {
          "anyOf": [
            {
              "type": "string",
              "maxLength": 2000
            },
            {
              "type": "null"
            }
          ]
        },
        "image_url": {
          "anyOf": [
            {
              "type": "string",
              "maxLength": 2000,
              "format": "uri"
            },
            {
              "type": "null"
            }
          ]
        },
        "issues_license": {
          "description": "Issue a license key with every purchase.",
          "type": "boolean"
        },
        "license_activation_limit": {
          "anyOf": [
            {
              "description": "Instances a key may be active on.",
              "type": "integer",
              "minimum": 1,
              "maximum": 10000
            },
            {
              "type": "null"
            }
          ]
        },
        "active": {
          "type": "boolean"
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string",
            "minLength": 1,
            "maxLength": 40
          },
          "additionalProperties": {
            "type": "string",
            "maxLength": 500
          },
          "description": "Your own key–value pairs (≤ 50 keys, values ≤ 500 characters). On an update they are merged in; an empty value removes its key."
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": false
    }
  },
  {
    "operationId": "listPrices",
    "tool": "list_prices",
    "method": "GET",
    "path": "/prices",
    "summary": "List prices",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [
      "limit",
      "cursor",
      "product",
      "model",
      "active"
    ],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "limit": {
          "default": 10,
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "How many objects to return, 1–100. Default 10."
        },
        "cursor": {
          "type": "string",
          "minLength": 1,
          "maxLength": 300,
          "description": "`next_cursor` from the previous page."
        },
        "product": {
          "type": "string",
          "maxLength": 80,
          "description": "A product id, `prod_…`."
        },
        "model": {
          "type": "string",
          "enum": [
            "one_time",
            "pay_what_you_want",
            "fixed_term",
            "subscription",
            "lifetime",
            "credit_pack"
          ]
        },
        "active": {
          "type": "string",
          "enum": [
            "true",
            "false"
          ]
        }
      },
      "additionalProperties": false
    }
  },
  {
    "operationId": "createPrice",
    "tool": "create_price",
    "method": "POST",
    "path": "/prices",
    "summary": "Create a price",
    "description": "Every model: one_time, pay_what_you_want (with a minimum), fixed_term (N days of access), subscription (interval, trial, grace, prepay), lifetime (optional cap and cohort tiers), credit_pack. Amounts are immutable; make a new price to change one.\n\nBody is one of: model = one_time: needs product, model, unit_amount; model = pay_what_you_want: needs product, model, custom_amount; model = fixed_term: needs product, model, unit_amount, term_days; model = subscription: needs product, model, unit_amount, recurring; model = lifetime: needs product, model; model = credit_pack: needs product, model, unit_amount, credits.",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [],
    "bodyParams": [
      "product",
      "currency",
      "nickname",
      "refunds",
      "metadata",
      "model",
      "unit_amount",
      "custom_amount",
      "term_days",
      "recurring",
      "lifetime",
      "credits"
    ],
    "hasBody": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "product": {
          "description": "A product id, `prod_…`.",
          "type": "string",
          "maxLength": 80
        },
        "currency": {
          "description": "USD or EUR. Default: your account's currency.",
          "type": "string",
          "enum": [
            "USD",
            "EUR"
          ]
        },
        "nickname": {
          "type": "string",
          "minLength": 1,
          "maxLength": 60
        },
        "refunds": {
          "type": "object",
          "properties": {
            "allowed": {
              "type": "boolean"
            },
            "window_days": {
              "description": "Null or absent: no limit.",
              "anyOf": [
                {
                  "type": "integer",
                  "minimum": 1,
                  "maximum": 3650
                },
                {
                  "type": "null"
                }
              ]
            },
            "network_fee_payer": {
              "description": "`buyer` (default): the network fee comes out of the refund. `merchant`: you pay it.",
              "type": "string",
              "enum": [
                "buyer",
                "merchant"
              ]
            }
          },
          "required": [
            "allowed"
          ],
          "additionalProperties": false,
          "description": "Refund terms the buyer accepts at checkout."
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string",
            "minLength": 1,
            "maxLength": 40
          },
          "additionalProperties": {
            "type": "string",
            "maxLength": 500
          },
          "description": "Your own key–value pairs (≤ 50 keys, values ≤ 500 characters). On an update they are merged in; an empty value removes its key."
        },
        "model": {
          "type": "string",
          "enum": [
            "one_time",
            "pay_what_you_want",
            "fixed_term",
            "subscription",
            "lifetime",
            "credit_pack"
          ]
        },
        "unit_amount": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": 1,
              "maximum": 100000000000,
              "description": "Amount in minor units (cents), an integer."
            },
            {
              "type": "integer",
              "minimum": 1,
              "maximum": 100000000000,
              "description": "Price per period in minor units (cents), an integer."
            },
            {
              "description": "One price for every seat — or give `lifetime.tiers`.",
              "type": "integer",
              "minimum": 1,
              "maximum": 100000000000
            }
          ]
        },
        "custom_amount": {
          "type": "object",
          "properties": {
            "minimum": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100000000000,
              "description": "The least a buyer may pay in minor units (cents), an integer."
            },
            "suggested": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100000000000,
              "description": "Shown first in minor units (cents), an integer."
            }
          },
          "required": [
            "minimum"
          ],
          "additionalProperties": false
        },
        "term_days": {
          "type": "integer",
          "minimum": 1,
          "maximum": 3650,
          "description": "Days of access one purchase gives."
        },
        "recurring": {
          "type": "object",
          "properties": {
            "interval": {
              "type": "string",
              "enum": [
                "day",
                "week",
                "month",
                "quarter",
                "year",
                "custom_days"
              ]
            },
            "interval_days": {
              "description": "Days per period, with interval `custom_days`.",
              "type": "integer",
              "minimum": 1,
              "maximum": 3650
            },
            "trial_days": {
              "type": "integer",
              "minimum": 0,
              "maximum": 365
            },
            "grace_days": {
              "description": "Days after the period ends before access stops. Default 3.",
              "type": "integer",
              "minimum": 0,
              "maximum": 60
            },
            "prepay_max_periods": {
              "description": "How many periods a buyer may pay ahead.",
              "type": "integer",
              "minimum": 1,
              "maximum": 36
            },
            "keep_renewal_price": {
              "description": "A renewal keeps the price first paid. Default true.",
              "type": "boolean"
            }
          },
          "required": [
            "interval"
          ],
          "additionalProperties": false
        },
        "lifetime": {
          "type": "object",
          "properties": {
            "quantity_cap": {
              "description": "How many are ever sold.",
              "type": "integer",
              "minimum": 1,
              "maximum": 10000000
            },
            "tiers": {
              "description": "Cohorts in order: the first `seats` sell at the first price…",
              "minItems": 1,
              "maxItems": 10,
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string",
                    "minLength": 1,
                    "maxLength": 40
                  },
                  "seats": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 1000000
                  },
                  "unit_amount": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 100000000000,
                    "description": "Price per seat in minor units (cents), an integer."
                  }
                },
                "required": [
                  "name",
                  "seats",
                  "unit_amount"
                ],
                "additionalProperties": false
              }
            }
          },
          "additionalProperties": false
        },
        "credits": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100000000,
          "description": "Credits one pack holds."
        }
      },
      "required": [
        "product",
        "model"
      ],
      "additionalProperties": false
    }
  },
  {
    "operationId": "updatePrice",
    "tool": "update_price",
    "method": "POST",
    "path": "/prices/{id}",
    "summary": "Update a price",
    "description": "Nickname, active, refund terms (`refunds` replaces them whole; what you leave out takes its default) and metadata. Amounts and the model never change.",
    "testOnly": false,
    "pathParams": [
      "id"
    ],
    "queryParams": [],
    "bodyParams": [
      "nickname",
      "active",
      "refunds",
      "metadata"
    ],
    "hasBody": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "The object's id."
        },
        "nickname": {
          "anyOf": [
            {
              "type": "string",
              "minLength": 1,
              "maxLength": 60
            },
            {
              "type": "null"
            }
          ]
        },
        "active": {
          "type": "boolean"
        },
        "refunds": {
          "type": "object",
          "properties": {
            "allowed": {
              "type": "boolean"
            },
            "window_days": {
              "description": "Null or absent: no limit.",
              "anyOf": [
                {
                  "type": "integer",
                  "minimum": 1,
                  "maximum": 3650
                },
                {
                  "type": "null"
                }
              ]
            },
            "network_fee_payer": {
              "description": "`buyer` (default): the network fee comes out of the refund. `merchant`: you pay it.",
              "type": "string",
              "enum": [
                "buyer",
                "merchant"
              ]
            }
          },
          "required": [
            "allowed"
          ],
          "additionalProperties": false,
          "description": "Refund terms the buyer accepts at checkout."
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string",
            "minLength": 1,
            "maxLength": 40
          },
          "additionalProperties": {
            "type": "string",
            "maxLength": 500
          },
          "description": "Your own key–value pairs (≤ 50 keys, values ≤ 500 characters). On an update they are merged in; an empty value removes its key."
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": false
    }
  },
  {
    "operationId": "listCustomers",
    "tool": "list_customers",
    "method": "GET",
    "path": "/customers",
    "summary": "List customers",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [
      "limit",
      "cursor",
      "email",
      "external_id"
    ],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "limit": {
          "default": 10,
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "How many objects to return, 1–100. Default 10."
        },
        "cursor": {
          "type": "string",
          "minLength": 1,
          "maxLength": 300,
          "description": "`next_cursor` from the previous page."
        },
        "email": {
          "type": "string",
          "maxLength": 254,
          "format": "email",
          "pattern": "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$"
        },
        "external_id": {
          "type": "string",
          "maxLength": 120
        }
      },
      "additionalProperties": false
    }
  },
  {
    "operationId": "createCustomer",
    "tool": "create_customer",
    "method": "POST",
    "path": "/customers",
    "summary": "Create a customer",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [],
    "bodyParams": [
      "email",
      "name",
      "external_id",
      "country",
      "locale",
      "metadata"
    ],
    "hasBody": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "email": {
          "type": "string",
          "maxLength": 254,
          "format": "email",
          "pattern": "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$"
        },
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 120
        },
        "external_id": {
          "description": "Your own id for this buyer (unique).",
          "type": "string",
          "minLength": 1,
          "maxLength": 120
        },
        "country": {
          "description": "ISO 3166-1 alpha-2.",
          "type": "string",
          "pattern": "^[A-Z]{2}$"
        },
        "locale": {
          "type": "string",
          "pattern": "^[a-z]{2}$"
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string",
            "minLength": 1,
            "maxLength": 40
          },
          "additionalProperties": {
            "type": "string",
            "maxLength": 500
          },
          "description": "Your own key–value pairs (≤ 50 keys, values ≤ 500 characters). On an update they are merged in; an empty value removes its key."
        }
      },
      "additionalProperties": false
    }
  },
  {
    "operationId": "retrieveCustomer",
    "tool": "retrieve_customer",
    "method": "GET",
    "path": "/customers/{id}",
    "summary": "Retrieve a customer",
    "testOnly": false,
    "pathParams": [
      "id"
    ],
    "queryParams": [],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "The object's id."
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": false
    }
  },
  {
    "operationId": "listSubscriptions",
    "tool": "list_subscriptions",
    "method": "GET",
    "path": "/subscriptions",
    "summary": "List subscriptions",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [
      "limit",
      "cursor",
      "status",
      "customer",
      "price"
    ],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "limit": {
          "default": 10,
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "How many objects to return, 1–100. Default 10."
        },
        "cursor": {
          "type": "string",
          "minLength": 1,
          "maxLength": 300,
          "description": "`next_cursor` from the previous page."
        },
        "status": {
          "type": "string",
          "enum": [
            "trialing",
            "active",
            "past_due",
            "unpaid",
            "paused",
            "canceled",
            "ended"
          ]
        },
        "customer": {
          "type": "string",
          "maxLength": 80,
          "description": "A customer id, `cus_…`."
        },
        "price": {
          "type": "string",
          "maxLength": 80,
          "description": "A price id, `price_…`."
        }
      },
      "additionalProperties": false
    }
  },
  {
    "operationId": "createSubscription",
    "tool": "create_subscription",
    "method": "POST",
    "path": "/subscriptions",
    "summary": "Create a subscription",
    "description": "Renewed by invoice: the customer pays each period themselves. Without a trial the first invoice opens now (`latest_invoice`); the subscription turns active when it is paid.",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [],
    "bodyParams": [
      "customer",
      "price",
      "quantity",
      "coupon",
      "trial_days",
      "metadata"
    ],
    "hasBody": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "customer": {
          "description": "A customer id, `cus_…`.",
          "type": "string",
          "maxLength": 80
        },
        "price": {
          "description": "A subscription price.",
          "type": "string",
          "maxLength": 80
        },
        "quantity": {
          "type": "integer",
          "minimum": 1,
          "maximum": 1000
        },
        "coupon": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_-]{3,40}$"
        },
        "trial_days": {
          "description": "Default: the price's.",
          "type": "integer",
          "minimum": 0,
          "maximum": 365
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string",
            "minLength": 1,
            "maxLength": 40
          },
          "additionalProperties": {
            "type": "string",
            "maxLength": 500
          },
          "description": "Your own key–value pairs (≤ 50 keys, values ≤ 500 characters). On an update they are merged in; an empty value removes its key."
        }
      },
      "required": [
        "customer",
        "price"
      ],
      "additionalProperties": false
    }
  },
  {
    "operationId": "retrieveSubscription",
    "tool": "retrieve_subscription",
    "method": "GET",
    "path": "/subscriptions/{id}",
    "summary": "Retrieve a subscription",
    "testOnly": false,
    "pathParams": [
      "id"
    ],
    "queryParams": [],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "The object's id."
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": false
    }
  },
  {
    "operationId": "listPaymentLinks",
    "tool": "list_payment_links",
    "method": "GET",
    "path": "/payment_links",
    "summary": "List payment links",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [
      "limit",
      "cursor",
      "active",
      "price"
    ],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "limit": {
          "default": 10,
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "How many objects to return, 1–100. Default 10."
        },
        "cursor": {
          "type": "string",
          "minLength": 1,
          "maxLength": 300,
          "description": "`next_cursor` from the previous page."
        },
        "active": {
          "type": "string",
          "enum": [
            "true",
            "false"
          ]
        },
        "price": {
          "type": "string",
          "maxLength": 80,
          "description": "A price id, `price_…`."
        }
      },
      "additionalProperties": false
    }
  },
  {
    "operationId": "createPaymentLink",
    "tool": "create_payment_link",
    "method": "POST",
    "path": "/payment_links",
    "summary": "Create a payment link",
    "description": "A page at /l/<slug> that sells one price. Share it anywhere, or open it with pay.js.",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [],
    "bodyParams": [
      "price",
      "quantity",
      "adjustable_quantity",
      "allow_coupons",
      "collect_name",
      "success_url",
      "slug",
      "metadata"
    ],
    "hasBody": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "price": {
          "description": "A price id, `price_…`.",
          "type": "string",
          "maxLength": 80
        },
        "quantity": {
          "type": "integer",
          "minimum": 1,
          "maximum": 1000
        },
        "adjustable_quantity": {
          "type": "boolean"
        },
        "allow_coupons": {
          "type": "boolean"
        },
        "collect_name": {
          "type": "boolean"
        },
        "success_url": {
          "description": "Where the buyer goes after paying.",
          "type": "string",
          "maxLength": 2000,
          "format": "uri"
        },
        "slug": {
          "description": "Default: random.",
          "type": "string",
          "pattern": "^[A-Za-z0-9_-]{6,64}$"
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string",
            "minLength": 1,
            "maxLength": 40
          },
          "additionalProperties": {
            "type": "string",
            "maxLength": 500
          },
          "description": "Your own key–value pairs (≤ 50 keys, values ≤ 500 characters). On an update they are merged in; an empty value removes its key."
        }
      },
      "required": [
        "price"
      ],
      "additionalProperties": false
    }
  },
  {
    "operationId": "updatePaymentLink",
    "tool": "update_payment_link",
    "method": "POST",
    "path": "/payment_links/{id}",
    "summary": "Update a payment link",
    "testOnly": false,
    "pathParams": [
      "id"
    ],
    "queryParams": [],
    "bodyParams": [
      "active",
      "quantity",
      "adjustable_quantity",
      "allow_coupons",
      "collect_name",
      "success_url",
      "metadata"
    ],
    "hasBody": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "The object's id."
        },
        "active": {
          "type": "boolean"
        },
        "quantity": {
          "type": "integer",
          "minimum": 1,
          "maximum": 1000
        },
        "adjustable_quantity": {
          "type": "boolean"
        },
        "allow_coupons": {
          "type": "boolean"
        },
        "collect_name": {
          "type": "boolean"
        },
        "success_url": {
          "anyOf": [
            {
              "type": "string",
              "maxLength": 2000,
              "format": "uri",
              "description": "An http(s) URL."
            },
            {
              "type": "null"
            }
          ]
        },
        "metadata": {
          "type": "object",
          "propertyNames": {
            "type": "string",
            "minLength": 1,
            "maxLength": 40
          },
          "additionalProperties": {
            "type": "string",
            "maxLength": 500
          },
          "description": "Your own key–value pairs (≤ 50 keys, values ≤ 500 characters). On an update they are merged in; an empty value removes its key."
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": false
    }
  },
  {
    "operationId": "checkEntitlement",
    "tool": "check_entitlement",
    "method": "GET",
    "path": "/entitlements/check",
    "summary": "Check access",
    "description": "One call: may this customer use this product now? Name the customer by `customer`, `customer_email` or `customer_external_id`, and the product by `product` (or `price`).",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [
      "customer",
      "customer_email",
      "customer_external_id",
      "product",
      "price"
    ],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "customer": {
          "type": "string",
          "maxLength": 80,
          "description": "A customer id, `cus_…`."
        },
        "customer_email": {
          "type": "string",
          "maxLength": 254,
          "format": "email",
          "pattern": "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$"
        },
        "customer_external_id": {
          "type": "string",
          "minLength": 1,
          "maxLength": 120
        },
        "product": {
          "type": "string",
          "maxLength": 80,
          "description": "A product id, `prod_…`."
        },
        "price": {
          "type": "string",
          "maxLength": 80,
          "description": "A price id, `price_…`."
        }
      },
      "additionalProperties": false
    }
  },
  {
    "operationId": "listEntitlements",
    "tool": "list_entitlements",
    "method": "GET",
    "path": "/entitlements",
    "summary": "List entitlements",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [
      "limit",
      "cursor",
      "customer",
      "product",
      "subscription"
    ],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "limit": {
          "default": 10,
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "How many objects to return, 1–100. Default 10."
        },
        "cursor": {
          "type": "string",
          "minLength": 1,
          "maxLength": 300,
          "description": "`next_cursor` from the previous page."
        },
        "customer": {
          "type": "string",
          "maxLength": 80,
          "description": "A customer id, `cus_…`."
        },
        "product": {
          "type": "string",
          "maxLength": 80,
          "description": "A product id, `prod_…`."
        },
        "subscription": {
          "type": "string",
          "maxLength": 80,
          "description": "A subscription id, `sub_…`."
        }
      },
      "additionalProperties": false
    }
  },
  {
    "operationId": "consumeEntitlementCredits",
    "tool": "consume_entitlement_credits",
    "method": "POST",
    "path": "/entitlements/{id}/consume",
    "summary": "Spend credits",
    "description": "Spends credits from one credit pack, atomically. Refused when fewer are left. `action` labels the spend for your reports; with an `Idempotency-Key` a retry never spends twice. To spend from a customer's packs together, use POST /credits/consume.",
    "testOnly": false,
    "pathParams": [
      "id"
    ],
    "queryParams": [],
    "bodyParams": [
      "credits",
      "action"
    ],
    "hasBody": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "The object's id."
        },
        "credits": {
          "type": "integer",
          "minimum": 1,
          "maximum": 1000000
        },
        "action": {
          "description": "Your label for what the credits paid for.",
          "type": "string",
          "pattern": "^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,63}$"
        }
      },
      "required": [
        "id",
        "credits"
      ],
      "additionalProperties": false
    }
  },
  {
    "operationId": "listCreditUsage",
    "tool": "list_credit_usage",
    "method": "GET",
    "path": "/credits/usage",
    "summary": "List credit spends",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [
      "limit",
      "cursor",
      "customer",
      "product",
      "action"
    ],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "limit": {
          "default": 10,
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "How many objects to return, 1–100. Default 10."
        },
        "cursor": {
          "type": "string",
          "minLength": 1,
          "maxLength": 300,
          "description": "`next_cursor` from the previous page."
        },
        "customer": {
          "type": "string",
          "maxLength": 80,
          "description": "A customer id, `cus_…`."
        },
        "product": {
          "type": "string",
          "maxLength": 80,
          "description": "A product id, `prod_…`."
        },
        "action": {
          "type": "string",
          "pattern": "^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,63}$",
          "description": "Your label for what the credits paid for (`chat`, `image.hd`, `api/search`). Shows in your dashboard by action."
        }
      },
      "additionalProperties": false
    }
  },
  {
    "operationId": "listPayments",
    "tool": "list_payments",
    "method": "GET",
    "path": "/payments",
    "summary": "List payments",
    "description": "Transfers seen on chain into addresses we handed out, newest first.",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [
      "limit",
      "cursor",
      "invoice",
      "asset"
    ],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "limit": {
          "default": 10,
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "How many objects to return, 1–100. Default 10."
        },
        "cursor": {
          "type": "string",
          "minLength": 1,
          "maxLength": 300,
          "description": "`next_cursor` from the previous page."
        },
        "invoice": {
          "type": "string",
          "maxLength": 80,
          "description": "A invoice id, `inv_…`."
        },
        "asset": {
          "type": "string",
          "enum": [
            "BTC",
            "USDC",
            "USDT"
          ]
        }
      },
      "additionalProperties": false
    }
  },
  {
    "operationId": "retrievePayment",
    "tool": "retrieve_payment",
    "method": "GET",
    "path": "/payments/{id}",
    "summary": "Retrieve a payment",
    "testOnly": false,
    "pathParams": [
      "id"
    ],
    "queryParams": [],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "The object's id."
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": false
    }
  },
  {
    "operationId": "listRefunds",
    "tool": "list_refunds",
    "method": "GET",
    "path": "/refunds",
    "summary": "List refunds",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [
      "limit",
      "cursor",
      "invoice",
      "status"
    ],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "limit": {
          "default": 10,
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "How many objects to return, 1–100. Default 10."
        },
        "cursor": {
          "type": "string",
          "minLength": 1,
          "maxLength": 300,
          "description": "`next_cursor` from the previous page."
        },
        "invoice": {
          "type": "string",
          "maxLength": 80,
          "description": "A invoice id, `inv_…`."
        },
        "status": {
          "type": "string",
          "enum": [
            "requested",
            "awaiting_address",
            "ready_to_send",
            "sent",
            "confirmed",
            "canceled"
          ]
        }
      },
      "additionalProperties": false
    }
  },
  {
    "operationId": "createRefund",
    "tool": "create_refund",
    "method": "POST",
    "path": "/refunds",
    "summary": "Open a refund",
    "description": "Starts a refund in the asset that was paid. We email the buyer a link to give an address; the link is never returned, since whoever holds it decides where the money goes. With no email on the invoice, the owner makes one in the dashboard. When the address is checked, the refund is `ready_to_send` with `amount_to_send`. Refused with `sanctioned_sender` when money on the invoice came from an address on a sanctions list, or one the coin's issuer froze: sending it back may itself be prohibited, so nothing refunds it — leave it and talk to a lawyer.",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [],
    "bodyParams": [
      "invoice",
      "amount",
      "reason"
    ],
    "hasBody": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "invoice": {
          "description": "A invoice id, `inv_…`.",
          "type": "string",
          "maxLength": 80
        },
        "amount": {
          "description": "In the paid asset's smallest unit. Default: everything still refundable.",
          "type": "string",
          "pattern": "^[1-9][0-9]{0,77}$"
        },
        "reason": {
          "type": "string",
          "minLength": 1,
          "maxLength": 500
        }
      },
      "required": [
        "invoice"
      ],
      "additionalProperties": false
    }
  },
  {
    "operationId": "listReceipts",
    "tool": "list_receipts",
    "method": "GET",
    "path": "/receipts",
    "summary": "List receipts",
    "description": "One for every fulfilled payment and every confirmed refund, newest first.",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [
      "limit",
      "cursor",
      "invoice",
      "kind"
    ],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "limit": {
          "default": 10,
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "How many objects to return, 1–100. Default 10."
        },
        "cursor": {
          "type": "string",
          "minLength": 1,
          "maxLength": 300,
          "description": "`next_cursor` from the previous page."
        },
        "invoice": {
          "type": "string",
          "maxLength": 80,
          "description": "A invoice id, `inv_…`."
        },
        "kind": {
          "type": "string",
          "enum": [
            "payment",
            "refund"
          ]
        }
      },
      "additionalProperties": false
    }
  },
  {
    "operationId": "retrieveReceipt",
    "tool": "retrieve_receipt",
    "method": "GET",
    "path": "/receipts/{id}",
    "summary": "Retrieve a receipt",
    "testOnly": false,
    "pathParams": [
      "id"
    ],
    "queryParams": [],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "The object's id."
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": false
    }
  },
  {
    "operationId": "listEvents",
    "tool": "list_events",
    "method": "GET",
    "path": "/events",
    "summary": "List events",
    "description": "What happened in the last 30 days, newest first. `type` filters (`invoice.paid`, or `invoice.*`).",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [
      "limit",
      "cursor",
      "type",
      "object"
    ],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "limit": {
          "default": 10,
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "How many objects to return, 1–100. Default 10."
        },
        "cursor": {
          "type": "string",
          "minLength": 1,
          "maxLength": 300,
          "description": "`next_cursor` from the previous page."
        },
        "type": {
          "type": "string",
          "pattern": "^[a-z_]+\\.([a-z_.]+|\\*)$"
        },
        "object": {
          "type": "string",
          "maxLength": 80,
          "description": "Only events about this object (`inv_…`, `sub_…`)."
        }
      },
      "additionalProperties": false
    }
  },
  {
    "operationId": "listWebhookEndpoints",
    "tool": "list_webhook_endpoints",
    "method": "GET",
    "path": "/webhook_endpoints",
    "summary": "List webhook endpoints",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [
      "limit",
      "cursor"
    ],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "limit": {
          "default": 10,
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "How many objects to return, 1–100. Default 10."
        },
        "cursor": {
          "type": "string",
          "minLength": 1,
          "maxLength": 300,
          "description": "`next_cursor` from the previous page."
        }
      },
      "additionalProperties": false
    }
  },
  {
    "operationId": "createWebhookEndpoint",
    "tool": "create_webhook_endpoint",
    "method": "POST",
    "path": "/webhook_endpoints",
    "summary": "Create a webhook endpoint",
    "description": "The response carries `secret` — the only time you see it. Keep it to verify `Perly-Signature`.",
    "testOnly": false,
    "pathParams": [],
    "queryParams": [],
    "bodyParams": [
      "url",
      "enabled_events",
      "description"
    ],
    "hasBody": true,
    "inputSchema": {
      "type": "object",
      "properties": {
        "url": {
          "type": "string",
          "maxLength": 2000
        },
        "enabled_events": {
          "minItems": 1,
          "maxItems": 47,
          "type": "array",
          "items": {
            "anyOf": [
              {
                "type": "string",
                "const": "*"
              },
              {
                "type": "string",
                "enum": [
                  "invoice.created",
                  "invoice.rail_chosen",
                  "invoice.open",
                  "invoice.seen",
                  "invoice.underpaid",
                  "invoice.paid",
                  "invoice.overpaid",
                  "invoice.review",
                  "invoice.expired",
                  "invoice.canceled",
                  "invoice.fulfilled",
                  "invoice.refunded",
                  "invoice.sent",
                  "invoice.found_on_other_network",
                  "payment.received",
                  "payment.confirmed",
                  "payment.dropped",
                  "receipt.created",
                  "refund.requested",
                  "refund.address_received",
                  "refund.sent",
                  "refund.confirmed",
                  "refund.canceled",
                  "subscription.created",
                  "subscription.activated",
                  "subscription.trial_ending",
                  "subscription.renewal_invoice_opened",
                  "subscription.renewed",
                  "subscription.past_due",
                  "subscription.unpaid",
                  "subscription.paused",
                  "subscription.resumed",
                  "subscription.plan_changed",
                  "subscription.canceled",
                  "subscription.ended",
                  "entitlement.granted",
                  "entitlement.revoked",
                  "credits.low",
                  "credits.depleted",
                  "checkout.completed",
                  "license.created",
                  "license.revoked",
                  "customer.created",
                  "webhook_endpoint.disabled",
                  "webhook.test",
                  "plan.changed"
                ]
              }
            ]
          },
          "description": "Event types to send, or `[\"*\"]` for every one."
        },
        "description": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200
        }
      },
      "required": [
        "url"
      ],
      "additionalProperties": false
    }
  },
  {
    "operationId": "deleteWebhookEndpoint",
    "tool": "delete_webhook_endpoint",
    "method": "DELETE",
    "path": "/webhook_endpoints/{id}",
    "summary": "Delete a webhook endpoint",
    "testOnly": false,
    "pathParams": [
      "id"
    ],
    "queryParams": [],
    "bodyParams": [],
    "hasBody": false,
    "inputSchema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "The object's id."
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": false
    }
  }
];
