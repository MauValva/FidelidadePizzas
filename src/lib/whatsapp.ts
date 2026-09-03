import { FLAVORS, FlavorId, OrderItem, PIZZA_PRICE, PublicCustomer } from "@/types";

export function formatMoney(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function flavorName(id: FlavorId): string {
  return FLAVORS.find((f) => f.id === id)?.name ?? id;
}

/**
 * Monta a mensagem de pedido enviada ao WhatsApp do negócio.
 * Cobre os três cenários do briefing: pedido normal, pedido usando a
 * pizza grátis (com ou sem itens adicionais pagos).
 */
export function buildOrderMessage(params: {
  customer: Pick<PublicCustomer, "name" | "block" | "apartment">;
  pixKey?: string;
  items: OrderItem[]; // itens pagos
  rewardFlavor?: FlavorId | null; // preenchido quando é resgate de recompensa
}): { message: string; total: number } {
  const { customer, items, rewardFlavor, pixKey } = params;
  const nonZeroItems = items.filter((i) => i.quantity > 0);
  const total = nonZeroItems.reduce((sum, i) => sum + i.quantity * PIZZA_PRICE, 0);

  const lines: string[] = ["Olá! Gostaria de fazer um pedido de pizza. 🍕", ""];
  lines.push("📦 Entrega:");
  lines.push(`Bloco ${customer.block} — Apartamento ${customer.apartment}`);
  lines.push("");

  lines.push(`Cliente: ${customer.name}`);

  if (rewardFlavor) {
    lines.push("🎁 Pizza grátis:");
    lines.push(`1x ${flavorName(rewardFlavor)}`);
    if (nonZeroItems.length > 0) {
      lines.push("");
      lines.push("🍕 Pizzas adicionais:");
      nonZeroItems.forEach((i) => lines.push(`${i.quantity}x ${flavorName(i.flavor)}`));
    }
  } else {
    lines.push("🍕 Pedido:");
    nonZeroItems.forEach((i) => lines.push(`${i.quantity}x ${flavorName(i.flavor)}`));
  }

  lines.push("");
  lines.push(`💰 Total: ${formatMoney(total)}`);

  if (pixKey?.trim()) {
    lines.push("", `PIX para pagamento: ${pixKey.trim()}`);
  }

  return { message: lines.join("\n"), total };
}

export function buildWhatsappUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function buildLoyaltyUpdateMessage(params: {
  name: string;
  loyaltyPoints: number;
  rewardAvailable: boolean;
  cardUrl: string;
}): string {
  const { name, loyaltyPoints, rewardAvailable, cardUrl } = params;
  const lines = [
    "Atelier do Pão — Fidelidade",
    "",
    `Olá, ${name}!`,
    "",
    "Seu cartão fidelidade foi atualizado.",
    `${loyaltyPoints} / 10 pizzas`,
  ];

  if (rewardAvailable) lines.push("", "Sua pizza grátis está disponível!");
  lines.push("", `Acesse seu cartão: ${cardUrl}`);
  return lines.join("\n");
}
