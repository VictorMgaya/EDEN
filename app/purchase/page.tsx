/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, CreditCard, Crown, Building2, Loader2 } from 'lucide-react';

export default function PurchasePage() {
  const [selectedCredits, setSelectedCredits] = useState<number>(100);
  const [customCredits, setCustomCredits] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');

  // Credit packages
  const creditPackages = [
    { amount: 100, bonus: 0, popular: false },
    { amount: 500, bonus: 50, popular: true },
    { amount: 1000, bonus: 150, popular: false },
    { amount: 2500, bonus: 500, popular: false },
  ];

  // Subscription plans
  const subscriptionPlans = [
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      period: 'month',
      features: [
        'Unlimited usage',
        'Priority support',
        'Advanced features',
        'API access',
      ],
      icon: Crown,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      period: 'month',
      features: [
        'Everything in Pro',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantee',
        'White-label options',
      ],
      icon: Building2,
      color: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    },
  ];

  const calculateCreditValue = (credits: number) => {
    return Math.ceil(credits / 500); // 500 credits = 1 USD
  };

  const handleCreditPurchase = async (credits: number) => {
    setIsProcessing(true);
    try {
      // Get user session information
      const userEmail = localStorage.getItem('userEmail') || 'guest@example.com';
      const userId = localStorage.getItem('userId') || 'guest';

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
          'x-user-id': userId,
        },
        body: JSON.stringify({
          type: 'credits',
          credits: credits.toString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      alert(`Payment failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubscriptionPurchase = async (planId: string) => {
    setIsProcessing(true);
    try {
      // Get user session information
      const userEmail = localStorage.getItem('userEmail') || 'guest@example.com';
      const userId = localStorage.getItem('userId') || 'guest';

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
          'x-user-id': userId,
        },
        body: JSON.stringify({
          type: 'subscription',
          plan: planId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.error === 'Subscription not configured') {
        alert(`Subscription Setup Required:\n\n${data.message}\n\nPlease contact support or check the setup documentation.`);
      } else {
        alert('Subscription setup failed. Please try again.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      alert(`Subscription failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomCreditPurchase = () => {
    const credits = parseInt(customCredits);
    if (credits >= 100) {
      handleCreditPurchase(credits);
    } else {
      alert('Minimum purchase is 100 credits');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Get the credits you need or unlock unlimited access with our subscription plans
          </p>
        </div>

        {/* Payment Method Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm">
            <div className="flex space-x-1">
              <button
                onClick={() => setPaymentMethod('stripe')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  paymentMethod === 'stripe'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Stripe
              </button>
              <button
                onClick={() => setPaymentMethod('paypal')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  paymentMethod === 'paypal'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                PayPal
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Credits Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CreditCard className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-2xl">Purchase Credits</CardTitle>
              </div>
              <CardDescription>
                Buy credits to use our services. 500 credits = $1 USD
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Credit Packages */}
              <div className="grid grid-cols-2 gap-4">
                {creditPackages.map((pkg) => (
                  <div
                    key={pkg.amount}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedCredits === pkg.amount
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    } ${pkg.popular ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}
                    onClick={() => setSelectedCredits(pkg.amount)}
                  >
                    {pkg.popular && (
                      <Badge className="absolute -top-2 -right-2 bg-blue-600">
                        Popular
                      </Badge>
                    )}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {pkg.amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        +{pkg.bonus} bonus
                      </div>
                      <div className="text-lg font-semibold text-green-600 mt-2">
                        ${calculateCreditValue(pkg.amount + pkg.bonus)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Custom Credits */}
              <div className="space-y-4">
                <Label htmlFor="custom-credits">Custom Amount (min. 100 credits)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="custom-credits"
                    type="number"
                    placeholder="Enter credits"
                    value={customCredits}
                    onChange={(e) => setCustomCredits(e.target.value)}
                    min="100"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleCustomCreditPurchase}
                    disabled={!customCredits || parseInt(customCredits) < 100 || isProcessing}
                    className="px-6"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Buy ${customCredits ? calculateCreditValue(parseInt(customCredits)) : 0}
                  </Button>
                </div>
              </div>

              {/* Selected Credits Purchase */}
              {selectedCredits && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => handleCreditPurchase(selectedCredits)}
                    disabled={isProcessing}
                    className="w-full text-lg py-6"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Purchase {selectedCredits.toLocaleString()} Credits for $
                        {calculateCreditValue(selectedCredits)}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Plans */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-slate-100">
              Subscription Plans
            </h2>
            <p className="text-center text-slate-600 dark:text-slate-400">
              Unlock unlimited access with our subscription plans
            </p>

            {subscriptionPlans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card key={plan.id} className="shadow-lg relative overflow-hidden">
                  <div className={`absolute inset-x-0 top-0 h-1 ${plan.color}`} />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${plan.color}`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{plan.name}</CardTitle>
                          <CardDescription>
                            ${plan.price}/{plan.period}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handleSubscriptionPurchase(plan.id)}
                      disabled={isProcessing}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        `Subscribe to ${plan.name}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Success/Cancel URLs Note */}
        <div className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>
            After payment, you'll be redirected to our success page or can cancel and return here.
          </p>
        </div>
      </div>
    </div>
  );
}
