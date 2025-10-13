/* eslint-disable react/no-unescaped-entities */
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function PurchaseCancelledPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-slate-600" />
            </div>
            <CardTitle className="text-3xl text-slate-800 dark:text-slate-200">
              Payment Cancelled
            </CardTitle>
            <CardDescription className="text-lg">
              Your payment was cancelled. No charges were made to your account.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Information */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-800 dark:text-blue-200">
                What happened?
              </h3>
              <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                <li>• You cancelled the payment process</li>
                <li>• No payment was processed</li>
                <li>• Your account remains unchanged</li>
                <li>• You can try again whenever you're ready</li>
              </ul>
            </div>

            {/* Options */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">
                What would you like to do?
              </h3>
              <div className="space-y-3">
                <Link href="/purchase" className="block">
                  <Button className="w-full justify-start" size="lg">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Payment Again
                  </Button>
                </Link>
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full justify-start" size="lg">
                    <Home className="h-4 w-4 mr-2" />
                    Return to Dashboard
                  </Button>
                </Link>
              </div>
            </div>

            {/* Support Info */}
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-6 border-t">
              <p>
                Need help? Contact our support team if you experienced any issues during the payment process.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
