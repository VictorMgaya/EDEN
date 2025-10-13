#!/usr/bin/env node

/**
 * Stripe Product Setup Script
 *
 * This script creates the necessary Stripe products and prices for the subscription plans
 * and updates the .env.local file with the real Price IDs.
 *
 * Usage: node scripts/setup-stripe-products.js
 */

import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe products and prices...\n');

  try {
    // Check if Stripe secret key is configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') === false) {
      console.error('❌ STRIPE_SECRET_KEY not properly configured in .env.local');
      console.log('Please add your Stripe secret key to .env.local:');
      console.log('STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here');
      process.exit(1);
    }

    // Create Pro Plan Product
    console.log('📦 Creating Pro Plan product...');
    const proProduct = await stripe.products.create({
      name: 'Pro Plan',
      description: 'Pro subscription plan with unlimited usage and priority support',
      metadata: {
        plan: 'pro',
        features: 'unlimited_usage,priority_support,advanced_features,api_access'
      }
    });

    // Create Pro Plan Price ($29/month)
    console.log('💰 Creating Pro Plan price...');
    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 2900, // $29.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        plan: 'pro'
      }
    });

    // Create Enterprise Plan Product
    console.log('📦 Creating Enterprise Plan product...');
    const enterpriseProduct = await stripe.products.create({
      name: 'Enterprise Plan',
      description: 'Enterprise subscription plan with custom integrations and dedicated support',
      metadata: {
        plan: 'enterprise',
        features: 'everything_in_pro,custom_integrations,dedicated_support,sla_guarantee,white_label'
      }
    });

    // Create Enterprise Plan Price ($99/month)
    console.log('💰 Creating Enterprise Plan price...');
    const enterprisePrice = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 9900, // $99.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        plan: 'enterprise'
      }
    });

    console.log('\n✅ Products and prices created successfully!');
    console.log('\n📋 Product Details:');
    console.log(`Pro Plan: ${proProduct.name} - $${proPrice.unit_amount / 100}/${proPrice.recurring.interval}`);
    console.log(`  Price ID: ${proPrice.id}`);
    console.log(`Enterprise Plan: ${enterpriseProduct.name} - $${enterprisePrice.unit_amount / 100}/${enterprisePrice.recurring.interval}`);
    console.log(`  Price ID: ${enterprisePrice.id}`);

    // Update .env.local file
    console.log('\n🔧 Updating .env.local file...');

    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Update or add the price IDs
    const proPriceLine = `STRIPE_PRO_PRICE_ID=${proPrice.id}`;
    const enterprisePriceLine = `STRIPE_ENTERPRISE_PRICE_ID=${enterprisePrice.id}`;

    // Remove existing price ID lines
    envContent = envContent.replace(/STRIPE_PRO_PRICE_ID=.*/g, '');
    envContent = envContent.replace(/STRIPE_ENTERPRISE_PRICE_ID=.*/g, '');

    // Add new price ID lines
    envContent = envContent.trim() + '\n\n# Stripe Price IDs (auto-generated)\n';
    envContent += proPriceLine + '\n';
    envContent += enterprisePriceLine + '\n';

    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ .env.local file updated successfully!');
    console.log('\n🎉 Setup complete! You can now accept subscription payments.');
    console.log('\n📝 Next steps:');
    console.log('1. Set up Stripe webhook endpoint (see STRIPE_SETUP_README.md)');
    console.log('2. Test subscription purchases in your application');
    console.log('3. Monitor webhook events in your Stripe dashboard');

    console.log('\n🔗 Webhook endpoint URL should be:');
    console.log(`https://yourdomain.com/api/webhooks/stripe`);

  } catch (error) {
    console.error('\n❌ Error setting up Stripe products:', error.message);

    if (error.message.includes('Invalid API Key')) {
      console.log('\n💡 Make sure your STRIPE_SECRET_KEY in .env.local is correct');
      console.log('You can find your secret key at: https://dashboard.stripe.com/apikeys');
    }

    process.exit(1);
  }
}

// Run the setup
setupStripeProducts();
