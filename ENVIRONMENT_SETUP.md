# Environment Setup Guide

## 🔐 API Keys Configuration

This project uses environment variables to store sensitive API keys securely.

### 📋 Setup Instructions

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file with your actual API keys:**
   ```bash
   # PayMongo API Configuration
   EXPO_PUBLIC_PAYMONGO_SECRET_KEY=sk_test_your_actual_secret_key
   EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_your_actual_public_key
   
   # Environment
   EXPO_PUBLIC_ENVIRONMENT=development
   ```

3. **Restart your development server:**
   ```bash
   npx expo start --clear
   ```

### 🔒 Security Notes

- ✅ **`.env` file is ignored by git** - Your API keys will NOT be committed
- ✅ **`.env.example` is tracked** - Template for other developers
- ✅ **Multiple fallback sources** - Keys can be loaded from:
  - Environment variables (`.env` file)
  - `app.json` extra section
  - Hardcoded fallbacks (for development)

### 📁 Files Created/Modified

- **`.env`** - Your actual API keys (ignored by git)
- **`.env.example`** - Template for other developers
- **`.gitignore`** - Updated to exclude sensitive files
- **`app/config/paymongoConfig.ts`** - Configuration loader with fallbacks

### 🚀 Current PayMongo Keys

Your current PayMongo test keys are configured:
- **Secret Key**: `sk_test_WL2guhaPujZZ5cw4ycEuyWue`
- **Public Key**: `pk_test_unHcUNnqqxMZZyLwcn9omjPz`

### 🔧 Troubleshooting

If you're getting "Invalid PayMongo configuration" errors:

1. Check that your `.env` file exists and has the correct keys
2. Restart your development server with `--clear` flag
3. Check the console logs for detailed configuration information
4. Verify the keys are valid in your PayMongo dashboard

### 📝 Adding New API Keys

To add new API keys:

1. Add them to `.env.example` as a template
2. Add them to your local `.env` file
3. Update `app/config/paymongoConfig.ts` to load them
4. Update this README with the new keys