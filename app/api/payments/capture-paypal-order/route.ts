import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/model/user';

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

export async function POST(request: NextRequest) {
  try {
    const { orderID } = await request.json();

    if (!orderID) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    console.log('🔄 [PAYPAL] Capturing order:', orderID);

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Capture the order with PayPal
    const response = await fetch(`${PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PayPal order capture failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`PayPal order capture failed: ${response.statusText}`);
    }

    const capture = await response.json();

    if (capture.status !== 'COMPLETED') {
      throw new Error(`Payment not completed. Status: ${capture.status}`);
    }

    console.log('✅ [PAYPAL] Order captured successfully:', capture.id);

    // Extract payment details
    const paymentAmount = parseFloat(capture.purchase_units[0]?.payments?.captures[0]?.amount?.value || '0');
    const creditAmount = Math.floor(paymentAmount * 500); // 1 USD = 500 credits

    // Get user email from PayPal response (optional)
    const userEmail = capture.purchase_units[0]?.metadata?.userEmail ||
                     capture.payer?.email_address;

    let user = null;

    // Connect to database if we have user email
    if (userEmail) {
      await dbConnect();
      console.log('✅ [PAYPAL] Database connected');

      user = await User.findOne({ email: userEmail });

      if (user) {
        console.log(`✅ [PAYPAL] Existing user found: ${user.email} (ID: ${user._id})`);
      }
    }

    // Update user credits if user exists
    if (user) {
      const previousCredits = user.credits || 0;
      const newCreditTotal = previousCredits + creditAmount;

      user.credits = Math.max(0, newCreditTotal);
      user.lastCreditPurchase = new Date();

      // Log the credit addition
      const usageRecord = {
        action: 'credit',
        amount: creditAmount,
        description: `Credit purchase - ${creditAmount} credits via PayPal`,
        timestamp: new Date(),
        metadata: {
          type: 'credit_purchase',
          reason: 'paypal_payment_success',
          paymentMethod: 'paypal',
          orderId: orderID,
          previousCredits: previousCredits,
          newTotalCredits: user.credits,
          paymentAmount: paymentAmount,
          currency: 'USD'
        }
      };

      if (!user.usageHistory) {
        user.usageHistory = [];
      }

      user.usageHistory.unshift(usageRecord);

      // Keep only last 1000 records
      if (user.usageHistory.length > 1000) {
        user.usageHistory = user.usageHistory.slice(0, 1000);
      }

      // Save user - ONLY return success if this succeeds
      try {
        await user.save();
        console.log(`✅ Successfully added ${creditAmount} credits to user ${userEmail}. Total credits: ${user.credits}`);

        // Return success response AFTER database save
        return NextResponse.json({
          success: true,
          orderID: orderID,
          status: capture.status,
          creditsAdded: creditAmount,
          totalCredits: user.credits,
          paymentAmount: paymentAmount,
          dbSaved: true,
        });
      } catch (saveError) {
        console.error(`❌ Failed to save user ${userEmail}:`, saveError);
        throw new Error('Failed to update user credits in database');
      }
    }

    // Return response for users not found in database (guest users)
    return NextResponse.json({
      success: true,
      orderID: orderID,
      status: capture.status,
      creditsAdded: creditAmount,
      totalCredits: 0,
      paymentAmount: paymentAmount,
      guestUser: true,
    });

  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to capture PayPal order' },
      { status: 500 }
    );
  }
}
