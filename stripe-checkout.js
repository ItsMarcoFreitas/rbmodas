/*
   stripe-checkout.js
   Integração Stripe Checkout usando backend externo em /api/create-checkout-session.
*/

(function () {
  "use strict";

  function getCheckoutUrls() {
    const origin = window.location.origin;
    const base = window.location.pathname.replace(/\/[^/]*$/, "") || "";

    return {
      successUrl: `${origin}${base}/sucesso.html?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}${base}/cancelado.html`,
    };
  }

  async function createCheckoutSession(payload) {
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Erro ao criar sessão de pagamento.");
    }

    return data;
  }

  async function submitOrder() {
    if (typeof cart === "undefined" || cart.length === 0) {
      alert("Seu carrinho está vazio.");
      return false;
    }

    if (window.location.protocol === "file:") {
      alert("Para pagar com Stripe, abra o site em um servidor local ou hospedado, não direto pelo arquivo.");
      return false;
    }

    const name = document.getElementById("checkoutName")?.value.trim();
    const email = document.getElementById("checkoutEmail")?.value.trim();
    const cep = document.getElementById("checkoutCep")?.value.trim();
    const address = document.getElementById("checkoutAddress")?.value.trim();

    if (!name || !email || !cep || !address) {
      alert("Preencha todos os dados de entrega.");
      return false;
    }

    const btn = document.getElementById("checkoutSubmitBtn");
    const originalText = btn?.textContent || "Finalizar Compra";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Aguarde...";
    }

    try {
      const checkout = await createCheckoutSession({
        items: cart.map((c) => ({
          id: c.id,
          name: c.name,
          team: c.team,
          size: c.size,
          qty: c.qty,
          price: c.price,
        })),
        customer: { name, email, cep, address },
        ...getCheckoutUrls(),
      });

      if (!checkout.sessionUrl) {
        throw new Error("URL de pagamento não retornada.");
      }

      window.location.href = checkout.sessionUrl;
      return true;
    } catch (err) {
      console.error("[Stripe] Erro ao criar sessão:", err);
      alert("Não foi possível iniciar o pagamento: " + (err.message || "erro desconhecido"));
      return false;
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    }
  }

  window.submitOrder = submitOrder;
  console.log("[Stripe] Checkout externo instalado.");
})();
