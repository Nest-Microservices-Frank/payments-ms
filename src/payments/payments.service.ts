import { Injectable } from '@nestjs/common';
import { envs } from 'src/config';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payments-session.dto';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripeSecret);

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { currency, items, orderId } = paymentSessionDto;

    const lineItems = items.map((item) => {
      return {
        price_data: {
          currency: currency,
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      };
    });

    const session = this.stripe.checkout.sessions.create({
      payment_intent_data: {
        metadata: {
          orderId: orderId,
        },
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: envs.stripeSuccessUrl,
      cancel_url: envs.stripeCancelUrl,
    });
    return session;
  }

  async stripeWebHook(request: Request, response: Response) {
    const sig = request.headers['stripe-signature'];
    let event: Stripe.Event;
    // const endpointSecret =
    //   'whsec_d046b759efb699d51ca8becafc7af1afe6c4741fbf8b66f462a91f42f14f6e16';
    const endpointSecret = envs.stripeEndpointSecretUrl;
    try {
      event = this.stripe.webhooks.constructEvent(
        request['rawBody'],
        sig,
        endpointSecret,
      );
      switch (event.type) {
        case 'charge.succeeded':
          const chargeSucceeded = event.data.object;
          console.log({
            metadata: chargeSucceeded.metadata,
            orderId: chargeSucceeded.metadata.orderId,
          });
          // Then define and call a function to handle the event charge.succeeded
          break;
        // ... handle other event types
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    } catch (error) {
      response.status(400).send(`Webhook Error: ${error.message}`);
      return;
    }
    return response.status(200).json({ sig });
  }
}
