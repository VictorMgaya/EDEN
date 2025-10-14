/* eslint-disable react/no-unescaped-entities */
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, Crown, Building2, Home, Receipt } from 'lucide-react';
import Link from 'next/link';

export default function PurchaseSuccessPage() {
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<{
    type: 'credits' | 'subscription';
    amount?: number;
    plan?: string;
    planName?: string;
    confirmed?: boolean;
    dbSaved?: boolean;
  } | null>(null);

  // Confirm payment with secure API
  const confirmPayment = async (force = false) => {
    if (!session?.user?.email || isConfirming) return;

    // Generate a stable payment session ID based on payment details
    const type = searchParams.get('type') as 'credits' | 'subscription';
    const amount = searchParams.get('amount');
    const plan = searchParams.get('plan');
    const method = searchParams.get('method') || 'stripe';

    // Create a stable payment session ID that persists across reloads
    const paymentSessionId = `${session.user.email}_${method}_${type}_${amount || plan}`;

    // Check if this payment session was already confirmed
    const alreadyConfirmedKey = `payment_confirmed_${paymentSessionId}`;
    const alreadyConfirmed = sessionStorage.getItem(alreadyConfirmedKey);

    if (alreadyConfirmed && !force) {
      console.log('✅ Payment already confirmed for this session, skipping duplicate confirmation');
      setConfirmationStatus('success');
      setIsLoading(false);
      return;
    }

    setIsConfirming(true);
    try {
      const response = await fetch('/api/payments/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: paymentSessionId, // Use stable session ID instead of timestamp
          paymentMethod: method,
          amount: amount,
          type: type,
          plan: plan,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfirmationStatus('success');

        // Mark this payment session as confirmed to prevent future duplicate calls
        sessionStorage.setItem(alreadyConfirmedKey, 'true');

        // Update session to refresh user data
        await update();

        console.log('✅ Payment confirmed successfully:', data);
      } else {
        const errorData = await response.json();
        setConfirmationStatus('error');
        console.error('❌ Payment confirmation failed:', errorData);
      }
    } catch (error) {
      setConfirmationStatus('error');
      setShowRetryButton(true);
      console.error('❌ Error confirming payment:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  useEffect(() => {
    const type = searchParams.get('type') as 'credits' | 'subscription';
    const amount = searchParams.get('amount');
    const plan = searchParams.get('plan');
    const confirmed = searchParams.get('confirmed') === 'true';
    const dbSaved = searchParams.get('db_saved') === 'true';

    if (type) {
      setPurchaseDetails({
        type,
        amount: amount ? parseInt(amount) : undefined,
        plan: plan || undefined,
        planName: plan === 'pro' ? 'Pro' : plan === 'enterprise' ? 'Enterprise' : undefined,
        confirmed,
        dbSaved,
      });
    }

    // Check if this request came from PayPal server-side processing
    const isFromPayPal = document.referrer?.includes('paypal.com') ||
                         searchParams.get('method') === 'paypal';

    // If payment is already confirmed via PayPal backend or marked as confirmed, skip auto-confirmation
    if (confirmed || dbSaved || isFromPayPal) {
      setIsLoading(false);
      setConfirmationStatus('success');

      // Mark as confirmed in session storage to prevent future auto-confirmations
      if (session?.user?.email && (confirmed || dbSaved || isFromPayPal)) {
        const paymentSessionId = `${session.user.email}_${searchParams.get('method') || 'stripe'}_${type}_${amount || plan}`;
        sessionStorage.setItem(`payment_confirmed_${paymentSessionId}`, 'true');
      }
    } else if (type && session?.user?.email) {
      // Only auto-confirm if not already handled by backend
      confirmPayment();
    } else {
      setIsLoading(false);
    }
  }, [searchParams, session]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!purchaseDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Payment Error</CardTitle>
            <CardDescription>
              We couldn't find the payment details. Please contact support if you were charged.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/purchase">
              <Button>Return to Purchase</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-3xl text-green-800 dark:text-green-200">
              Payment Successful!
            </CardTitle>
            <CardDescription className="text-lg">
              Thank you for your purchase. Your payment has been processed successfully.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Purchase Details */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Receipt className="h-5 w-5 mr-2" />
                Purchase Details
              </h3>

              {purchaseDetails.type === 'credits' && purchaseDetails.amount && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                      <span>Credits Purchased</span>
                    </div>
                    <span className="font-semibold text-lg">
                      {purchaseDetails.amount.toLocaleString()} Credits
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    You can now use these credits across all our services.
                  </div>
                </div>
              )}

              {purchaseDetails.type === 'subscription' && purchaseDetails.planName && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {purchaseDetails.plan === 'pro' ? (
                        <Crown className="h-5 w-5 mr-2 text-purple-600" />
                      ) : (
                        <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                      )}
                      <span>Subscription</span>
                    </div>
                    <span className="font-semibold text-lg">
                      {purchaseDetails.planName} Plan
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Your subscription is now active with unlimited access to all features.
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation Status */}
            {confirmationStatus === 'error' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                      Confirmation Issue
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      There was an issue confirming your payment. This doesn't affect your purchase, but please confirm to ensure your account is updated correctly.
                    </p>
                  </div>
                  {showRetryButton && (
                    <Button
                      onClick={() => confirmPayment(true)}
                      disabled={isConfirming}
                      variant="destructive"
                      size="sm"
                    >
                      {isConfirming ? 'Confirming...' : 'Retry Confirmation'}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* What's Next */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-800 dark:text-blue-200">
                What's Next?
              </h3>
              <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                {purchaseDetails.type === 'credits' ? (
                  <>
                    <li>• Your credits have been added to your account</li>
                    <li>• You can start using them immediately</li>
                    <li>• Track your usage in your account dashboard</li>
                  </>
                ) : (
                  <>
                    <li>• Your subscription is now active</li>
                    <li>• Enjoy unlimited access to all features</li>
                    <li>• Manage your subscription in your account settings</li>
                  </>
                )}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full" size="lg">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/purchase" className="flex-1">
                <Button variant="outline" className="w-full" size="lg">
                  Make Another Purchase
                </Button>
              </Link>
            </div>

            {/* Support Info */}
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-6 border-t">
              <p>
                Need help? Contact our support team or check your email for the receipt.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
