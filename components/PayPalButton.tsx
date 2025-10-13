'use client';

import { useEffect, useRef, useState, useCallback } from 'react';



interface PayPalButtonProps {
  amount: number;
  creditAmount?: number;
  onSuccess: (orderId: string) => void;
  onError: (error: Error) => void;
  disabled?: boolean;
}

export default function PayPalButton({ amount, creditAmount = 100, onSuccess, onError, disabled }: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  // Create order through backend API
  const createOrder = useCallback(async (): Promise<string | null> => {
    if (loading) return null;

    setLoading(true);
    try {
      const response = await fetch('/api/payments/create-paypal-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          credits: creditAmount,
          currency: 'USD',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create PayPal order');
      }

      const data = await response.json();
      return data.orderID;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      onError(error as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [amount, creditAmount, loading, onError]);

  // Capture order through backend API
  const captureOrder = useCallback(async (orderID: string): Promise<void> => {
    try {
      const response = await fetch('/api/payments/capture-paypal-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderID: orderID,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to capture PayPal order');
      }

      await response.json();
      onSuccess(orderID);
    } catch (error) {
      console.error('Error capturing PayPal order:', error);
      onError(error as Error);
    }
  }, [onSuccess, onError]);

  useEffect(() => {
    console.log('🔄 [PAYPAL] Initializing PayPal button...', {
      hasPayPal: !!window.paypal,
      hasRef: !!paypalRef.current,
      disabled,
      loading
    });

    if (window.paypal && paypalRef.current && !disabled && !loading) {
      console.log('✅ [PAYPAL] Rendering PayPal button');

      // Clear any existing buttons
      paypalRef.current.innerHTML = '';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.paypal as any).Buttons({
        // Create order on server-side for security
        createOrder: async (): Promise<string | null> => {
          console.log('🔄 [PAYPAL] Creating order...');
          const result = await createOrder();
          console.log('✅ [PAYPAL] Order created:', result);
          return result;
        },

        // Handle payment approval
        onApprove: async (data: { orderID: string }): Promise<void> => {
          console.log('✅ [PAYPAL] Payment approved:', data);
          if (data && data.orderID) {
            await captureOrder(data.orderID);
          } else {
            onError(new Error('No order ID received from PayPal'));
          }
        },

        // Handle errors
        onError: (error: unknown): void => {
          console.error('❌ [PAYPAL] Button error:', error);
          onError(new Error('PayPal payment failed'));
        },

        // Handle cancellation
        onCancel: (data: unknown): void => {
          console.log('⚠️ [PAYPAL] Payment cancelled:', data);
          onError(new Error('Payment cancelled by user'));
        },

        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal',
          height: 40,
        },
      }).render(paypalRef.current);
    } else if (!window.paypal) {
      console.error('❌ [PAYPAL] PayPal SDK not loaded');
      onError(new Error('PayPal SDK not loaded'));
    }
  }, [amount, creditAmount, onSuccess, onError, disabled, loading, createOrder, captureOrder]);

  if (disabled || loading) {
    return (
      <div className="w-full h-12 bg-slate-200 dark:bg-slate-700 rounded-md flex items-center justify-center">
        <span className="text-slate-500 dark:text-slate-400">
          {loading ? 'Processing...' : 'Loading PayPal...'}
        </span>
      </div>
    );
  }

  return <div ref={paypalRef} className="w-full" />;
}

// Extend Window interface to include PayPal
declare global {
  interface Window {
    paypal: {
      Buttons: (config: {
        createOrder?: () => Promise<string | null>;
        createSubscription?: () => Promise<string | null>;
        onApprove: (data: { orderID?: string; subscriptionID?: string }) => Promise<void>;
        onError: (error: unknown) => void;
        onCancel?: (data: unknown) => void;
        style: Record<string, unknown>;
      }) => {
        render: (container: HTMLElement) => void;
      };
    };
  }
}
