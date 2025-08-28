import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose'; // <-- Add this import

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.RESEND_API_KEY) {
  console.error('Environment variable not loaded. Exiting...');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI not set in environment. Exiting...');
  process.exit(1);
}

// Connect to MongoDB before anything else
await mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log('✅ Connected to MongoDB');

import { handleWebhook } from '../src/controllers/subscription.Controller.js';

const realDeletedSubscriptionEvent = {
  id: "evt_1RpvSPFGfbnmVSqEEqO5nIO1",
  type: 'customer.subscription.deleted',
  data: {
    object: {
      id: "sub_1RpvSPFGfbnmVSqEEqO5nIO1",
      object: "subscription",
      canceled_at: 1753726552,
      current_period_end: 1756404449,
      status: "canceled",
      customer: "cus_SlPH126LphU2yn",
      metadata: {
        planType: "premium"
      }
    }
  }
};

async function testWebhookHandler() {
  try {
    console.log('Testing webhook handler directly...');
    await handleWebhook(realDeletedSubscriptionEvent);
    console.log('✅ Webhook test completed successfully');
  } catch (error) {
    console.error('❌ Webhook test failed:', error);
  }
}

testWebhookHandler();