'use client';

import { useEffect, useRef } from 'react';

interface PayPalOrderDetails {
  id: string;
  status: string;
  purchase_units: Array<{
    amount: {
      currency_code: string;
      value: string;
    };
  }>;
}

interface PayPalButtonProps {
  amount: number;
  onSuccess: (details: PayPalOrderDetails) => void;
  onError: (error: Error) => void;
  disabled?: boolean;
}

export default function PayPalButton({ amount, onSuccess, onError, disabled }: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.paypal && paypalRef.current && !disabled) {
      // Clear any existing buttons
      paypalRef.current.innerHTML = '';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.paypal as any).Buttons({
        createOrder: (data: unknown, actions: unknown) => {
          // @ts-expect-error - PayPal SDK actions object has complex typing
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: amount.toString(),
                  currency_code: 'USD',
                },
                description: 'Credits or Subscription Purchase',
              },
            ],
            application_context: {
              shipping_preference: 'NO_SHIPPING',
            },
          });
        },
        onApprove: (data: unknown, actions: unknown) => {
          // @ts-expect-error - PayPal SDK actions object has complex typing
          return actions.order.capture().then((details: unknown) => {
            onSuccess(details as PayPalOrderDetails);
          });
        },
        onError: (error: unknown) => {
          console.error('PayPal error:', error);
          onError(error as Error);
        },
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal',
        },
      }).render(paypalRef.current);
    }
  }, [amount, onSuccess, onError, disabled]);

  if (disabled) {
    return (
      <div className="w-full h-12 bg-slate-200 dark:bg-slate-700 rounded-md flex items-center justify-center">
        <span className="text-slate-500 dark:text-slate-400">Loading PayPal...</span>
      </div>
    );
  }

  return <div ref={paypalRef} className="w-full" />;
}

// Extend Window interface to include PayPal
declare global {
  interface Window {
    paypal: unknown;
  }
}
