import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../../common/guards/session.guard.js';
import { BillingService } from './billing.service.js';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto.js';

@Controller('billing')
@UseGuards(SessionGuard)
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post('checkout-session')
  createCheckoutSession(@Req() req: any, @Body() body: CreateCheckoutSessionDto) {
    return this.billing.createCheckoutSession({
      userId: req.user.id,
      email: req.user.email,
      name: req.user.name,
      priceId: body.priceId,
    });
  }

  @Post('portal-session')
  createPortalSession(@Req() req: any) {
    return this.billing.createBillingPortalSession({
      userId: req.user.id,
      email: req.user.email,
      name: req.user.name,
    });
  }
}
