import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Body1,
  Button,
  Card,
  CardHeader,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Radio,
  RadioGroup,
  Title1,
  Title3,
} from '@fluentui/react-components';
import {
  ArrowLeftRegular,
  ArrowRightRegular,
  CartRegular,
  DeleteRegular,
  LocationRegular,
  StoreMicrosoftRegular,
} from '@fluentui/react-icons';
import { api } from '../api';
import type { CartItem, Fulfillment, StoreOrder } from '../api/types';
import { StateView } from '../components/StateView';
import { useApiData } from '../hooks/useApiData';
import { STORE_ADDRESS } from '../constants/store';

const inr = (amount: number) => `Rs ${amount.toLocaleString('en-IN')}`;

type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: 'INR';
  name: string;
  description: string;
  order_id: string;
  theme: { color: string };
  handler: (response: RazorpaySuccess) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CartPage() {
  const navigate = useNavigate();
  const { data: items, loading, error, retry } = useApiData(() => api.getCart());
  const [fulfillment, setFulfillment] = useState<Fulfillment>('delivery');
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [checkoutOrder, setCheckoutOrder] = useState<StoreOrder | null>(null);
  const subtotal = (items ?? []).reduce((total, item) => total + item.product.price * item.quantity, 0);
  const deliveryFee = fulfillment === 'delivery' && subtotal > 0 ? 49 : 0;

  const refreshCart = () => {
    retry();
  };

  const updateQuantity = async (item: CartItem, quantity: number) => {
    if (quantity < 1 && !window.confirm(`Remove ${item.product.model} from your cart?`)) return;
    setActionError(null);
    try {
      await api.updateCartQuantity(item.product.id, quantity);
      refreshCart();
    } catch (reason: unknown) {
      setActionError(reason instanceof Error ? reason.message : 'Could not update your cart.');
    }
  };

  const checkout = async () => {
    setWorking(true);
    setActionError(null);
    setConfirmation(null);
    try {
      const order = await api.createOrder(fulfillment, subtotal + deliveryFee);
      if (import.meta.env.VITE_API_BASE_URL) {
        const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
        if (!key) {
          setActionError('Live checkout is not configured yet. Add the public VITE_RAZORPAY_KEY_ID to your build settings.');
          return;
        }
        const loaded = await loadRazorpay();
        if (!loaded || !window.Razorpay) throw new Error('Secure checkout could not be loaded. Please try again.');
        const RazorpayCheckout = window.Razorpay;
        new RazorpayCheckout({
          key,
          amount: order.amount * 100,
          currency: 'INR',
          name: 'SWARUPANANDA ELECTRONICS',
          description: 'Mobile phone purchase',
          order_id: order.id,
          theme: { color: '#123B66' },
          handler: (payment) => {
            void finishPayment(
              payment.razorpay_order_id || order.id,
              payment.razorpay_payment_id,
              payment.razorpay_signature,
            );
          },
        }).open();
      } else {
        setCheckoutOrder(order);
      }
    } catch (reason: unknown) {
      setActionError(reason instanceof Error ? reason.message : 'Checkout could not be completed. Please try again.');
    } finally {
      setWorking(false);
    }
  };

  const finishPayment = async (orderId: string, paymentId: string, signature: string) => {
    setWorking(true);
    setActionError(null);
    try {
      const result = await api.verifyPayment(orderId, paymentId, signature);
      setCheckoutOrder(null);
      setConfirmation(result.verified ? `Payment confirmed. Your order ${result.order.id} is ready.` : 'Payment verification is still pending.');
    } catch (reason: unknown) {
      setActionError(reason instanceof Error ? reason.message : 'We could not verify this payment. Please contact support.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div><span className="section-kicker">YOUR SELECTION</span><Title1>Your cart</Title1></div>
        <Button appearance="subtle" icon={<ArrowLeftRegular />} onClick={() => navigate('/')}>Continue shopping</Button>
      </div>
      <StateView
        loading={loading}
        error={error}
        empty={(items ?? []).length === 0}
        onRetry={retry}
        onEmptyAction={() => { window.location.assign('/'); }}
        emptyActionLabel="Browse phones"
        emptyTitle="Your cart is waiting"
        emptyDescription="Explore the collection and add a phone to continue."
      >
        <div className="cart-layout">
          <section className="cart-items-section" aria-label="Items in your cart">
            {(items ?? []).map((item) => (
              <Card className="cart-item-card" key={item.product.id}>
                <img className="cart-item-image" src={item.product.image} alt={`${item.product.brand} ${item.product.model}`} />
                <div className="cart-item-details">
                  <CardHeader
                    header={<Title3>{item.product.brand} {item.product.model}</Title3>}
                    description={<Body1>{item.product.storage} · {item.product.ram} RAM · {item.product.battery}</Body1>}
                  />
                  <strong className="cart-item-price">{inr(item.product.price)}</strong>
                  <div className="quantity-controls" aria-label={`Quantity for ${item.product.model}`}>
                    <Button size="small" appearance="outline" aria-label="Decrease quantity" onClick={() => void updateQuantity(item, item.quantity - 1)}>−</Button>
                    <span>{item.quantity}</span>
                    <Button size="small" appearance="outline" aria-label="Increase quantity" onClick={() => void updateQuantity(item, item.quantity + 1)}>+</Button>
                    <Button size="small" appearance="subtle" icon={<DeleteRegular />} onClick={() => void updateQuantity(item, 0)}>Remove</Button>
                  </div>
                </div>
              </Card>
            ))}
          </section>
          <Card className="fulfillment-card" appearance="outline">
            <div className="panel-title"><LocationRegular /><Title3>How would you like it?</Title3></div>
            <Field label="Choose fulfilment">
              <RadioGroup value={fulfillment} onChange={(_, data) => setFulfillment(data.value as Fulfillment)}>
                <Radio value="delivery" label="Home delivery" />
                <div className="fulfillment-detail">
                  <strong>Contai, Purba Medinipur</strong><span>Delivery timing confirmed after order · {inr(49)}</span>
                </div>
                <Radio value="pickup" label="Pick up in store" />
                <div className="fulfillment-detail">
                  <strong>{STORE_ADDRESS}</strong><span>Confirm collection time with our team · Free pickup</span>
                </div>
              </RadioGroup>
            </Field>
            <div className="pickup-note"><StoreMicrosoftRegular /><span>We will keep your phone ready and send a collection update.</span></div>
            <div className="order-totals">
              <div><span>Subtotal</span><strong>{inr(subtotal)}</strong></div>
              <div><span>Delivery</span><strong>{deliveryFee === 0 ? 'Free' : inr(deliveryFee)}</strong></div>
              <div className="grand-total"><span>Total</span><strong>{inr(subtotal + deliveryFee)}</strong></div>
            </div>
            {actionError && <p className="form-error" role="alert">{actionError}</p>}
            {confirmation && <p className="success-message" role="status">{confirmation}</p>}
            <Button
              className="checkout-button"
              appearance="primary"
              icon={<ArrowRightRegular />}
              disabled={working || subtotal === 0}
              onClick={() => void checkout()}
            >
              {working ? 'Preparing secure checkout…' : 'Continue to secure checkout'}
            </Button>
            <small className="secure-note"><CartRegular /> Secure checkout · Payment verification enabled</small>
          </Card>
        </div>
      </StateView>
      <Dialog
        open={checkoutOrder !== null}
        onOpenChange={(_, data) => { if (!data.open) setCheckoutOrder(null); }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Secure checkout</DialogTitle>
            <DialogContent>
              <div className="checkout-modal-content">
                <span className="checkout-modal-icon"><CartRegular /></span>
                <Title3>Complete your order</Title3>
                <Body1>{fulfillment === 'delivery' ? 'Your home delivery in Contai, Purba Medinipur is reserved.' : `Your pickup at ${STORE_ADDRESS} is reserved.`}</Body1>
                <strong className="checkout-modal-amount">{inr(checkoutOrder?.amount ?? 0)}</strong>
                <p>Demo checkout only — no payment will be charged.</p>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setCheckoutOrder(null)}>Cancel</Button>
              <Button
                appearance="primary"
                disabled={working || !checkoutOrder}
                onClick={() => {
                  if (checkoutOrder) void finishPayment(checkoutOrder.id, 'demo-payment', 'demo-signature');
                }}
              >
                {working ? 'Verifying payment…' : 'Complete demo payment'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      <Button appearance="subtle" icon={<ArrowLeftRegular />} onClick={() => navigate('/')}>Back to the phone collection</Button>
    </div>
  );
}
