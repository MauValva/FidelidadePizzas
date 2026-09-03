"use client";

import { useState } from "react";
import { FLAVORS, FlavorId, LOYALTY_GOAL, PIZZA_PRICE, PublicCustomer } from "@/types";
import { buildOrderMessage, buildWhatsappUrl, formatMoney } from "@/lib/whatsapp";

type Props = {
  customer: PublicCustomer;
  businessPhone: string;
};

export function CustomerCard({ customer, businessPhone }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<FlavorId, number>>({
    calabresa: 0,
    mussarela: 0,
    mista: 0,
  });
  const [rewardFlavor, setRewardFlavor] = useState<FlavorId>("calabresa");
  const [sending, setSending] = useState(false);

  const isRewardOrder = customer.rewardAvailable;
  const items = FLAVORS.map((f) => ({ flavor: f.id, quantity: quantities[f.id] }));
  const total = items.reduce((sum, i) => sum + i.quantity * PIZZA_PRICE, 0);
  const remaining = LOYALTY_GOAL - customer.loyaltyPoints;

  function updateQty(flavor: FlavorId, delta: number) {
    setQuantities((prev) => ({
      ...prev,
      [flavor]: Math.max(0, prev[flavor] + delta),
    }));
  }

  function openOrderModal() {
    setQuantities({ calabresa: 0, mussarela: 0, mista: 0 });
    setRewardFlavor("calabresa");
    setModalOpen(true);
  }

  async function handleSendWhatsapp() {
    setSending(true);
    try {
      const { message } = buildOrderMessage({
        customer,
        items,
        rewardFlavor: isRewardOrder ? rewardFlavor : null,
      });

      // Registra o pedido para o admin conferir depois (não altera pontos)
      await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: customer.uniqueToken,
          items,
          rewardFlavor: isRewardOrder ? rewardFlavor : null,
        }),
      }).catch(() => {
        // Se o log falhar, ainda deixamos o cliente enviar a mensagem
      });

      window.open(buildWhatsappUrl(businessPhone, message), "_blank");
      setModalOpen(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "var(--dough)" }}>
      <div
        style={{
          background: "var(--char)",
          color: "var(--dough)",
          padding: "28px 22px 34px",
        }}
      >
        <p style={{ fontSize: 13, color: "var(--cheese)", fontWeight: 600, margin: "0 0 6px" }}>
          Atelier do Pão
        </p>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>Olá, {customer.name}!</h1>
        <p style={{ marginTop: 2, fontSize: 15, color: "rgba(251,243,230,0.7)" }}>
          Bloco {customer.block} — Apartamento {customer.apartment}
        </p>
      </div>

      <div
        style={{
          margin: "-20px 16px 0",
          background: "white",
          borderRadius: 20,
          boxShadow: "var(--shadow)",
          padding: "22px 20px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 600, lineHeight: 1 }}>
          {customer.loyaltyPoints}
          <small style={{ fontSize: 16, fontWeight: 400, color: "var(--crust-soft)" }}>
            /{LOYALTY_GOAL} pizzas
          </small>
        </div>

        <div style={{ display: "flex", gap: 7, margin: "14px 0", flexWrap: "wrap" }}>
          {Array.from({ length: LOYALTY_GOAL }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: i < customer.loyaltyPoints ? "var(--basil)" : "var(--dough-deep)",
                border: `1.5px solid ${i < customer.loyaltyPoints ? "var(--basil)" : "var(--line)"}`,
              }}
            />
          ))}
        </div>

        {isRewardOrder ? (
          <div
            style={{
              background: "linear-gradient(135deg, var(--tomato) 0%, var(--tomato-deep) 100%)",
              color: "white",
              borderRadius: 16,
              padding: 18,
              textAlign: "center",
            }}
          >
            <h2 style={{ margin: "0 0 4px", fontSize: 20, color: "var(--cheese)" }}>
              Você ganhou uma pizza! 🎉
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.9)" }}>
              Escolha o sabor da sua pizza grátis e monte seu pedido.
            </p>
          </div>
        ) : (
          <p style={{ fontSize: 14.5, color: "var(--crust-soft)", margin: 0 }}>
            Faltam apenas <b style={{ color: "var(--tomato-deep)" }}>{remaining} pizza{remaining === 1 ? "" : "s"}</b>{" "}
            para você ganhar uma pizza grátis 🎁
          </p>
        )}

        <button
          onClick={openOrderModal}
          style={{
            width: "100%",
            marginTop: 18,
            background: "var(--tomato)",
            color: "white",
            border: "none",
            padding: 16,
            borderRadius: 14,
            fontSize: 16.5,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 6px 16px rgba(193,68,45,0.35)",
          }}
        >
          🍕 {isRewardOrder ? "Resgatar minha pizza grátis" : "Fazer pedido"}
        </button>
      </div>

      <div style={{ padding: "22px 20px 40px" }}>
        <h3 style={{ fontSize: 16, margin: "0 0 4px" }}>Nossos sabores</h3>
        <p style={{ fontSize: 13.5, color: "var(--crust-soft)", margin: "0 0 14px" }}>
          Pizza de tamanho único, entregue no seu apartamento
        </p>
        {FLAVORS.map((f) => (
          <div
            key={f.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 0",
              borderBottom: "1px solid var(--line)",
              fontSize: 15,
            }}
          >
            <span>{f.name}</span>
            <span style={{ color: "var(--tomato-deep)", fontWeight: 600, fontSize: 14 }}>
              {formatMoney(PIZZA_PRICE)}
            </span>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(36,21,18,0.55)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "var(--dough)",
              width: "100%",
              maxWidth: 480,
              borderRadius: "22px 22px 0 0",
              padding: "22px 20px 26px",
              maxHeight: "88vh",
              overflowY: "auto",
              position: "relative",
            }}
          >
            <button
              onClick={() => setModalOpen(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 18,
                background: "none",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
                color: "var(--crust-soft)",
              }}
            >
              ✕
            </button>
            <h2 style={{ margin: "0 0 16px", fontSize: 21 }}>
              {isRewardOrder ? "Sua pizza grátis 🎁" : "Fazer pedido"}
            </h2>

            {isRewardOrder && (
              <>
                <p style={{ margin: "-8px 0 14px", color: "var(--crust-soft)", fontSize: 13.5 }}>
                  Escolha o sabor da sua pizza grátis:
                </p>
                {FLAVORS.map((f) => (
                  <label
                    key={f.id}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", fontSize: 15 }}
                  >
                    <input
                      type="radio"
                      name="rewardFlavor"
                      checked={rewardFlavor === f.id}
                      onChange={() => setRewardFlavor(f.id)}
                      style={{ width: 18, height: 18, accentColor: "var(--tomato)" }}
                    />
                    {f.name}
                  </label>
                ))}
                <p style={{ margin: "16px 0 4px", color: "var(--crust-soft)", fontSize: 13.5 }}>
                  Pizzas adicionais (pagas):
                </p>
              </>
            )}

            {FLAVORS.map((f) => (
              <div
                key={f.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div>
                  <span style={{ fontSize: 15.5, fontWeight: 500 }}>{f.name}</span>
                  <span style={{ fontSize: 12.5, color: "var(--crust-soft)", display: "block", marginTop: 2 }}>
                    {formatMoney(PIZZA_PRICE)} cada
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    onClick={() => updateQty(f.id, -1)}
                    disabled={quantities[f.id] <= 0}
                    style={stepperBtnStyle(quantities[f.id] <= 0)}
                  >
                    −
                  </button>
                  <span style={{ minWidth: 18, textAlign: "center", fontWeight: 600, fontSize: 16 }}>
                    {quantities[f.id]}
                  </span>
                  <button onClick={() => updateQty(f.id, 1)} style={stepperBtnStyle(false)}>
                    +
                  </button>
                </div>
              </div>
            ))}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginTop: 18,
                paddingTop: 14,
                borderTop: "2px solid var(--crust)",
              }}
            >
              <span style={{ fontSize: 14, color: "var(--crust-soft)" }}>
                {isRewardOrder ? "Total (pizzas adicionais)" : "Total"}
              </span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600 }}>
                {formatMoney(total)}
              </span>
            </div>

            <button
              onClick={handleSendWhatsapp}
              disabled={sending}
              style={{
                width: "100%",
                marginTop: 18,
                background: "var(--tomato)",
                color: "white",
                border: "none",
                padding: 16,
                borderRadius: 14,
                fontSize: 16.5,
                fontWeight: 600,
                cursor: sending ? "default" : "pointer",
                opacity: sending ? 0.7 : 1,
              }}
            >
              {sending ? "Abrindo WhatsApp..." : "PEDIR PELO WHATSAPP"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function stepperBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "1.5px solid var(--tomato)",
    background: "white",
    color: "var(--tomato)",
    fontSize: 18,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.3 : 1,
    lineHeight: 1,
  };
}
