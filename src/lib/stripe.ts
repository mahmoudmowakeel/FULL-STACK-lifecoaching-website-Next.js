import Stripe from 'stripe';

// Check if the secret key is available
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    // Remove apiVersion or use the correct one from your Stripe dashboard
    typescript: true,
});