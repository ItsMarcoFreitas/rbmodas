const Stripe = require("stripe");
const catalog = require("./product-catalog");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

function normalizeItem(item) {
  const qty = Number(item.qty);
  const product = catalog.find((entry) => (
    entry.id === String(item.id) &&
    entry.name === String(item.name) &&
    entry.team === String(item.team)
  ));

  if (!product || !Number.isInteger(qty) || qty <= 0) {
    return null;
  }

  const requestedSize = String(item.size || "M");
  const size = product.sizes.includes(requestedSize) ? requestedSize : product.sizes[0];

  return {
    id: product.id,
    name: product.name,
    team: product.team,
    size,
    qty,
    price: product.price,
  };
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "STRIPE_SECRET_KEY não configurada no servidor." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const items = Array.isArray(body?.items) ? body.items.map(normalizeItem).filter(Boolean) : [];
    const customer = body?.customer || {};
    const successUrl = body?.successUrl;
    const cancelUrl = body?.cancelUrl;

    if (!items.length) {
      return res.status(400).json({ error: "Carrinho vazio ou produtos inválidos." });
    }

    if (!customer.name || !customer.email || !customer.cep || !customer.address) {
      return res.status(400).json({ error: "Dados de entrega incompletos." });
    }

    if (!isValidUrl(successUrl) || !isValidUrl(cancelUrl)) {
      return res.status(400).json({ error: "URLs de retorno inválidas." });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      automatic_payment_methods: { enabled: true },
      customer_email: String(customer.email).slice(0, 254),
      line_items: items.map((item) => ({
        price_data: {
          currency: "brl",
          product_data: {
            name: `${item.name} - Tam. ${item.size}`,
            metadata: {
              productId: item.id,
              team: item.team,
            },
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.qty,
      })),
      metadata: {
        customerName: String(customer.name).slice(0, 120),
        customerCep: String(customer.cep).slice(0, 20),
        customerAddress: String(customer.address).slice(0, 250),
        orderItems: JSON.stringify(items.map((item) => ({
          id: item.id,
          name: item.name,
          team: item.team,
          size: item.size,
          qty: item.qty,
          price: item.price,
        }))).slice(0, 500),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return res.status(200).json({
      sessionId: session.id,
      sessionUrl: session.url,
    });
  } catch (error) {
    console.error("[Stripe] create-checkout-session:", error);
    return res.status(500).json({ error: "Não foi possível iniciar o pagamento." });
  }
};
