import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-09-30.clover",
});

export async function POST(req: Request) {
    try {
        const { amount, reservationId }: { amount: number; reservationId: string } = await req.json();

        const paymentIntent = await stripe.paymentIntents.create({
            amount, // in cents
            currency: "usd",
            metadata: { reservationId },
            automatic_payment_methods: { enabled: true },
        });

        return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Stripe error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.error("Unknown error:", error);
        return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
    }
}
