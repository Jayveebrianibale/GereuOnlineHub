# 🔑 Live API Keys Testing Guide

## Overview
This guide explains how to use PayMongo live API keys for testing your payment integration. **WARNING: This will process REAL payments with REAL money!**

## ⚠️ Important Warnings

- **REAL MONEY**: Live keys process actual payments
- **TRANSACTION FEES**: You'll be charged PayMongo fees
- **REFUNDS**: You may need to refund test payments
- **SMALL AMOUNTS**: Always test with minimum amounts (1-10 PHP)

## 🚀 Quick Setup

### Step 1: Get Your Live API Keys
1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com)
2. Navigate to **Developers** → **API Keys**
3. Switch to **Live** mode
4. Copy your live secret key (`sk_live_...`) and public key (`pk_live_...`)

### Step 2: Update Configuration
Edit `app/config/paymongoConfig.ts`:

```typescript
// FORCE LIVE KEYS FOR TESTING (Uncomment to use live keys for testing)
const PAYMONGO_LIVE_SECRET_KEY = 'sk_live_YOUR_ACTUAL_LIVE_SECRET_KEY';
const PAYMONGO_LIVE_PUBLIC_KEY = 'pk_live_YOUR_ACTUAL_LIVE_PUBLIC_KEY';
```

### Step 3: Test with Live Keys
1. Navigate to `app/test-live-keys.tsx`
2. Click "Test Live API Keys"
3. Monitor the results carefully

## 🧪 Testing Strategy

### Phase 1: Small Amount Testing
- Start with **1 PHP** payments
- Test Payment Intent creation
- Test GCash Source creation
- Verify checkout URLs work

### Phase 2: Payment Flow Testing
- Test complete payment flow
- Verify payment verification
- Test refund process if needed

### Phase 3: Integration Testing
- Test with your actual app
- Verify all payment methods work
- Test error handling

## 💰 Cost Management

### Transaction Fees
- PayMongo charges ~2.9% + ₱5 per transaction
- For 1 PHP test: ~₱5.03 total cost
- For 10 PHP test: ~₱5.29 total cost

### Refund Process
1. Go to PayMongo Dashboard
2. Find your test payment
3. Process refund if needed
4. Monitor refund status

## 🔒 Safety Best Practices

### ✅ Do's
- Use small amounts (1-10 PHP)
- Test with your own money first
- Keep track of all test payments
- Use a separate test account if possible
- Document all test transactions

### ❌ Don'ts
- Don't test with large amounts
- Don't test with customer money
- Don't forget to switch back to test keys
- Don't test in production environment
- Don't ignore transaction fees

## 🛠️ Troubleshooting

### Common Issues

#### "GCash not enabled" Error
- **Solution**: Contact PayMongo support to enable GCash for your live account
- **Alternative**: Use QR code fallback

#### "Invalid API keys" Error
- **Solution**: Double-check your live keys are correct
- **Check**: Keys start with `sk_live_` and `pk_live_`

#### "Payment failed" Error
- **Solution**: Check your PayMongo account status
- **Check**: Ensure account is fully activated

### Getting Help
1. Check PayMongo Dashboard for account status
2. Contact PayMongo support for GCash enablement
3. Review transaction logs for detailed errors

## 📊 Expected Results

### With Live Keys, You Should See:
- ✅ **Working checkout URLs** - Real PayMongo checkout pages
- ✅ **GCash integration** - If enabled on your account
- ✅ **Real payment processing** - Actual money transactions
- ✅ **Complete API responses** - Full redirect URLs and status

### If GCash Still Doesn't Work:
- Contact PayMongo support to enable GCash
- Use QR code fallback as backup
- Consider alternative payment methods

## 🔄 Switching Back to Test Keys

After testing, switch back to test keys:

```typescript
// Comment out live keys
// const PAYMONGO_LIVE_SECRET_KEY = 'sk_live_...';
// const PAYMONGO_LIVE_PUBLIC_KEY = 'pk_live_...';

// Use environment variables or test keys
const PAYMONGO_LIVE_SECRET_KEY = process.env.PAYMONGO_LIVE_SECRET_KEY || '';
const PAYMONGO_LIVE_PUBLIC_KEY = process.env.PAYMONGO_LIVE_PUBLIC_KEY || '';
```

## 📝 Test Checklist

- [ ] Live API keys configured
- [ ] Small amount testing (1 PHP)
- [ ] Payment Intent creation works
- [ ] GCash Source creation works
- [ ] Checkout URLs are accessible
- [ ] Payment verification works
- [ ] Refund process tested (if needed)
- [ ] Switched back to test keys

## 🎯 Success Criteria

Your live API keys testing is successful when:
1. **Checkout URLs work** - No more "page didn't make it" errors
2. **GCash payments process** - Real GCash integration works
3. **Payment verification works** - Status updates correctly
4. **Error handling works** - Graceful fallbacks to QR codes

## 💡 Pro Tips

1. **Start Small**: Always begin with 1 PHP test payments
2. **Document Everything**: Keep track of all test transactions
3. **Test Refunds**: Know how to refund if needed
4. **Monitor Costs**: Keep an eye on transaction fees
5. **Have Backup**: QR code fallback should always work

---

**Remember**: Live API keys are powerful but expensive. Use them wisely and always test with small amounts first!
