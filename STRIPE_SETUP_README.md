# Stripe Payment Integration Setup

## Issues Fixed

The payment system had several critical issues that prevented credits from being loaded after payment and caused subscription payment problems:

### Problems Identified:
1. **Missing Stripe Webhook Handler** - No mechanism to process successful payments
2. **No Credit Loading API** - No way to add credits to user accounts after payment
3. **No Subscription Status Updates** - Subscriptions weren't being activated after payment
4. **Placeholder Price IDs** - Payment route used dummy Stripe price IDs

### Solutions Implemented:

#### 1. Stripe Webhook Handler (`/api/webhooks/stripe/route.ts`)
- Handles `checkout.session.completed` events for credit purchases
- Handles `invoice.payment_succeeded` events for subscription payments
- Automatically adds credits to user accounts after successful payment
- Updates user subscription status for subscription payments
- Logs all transactions in user history

#### 2. Credits API Route (`/api/users/credits/add/route.ts`)
- Allows adding credits to user accounts
- Includes proper validation and error handling
- Logs all credit additions with metadata
- Supports admin operations for manual credit additions

#### 3. Updated Payment Route (`/api/payments/route.ts`)
- Uses environment variables for actual Stripe price IDs
- Improved error handling and validation

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (replace with your actual price IDs)
STRIPE_PRO_PRICE_ID=price_your_pro_plan_price_id
STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_plan_price_id
```

## Stripe Dashboard Setup

### 1. Create Products and Prices

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Create products for your subscription plans:
   - **Pro Plan**: $29/month
   - **Enterprise Plan**: $99/month
3. Note the Price IDs for each plan (starts with `price_`)

### 2. Set Up Webhook Endpoint

1. In Stripe Dashboard, go to **Webhooks**
2. Click **"Add endpoint"**
3. Enter your webhook URL:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook signing secret** to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

### 3. Test the Integration

1. Start your development server
2. Make a test purchase with Stripe test card: `4242 4242 4242 4242`
3. Check your database to verify:
   - Credits are added to user account for credit purchases
   - Subscription status is updated for subscription purchases
   - Usage history is logged correctly

## How It Works

### Credit Purchase Flow:
1. User selects credit package on `/purchase` page
2. Payment route creates Stripe checkout session
3. User completes payment on Stripe
4. Stripe sends `checkout.session.completed` webhook
5. Webhook handler adds credits to user account
6. User is redirected to success page with updated credit balance

### Subscription Flow:
1. User selects subscription plan
2. Payment route creates Stripe subscription checkout
3. User completes payment
4. Stripe sends `invoice.payment_succeeded` webhook
5. Webhook handler updates user subscription status
6. User gets unlimited access based on subscription tier

## Testing

To test the complete flow:

1. **Credit Purchase Test**:
   ```bash
   curl -X POST http://localhost:3000/api/payments \
     -H "Content-Type: application/json" \
     -d '{"type": "credits", "credits": "100"}'
   ```

2. **Subscription Test**:
   ```bash
   curl -X POST http://localhost:3000/api/payments \
     -H "Content-Type: application/json" \
     -d '{"type": "subscription", "plan": "pro"}'
   ```

3. **Manual Credit Addition** (for testing):
   ```bash
   curl -X POST http://localhost:3000/api/users/credits/add \
     -H "Content-Type: application/json" \
     -d '{"credits": 100, "description": "Test credit addition"}'
   ```

## Troubleshooting

### Common Issues:

1. **Credits not loading after payment**:
   - Check webhook endpoint URL is correct
   - Verify webhook secret matches Stripe dashboard
   - Check server logs for webhook processing errors

2. **Subscription not activating**:
   - Ensure price IDs match Stripe dashboard
   - Check webhook is receiving `invoice.payment_succeeded` events
   - Verify user email is correctly passed to Stripe

3. **Webhook signature verification failing**:
   - Copy webhook secret exactly from Stripe dashboard
   - Ensure webhook endpoint is accessible from Stripe
   - Check for trailing spaces in environment variables

### Debug Mode:

Add this to your webhook handler temporarily to debug issues:

```typescript
console.log('Received webhook event:', {
  type: event.type,
  id: event.id,
  data: event.data.object
});
```

## Security Notes

- Webhook secret verification prevents unauthorized webhook calls
- Environment variables keep sensitive data secure
- User authentication required for manual credit operations
- All credit transactions are logged for audit purposes

## Next Steps

1. Set up your Stripe products and prices
2. Configure webhook endpoint in Stripe dashboard
3. Add required environment variables
4. Test with Stripe test card: `4242 4242 4242 4242`
5. Monitor logs for any issues
6. Go live with Stripe live keys when ready
