# 🚀 PayMongo SDK Implementation Guide

## Overview
This guide shows how to properly implement PayMongo using the official `@api/paymongo` SDK for both Payment Intents and GCash Sources.

## 📦 Installation

```bash
npm install @api/paymongo
```

## 🔑 SDK Setup

```typescript
import paymongo from '@api/paymongo';

// I-set ang API key
paymongo.auth('sk_test_WL2guhaPujZZ5cw4ycEuyWue');
```

## 💳 Payment Intent Implementation

### ✅ What Payment Intents Are For
- **Frontend SDK Integration** - Use with PayMongo's frontend SDK
- **Modern Payment Flow** - Supports multiple payment methods
- **Client-side Processing** - Requires frontend integration

### ❌ What Payment Intents Are NOT For
- **Direct Checkout URLs** - They don't have working checkout links
- **Simple Integration** - Require frontend SDK setup
- **Direct Links** - Can't be opened directly in browser

### Example Implementation
```typescript
// I-create ang Payment Intent
const paymentIntent = await paymongo.createAPaymentintent({
  data: {
    attributes: {
      amount: 2000, // 20 PHP in centavos
      payment_method_allowed: ['qrph', 'card', 'dob', 'paymaya', 'billease', 'gcash', 'grab_pay'],
      payment_method_options: {
        card: { request_three_d_secure: 'any' }
      },
      currency: 'PHP',
      capture_type: 'automatic'
    }
  }
});

console.log('Payment Intent:', paymentIntent.data);
// Result: { id: 'pi_xxx', client_key: 'pi_xxx_client_xxx', status: 'awaiting_payment_method' }
```

## 🏦 GCash Source Implementation

### ✅ What GCash Sources Are For
- **Direct Checkout URLs** - Have working checkout links
- **Simple Integration** - Easy to implement
- **Direct Links** - Can be opened in browser
- **GCash Payments** - Perfect for GCash integration

### Example Implementation
```typescript
// I-create ang GCash Source
const gcashSource = await paymongo.createASource({
  data: {
    attributes: {
      type: 'gcash',
      amount: 2000, // 20 PHP in centavos
      currency: 'PHP',
      redirect: {
        success: 'https://your-app.com/success',
        failed: 'https://your-app.com/failed',
      },
      billing: {
        name: 'Customer Name',
        email: 'customer@example.com',
        phone: '+639123456789',
      },
      metadata: {
        reference_number: 'REF123456',
        description: 'Payment for service',
        environment: 'test',
      },
    },
  },
});

console.log('GCash Source:', gcashSource.data);
// Result: { id: 'src_xxx', attributes: { redirect: { checkout_url: 'https://checkout.paymongo.com/sources/src_xxx' } } }
```

## 🎯 Recommended Implementation for Your App

### For GCash Payments (Recommended)
```typescript
import paymongo from '@api/paymongo';

// I-set ang API key
paymongo.auth('sk_test_WL2guhaPujZZ5cw4ycEuyWue');

// I-create ang GCash Source
const createGCashPayment = async (amount: number, description: string, referenceNumber: string) => {
  try {
    const gcashSource = await paymongo.createASource({
      data: {
        attributes: {
          type: 'gcash',
          amount: amount * 100, // Convert to centavos
          currency: 'PHP',
          redirect: {
            success: 'https://your-app.com/payment/success',
            failed: 'https://your-app.com/payment/failed',
          },
          billing: {
            name: 'Customer',
            email: 'customer@example.com',
            phone: '+639123456789',
          },
          metadata: {
            reference_number: referenceNumber,
            description: description,
            environment: 'test',
          },
        },
      },
    });

    return {
      success: true,
      sourceId: gcashSource.data.id,
      checkoutUrl: gcashSource.data.attributes.redirect.checkout_url,
      status: gcashSource.data.attributes.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// I-use ang function
const payment = await createGCashPayment(20, 'Payment for service', 'REF123456');
if (payment.success) {
  console.log('Checkout URL:', payment.checkoutUrl);
  // I-open ang checkout URL sa browser
  window.open(payment.checkoutUrl);
}
```

## 🔄 Complete Payment Flow

### 1. Create Payment
```typescript
const payment = await createGCashPayment(100, 'Laundry service', 'LAUNDRY123');
```

### 2. Open Checkout
```typescript
if (payment.success) {
  // I-open ang GCash checkout
  window.open(payment.checkoutUrl);
}
```

### 3. Verify Payment
```typescript
// I-check ang source status
const sourceStatus = await paymongo.retrieveASource(payment.sourceId);
if (sourceStatus.data.attributes.status === 'chargeable') {
  // I-create ang payment
  const paymentResult = await paymongo.createAPayment({
    data: {
      attributes: {
        amount: 10000,
        currency: 'PHP',
        description: 'Payment for service',
        source: {
          id: payment.sourceId,
          type: 'source',
        },
      },
    },
  });
}
```

## 🛠️ Integration with Your App

### Update Your Payment Service
```typescript
// I-replace ang existing PayMongo integration
import paymongo from '@api/paymongo';

// I-set ang API key
paymongo.auth(paymongoConfig.secretKey);

// I-update ang createGCashSource function
export async function createGCashSource(request: GCashPaymentRequest): Promise<PayMongoPaymentResult> {
  try {
    const gcashSource = await paymongo.createASource({
      data: {
        attributes: {
          type: 'gcash',
          amount: request.amount * 100,
          currency: 'PHP',
          redirect: {
            success: request.successUrl,
            failed: request.failedUrl,
          },
          billing: {
            name: 'Customer',
            email: 'customer@example.com',
            phone: '+639123456789',
          },
          metadata: {
            reference_number: request.referenceNumber,
            description: request.description,
            environment: paymongoConfig.environment,
          },
        },
      },
    });

    return {
      success: true,
      sourceId: gcashSource.data.id,
      checkoutUrl: gcashSource.data.attributes.redirect.checkout_url,
      status: gcashSource.data.attributes.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

## 🎯 Key Benefits

### Using Official SDK
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Error Handling** - Built-in error management
- ✅ **Documentation** - Official documentation
- ✅ **Updates** - Automatic updates and fixes

### Using GCash Sources
- ✅ **Working URLs** - Real checkout links
- ✅ **Simple Integration** - Easy to implement
- ✅ **Direct Links** - Can be opened in browser
- ✅ **GCash Support** - Perfect for GCash payments

## 🚨 Important Notes

1. **Payment Intents** - Use only for frontend SDK integration
2. **GCash Sources** - Use for direct checkout URLs
3. **Test Keys** - Your current keys work perfectly
4. **Checkout URLs** - Only GCash Sources provide working URLs
5. **Frontend SDK** - Required for Payment Intents

## 🎉 Expected Results

With this implementation:
- ✅ **Working checkout URLs** - Real PayMongo checkout pages
- ✅ **GCash integration** - Perfect for GCash payments
- ✅ **Simple integration** - Easy to implement and maintain
- ✅ **Type safety** - Full TypeScript support
- ✅ **Error handling** - Robust error management

---

**Bottom Line**: Use GCash Sources with the official PayMongo SDK for the best GCash payment experience! 🚀
