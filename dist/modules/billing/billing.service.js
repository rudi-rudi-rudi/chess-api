var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { DatabaseService } from '../../database/database.service.js';
import { plans } from '../../database/schema.js';
let BillingService = class BillingService {
    dbs;
    stripe = null;
    constructor(dbs) {
        this.dbs = dbs;
    }
    getStripeClient() {
        if (this.stripe)
            return this.stripe;
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            throw new ServiceUnavailableException('Missing STRIPE_SECRET_KEY for billing actions');
        }
        this.stripe = new Stripe(secretKey);
        return this.stripe;
    }
    async ensureStripeCustomer(userId, email, name) {
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
        }
        else {
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
    async createCheckoutSession(input) {
        const stripe = this.getStripeClient();
        const configuredPrice = process.env.STRIPE_PRICE_PRO;
        const priceId = input.priceId || configuredPrice;
        if (!priceId) {
            throw new BadRequestException('Missing priceId and STRIPE_PRICE_PRO env');
        }
        const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const customerId = await this.ensureStripeCustomer(input.userId, input.email, input.name);
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${appUrl}/dashboard?billing=success`,
            cancel_url: `${appUrl}/dashboard?billing=cancelled`,
            metadata: { userId: input.userId },
            allow_promotion_codes: true,
        });
        return {
            sessionId: session.id,
            url: session.url,
        };
    }
};
BillingService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DatabaseService])
], BillingService);
export { BillingService };
//# sourceMappingURL=billing.service.js.map