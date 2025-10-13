import { NextRequest, NextResponse } from 'next/server';

// PayPal configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox'; // 'sandbox' or 'live'

async function getPayPalAccessToken() {
  // Validate PayPal configuration
  if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID === 'your_paypal_client_id_here') {
    throw new Error('PayPal Client ID not configured. Please set PAYPAL_CLIENT_ID in environment variables.');
  }

  if (!PAYPAL_CLIENT_SECRET || PAYPAL_CLIENT_SECRET === 'your_paypal_client_secret_here') {
    throw new Error('PayPal Client Secret not configured. Please set PAYPAL_CLIENT_SECRET in environment variables.');
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('PayPal auth failed:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`PayPal authentication failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

function getPayPalPlanId(plan: string): string {
  // Map our plans to PayPal plan IDs (you'll need to create these in your PayPal account)
  const planIds = {
    pro: process.env.PAYPAL_PRO_PLAN_ID || '',
    enterprise: process.env.PAYPAL_ENTERPRISE_PLAN_ID || '',
  };

  const planId = planIds[plan as keyof typeof planIds] || '';

  if (!planId || planId.includes('your_paypal_')) {
    throw new Error(`PayPal plan ID not configured for ${plan} plan. Please set PAYPAL_${plan.toUpperCase()}_PLAN_ID in environment variables.`);
  }

  return planId;
}

export async function POST(request: NextRequest) {
  try {
    const { plan, userEmail } = await request.json();

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan is required' },
        { status: 400 }
      );
    }

    console.log('🔄 [PAYPAL] Creating subscription for plan:', plan);

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Get the PayPal plan ID
    const planId = getPayPalPlanId(plan);

    // Create subscription with PayPal
    const response = await fetch(`${PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        plan_id: planId,
        subscriber: {
          email_address: userEmail || undefined,
        },
        application_context: {
          return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/paypal/success?type=subscription&plan=${plan}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/purchase/cancelled`,
          brand_name: 'EDEN',
          user_action: 'SUBSCRIBE_NOW',
        },
        metadata: {
          type: 'subscription',
          plan,
          userEmail: userEmail || '',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PayPal subscription creation failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`PayPal subscription creation failed: ${response.statusText}`);
    }

    const subscription = await response.json();

    // Find approval URL
    const approvalUrl = subscription.links?.find((link: { rel: string; href: string }) => link.rel === 'approve')?.href;

    if (!approvalUrl) {
      throw new Error('No approval URL found in PayPal subscription response');
    }

    console.log('✅ [PAYPAL] Subscription created:', subscription.id);

    return NextResponse.json({
      subscriptionID: subscription.id,
      approvalUrl: approvalUrl,
    });

  } catch (error) {
    console.error('Error creating PayPal subscription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create PayPal subscription' },
      { status: 500 }
    );
  }
}
