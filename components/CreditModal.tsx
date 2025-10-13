/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState } from 'react';
import { X, Star, Zap } from 'react-feather';

interface CreditModalProps {
    isOpen: boolean;
    onClose: () => void;
    credits: number;
    subscription: string;
}

export default function CreditModal({ isOpen, onClose, credits, subscription }: CreditModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');

    const handleSubscriptionCheckout = async (planId: string) => {
        setIsLoading(true);
        try {
            const paymentType = paymentMethod === 'stripe' ? 'subscription' : 'paypal_subscription';

            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: paymentType,
                    plan: planId
                }),
            });

            const data = await response.json();

            if (paymentMethod === 'stripe') {
                if (data.url) {
                    window.location.href = data.url;
                }
            } else if (paymentMethod === 'paypal') {
                if (data.approvalUrl) {
                    window.location.href = data.approvalUrl;
                } else {
                    throw new Error('No approval URL received from PayPal');
                }
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment failed. Please try again.');
            setIsLoading(false);
        }
    };

    const handleCreditPurchase = async (amount: number) => {
        setIsLoading(true);
        try {
            const paymentType = paymentMethod === 'stripe' ? 'credits' : 'paypal_credits';

            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: paymentType,
                    credits: amount.toString()
                }),
            });

            const data = await response.json();

            if (paymentMethod === 'stripe') {
                if (data.url) {
                    window.location.href = data.url;
                }
            } else if (paymentMethod === 'paypal') {
                if (data.approvalUrl) {
                    window.location.href = data.approvalUrl;
                } else {
                    throw new Error('No approval URL received from PayPal');
                }
            }
        } catch (error) {
            console.error('Credit purchase error:', error);
            alert('Credit purchase failed. Please try again.');
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Credits Exhausted
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    You have {credits} credits remaining
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Payment Method Selector */}
                <div className="px-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-center">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => setPaymentMethod('stripe')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        paymentMethod === 'stripe'
                                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                                    }`}
                                >
                                    Stripe
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('paypal')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        paymentMethod === 'paypal'
                                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                                    }`}
                                >
                                    PayPal
                                </button>
                            </div>
                        </div>
                    </div>

                    {paymentMethod === 'paypal' && (
                        <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
                            <p className="text-blue-800 dark:text-blue-200 text-xs">
                                You'll be redirected to PayPal's secure website to complete your payment
                            </p>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                        <p className="text-red-800 dark:text-red-300 text-sm font-medium">
                            You need credits to continue chatting with our AI Expert.
                        </p>
                    </div>

                    {subscription === 'freemium' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                🚀 Upgrade to Pro
                            </h3>

                            <div className="grid gap-3">
                                <button
                                    onClick={() => handleSubscriptionCheckout('pro')}
                                    disabled={isLoading}
                                    className={`w-full p-4 text-white rounded-lg transition-all disabled:opacity-50 ${
                                        paymentMethod === 'paypal'
                                            ? 'bg-blue-600 hover:bg-blue-700'
                                            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold">
                                                Pro Subscription {paymentMethod === 'paypal' ? '(PayPal)' : '(Stripe)'}
                                            </div>
                                            <div className="text-sm opacity-90">$29/month</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold">Unlimited</div>
                                            <div className="text-xs opacity-90">Credits</div>
                                        </div>
                                    </div>
                                    <div className="text-xs mt-2 opacity-75">
                                        ✨ Intensive analysis, priority support
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleSubscriptionCheckout('enterprise')}
                                    disabled={isLoading}
                                    className={`w-full p-4 text-white rounded-lg transition-all disabled:opacity-50 ${
                                        paymentMethod === 'paypal'
                                            ? 'bg-blue-600 hover:bg-blue-700'
                                            : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold">
                                                Enterprise {paymentMethod === 'paypal' ? '(PayPal)' : '(Stripe)'}
                                            </div>
                                            <div className="text-sm opacity-90">$99/month</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold">Priority</div>
                                            <div className="text-xs opacity-90">Support</div>
                                        </div>
                                    </div>
                                    <div className="text-xs mt-2 opacity-75">
                                        💼 Custom integrations, partnership benefits
                                    </div>
                                </button>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                    💎 Buy Credits
                                </h3>

                                <div className="grid gap-2">
                                    <button
                                        onClick={() => handleCreditPurchase(100)}
                                        disabled={isLoading}
                                        className={`w-full p-3 text-white rounded-lg transition-all disabled:opacity-50 ${
                                            paymentMethod === 'paypal'
                                                ? 'bg-blue-600 hover:bg-blue-700'
                                                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold">100 Credits</div>
                                            <div className="text-right">
                                                <div className="font-bold">$0.20</div>
                                                <div className="text-xs">($0.002/credit)</div>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleCreditPurchase(500)}
                                        disabled={isLoading}
                                        className={`w-full p-3 text-white rounded-lg transition-all disabled:opacity-50 ${
                                            paymentMethod === 'paypal'
                                                ? 'bg-blue-600 hover:bg-blue-700'
                                                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold">500 Credits</div>
                                            <div className="text-right">
                                                <div className="font-bold">$1.00</div>
                                                <div className="text-xs">(500 credits = $1)</div>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleCreditPurchase(1000)}
                                        disabled={isLoading}
                                        className={`w-full p-3 text-white rounded-lg transition-all disabled:opacity-50 ${
                                            paymentMethod === 'paypal'
                                                ? 'bg-blue-600 hover:bg-blue-700'
                                                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold">1,000 Credits</div>
                                            <div className="text-right">
                                                <div className="font-bold">$1.80</div>
                                                <div className="text-xs">($0.0018/credit)</div>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleCreditPurchase(2500)}
                                        disabled={isLoading}
                                        className={`w-full p-3 text-white rounded-lg transition-all disabled:opacity-50 ${
                                            paymentMethod === 'paypal'
                                                ? 'bg-blue-600 hover:bg-blue-700'
                                                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold">2,500 Credits</div>
                                            <div className="text-right">
                                                <div className="font-bold">$4.00</div>
                                                <div className="text-xs">Best value</div>
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                                    Minimum purchase: 100 credits ($0.20)
                                </p>
                            </div>
                        </div>
                    )}

                    {subscription !== 'freemium' && (
                        <div className="text-center space-y-4">
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Star className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    <span className="font-semibold text-green-800 dark:text-green-300 capitalize">
                                        {subscription} Member
                                    </span>
                                </div>
                                <p className="text-green-700 dark:text-green-300 text-sm">
                                    Your credits will refresh automatically. Continue enjoying unlimited expert advice!
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full p-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
                            >
                                Continue Using Expert
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
