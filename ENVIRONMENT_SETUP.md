# Environment Variables Setup

## PayMongo API Keys

To use the PayMongo integration, you need to set up your API keys as environment variables.

### 1. Create a `.env` file in your project root

```bash
# PayMongo Test API Keys (for development)
PAYMONGO_TEST_SECRET_KEY=sk_test_your_test_secret_key_here
PAYMONGO_TEST_PUBLIC_KEY=pk_test_your_test_public_key_here

# PayMongo Live API Keys (for production)
PAYMONGO_LIVE_SECRET_KEY=sk_live_your_live_secret_key_here
PAYMONGO_LIVE_PUBLIC_KEY=pk_live_your_live_public_key_here
```

### 2. Get your PayMongo API Keys

1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com/)
2. Sign in to your account
3. Go to **API Keys** section
4. Copy your test and live API keys
5. Paste them into your `.env` file

### 3. Security Notes

- **Never commit `.env` files** to version control
- **Use test keys** for development
- **Use live keys** only for production
- **Keep your secret keys secure**

### 4. For React Native

Make sure to install and configure `react-native-dotenv` or similar package to load environment variables.

### 5. For Testing

The test files will use placeholder values if environment variables are not set, but for actual testing, you should set up your `.env` file with real test API keys.

## Example Usage

```typescript
// This will use environment variables or fallback to placeholders
const secretKey = process.env.PAYMONGO_TEST_SECRET_KEY || 'sk_test_placeholder';
const publicKey = process.env.PAYMONGO_TEST_PUBLIC_KEY || 'pk_test_placeholder';
```
