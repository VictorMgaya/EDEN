'use client';

import { useEffect, useRef, useState, useCallback } from 'react';



interface PayPalSubscriptionButtonProps {
  plan: 'pro' | 'enterprise';
  userEmail?: string;
  onSuccess: (subscriptionId: string) => void;
  onError: (error: Error) => void;
  disabled?: boolean;
}

export default function PayPalSubscriptionButton({ plan, userEmail, onSuccess, onError, disabled }: PayPalSubscriptionButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  // Create subscription through backend API
  const createSubscription = useCallback(async (): Promise<string | null> => {
    if (loading) return null;

    setLoading(true);
    try {
      const response = await fetch('/api/payments/create-paypal-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: plan,
          userEmail: userEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create PayPal subscription');
      }

      const data = await response.json();
      return data.subscriptionID;
    } catch (error) {
      console.error('Error creating PayPal subscription:', error);
      onError(error as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [plan, userEmail, loading, onError]);

  useEffect(() => {
    console.log('🔄 [PAYPAL-SUB] Initializing PayPal subscription button...', {
      plan,
      hasPayPal: !!window.paypal,
      hasRef: !!paypalRef.current,
      disabled,
      loading
    });

    if (window.paypal && paypalRef.current && !disabled && !loading) {
      console.log('✅ [PAYPAL-SUB] Rendering PayPal subscription button');

      // Clear any existing buttons
      paypalRef.current.innerHTML = '';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.paypal as any).Buttons({
        // Create subscription on server-side for security
        createSubscription: async (): Promise<string | null> => {
          console.log('🔄 [PAYPAL-SUB] Creating subscription...');
          const result = await createSubscription();
          console.log('✅ [PAYPAL-SUB] Subscription created:', result);
          return result;
        },

        // Handle subscription approval
        onApprove: async (data: { subscriptionID: string }): Promise<void> => {
          console.log('✅ [PAYPAL-SUB] Subscription approved:', data);
          if (data && data.subscriptionID) {
            onSuccess(data.subscriptionID);
          } else {
            onError(new Error('No subscription ID received from PayPal'));
          }
        },

        // Handle errors
        onError: (error: unknown): void => {
          console.error('❌ [PAYPAL-SUB] Button error:', error);
          onError(new Error('PayPal subscription failed'));
        },

        // Handle cancellation
        onCancel: (data: unknown): void => {
          console.log('⚠️ [PAYPAL-SUB] Subscription cancelled:', data);
          onError(new Error('Subscription cancelled by user'));
        },

        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'subscribe',
          height: 40,
        },
      }).render(paypalRef.current);
    } else if (!window.paypal) {
      console.error('❌ [PAYPAL-SUB] PayPal SDK not loaded');
      onError(new Error('PayPal SDK not loaded'));
    }
  }, [plan, userEmail, onSuccess, onError, disabled, loading, createSubscription]);

  if (disabled || loading) {
    return (
      <div className="w-full h-12 bg-slate-200 dark:bg-slate-700 rounded-md flex items-center justify-center">
        <span className="text-slate-500 dark:text-slate-400">
          {loading ? 'Creating subscription...' : 'Loading PayPal...'}
        </span>
      </div>
    );
  }

  return <div ref={paypalRef} className="w-full" />;
}
