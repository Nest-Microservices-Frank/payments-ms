import { Controller, Get, Post, Request, Response } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentSessionDto } from './dto/payments-session.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern('create.payment.session')
  createPaymentSession(@Payload() paymentSessionDto: PaymentSessionDto) {
    return this.paymentsService.createPaymentSession(paymentSessionDto);
  }

  @Get('success')
  success() {
    return {
      ok: true,
      message: 'Payment successful',
    };
  }

  @Get('cancelled')
  cancelled() {
    return {
      ok: false,
      message: 'Payment canceled',
    };
  }

  @Post('webhook')
  webhook(@Request() request, @Response() response) {
    console.log('stripeWebHook');
    return this.paymentsService.stripeWebHook(request, response);
  }
}
