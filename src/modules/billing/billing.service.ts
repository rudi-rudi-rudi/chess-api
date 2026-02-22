import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { DatabaseService } from '../../database/database.service.js';
import { plans } from '../../database/schema.js';

@Injectable()
export class BillingService {
  private stripe: Stripe | null = null;

  constructor(private readonly dbs: DatabaseService) {}

  private getStripeClient(): Stripe {
    if (this.stripe) return this.stripe;

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new ServiceUnavailableException('Missing STRIPE_SECRET_KEY for billing actions');
    }

    this.stripe = new Stripe(secretKey);
    return this.stripe;
  }

  async ensureStripeCustomer(userId: string, email: string, name?: string) {
    const [currentPlan] = await this.dbs.db
      .select({ stripeCustomerId: plans.stripeCustomerId, tier: plans.tier, status: plans.status })
      .from(plans)
      .where(eq(plans.userId, userId))
      .limit(1);

    if (currentPlan?.stripeCustomerId) {
      return currentPlan.stripeCustomerId;
    }

    const customer = await this.getStripeClient().customers.create({
      email,
      name,
      metadata: { userId },
    });

    if (currentPlan) {
      await this.dbs.db
        .update(plans)
        .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
        .where(eq(plans.userId, userId));
    } else {
      await this.dbs.db.insert(plans).values({
        userId,
        tier: 'free',
        status: 'active',
        stripeCustomerId: customer.id,
        updatedAt: new Date(),
      });
    }

    return customer.id;
  }
}
