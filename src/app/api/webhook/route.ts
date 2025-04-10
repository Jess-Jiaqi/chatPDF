import { headers } from "next/headers";
import { Stripe } from "stripe";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userSubsriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SIGNING_SECRET as string
    );
  } catch (error) {
    return new NextResponse("Webhook error", { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // new sub created
  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
    if (!session?.metadata?.userId) {
      return new NextResponse("UserId not found", { status: 400 });
    }
    const currentPeriodEnd = subscription.items.data[0].current_period_end;

    await db.insert(userSubsriptions).values({
      userId: session.metadata.userId,
      stripeSubstriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(currentPeriodEnd * 1000),
    })
  }

  if (event.type === "invoice.payment_succeeded") {
    
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    )
    const currentPeriodEnd = subscription.items.data[0].current_period_end;

    await db.update(userSubsriptions).set({
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(currentPeriodEnd * 1000),
    }).where(eq(userSubsriptions.stripeSubstriptionId, subscription.id))
  }

  return new NextResponse("Webhook received", { status: 200 });
}
