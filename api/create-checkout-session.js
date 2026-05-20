// api/create-checkout-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { items, customer, successUrl, cancelUrl } = req.body;

  if (!items?.length) {
    return res.status(400).json({ error: 'Carrinho vazio.' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customer?.email,
      line_items: items.map((item) => ({
        price_data: {
          currency: 'brl',
          product_data: {
            name: `${item.name} (${item.size})`,
          },
          unit_amount: Math.round(item.price * 100), // centavos
        },
        quantity: item.qty,
      })),
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    res.status(200).json({ sessionUrl: session.url });
  } catch (err) {
    console.error('[Stripe] Erro:', err.message);
    res.status(500).json({ error: err.message });
  }
}