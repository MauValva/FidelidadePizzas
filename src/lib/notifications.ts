import { LOYALTY_GOAL } from "@/types";

type NotifiableCustomer = {
  name: string;
  whatsapp: string;
  loyaltyPoints: number;
  uniqueToken: string;
};

/**
 * Interface de notificação ao cliente. Hoje implementada apenas com log
 * no servidor (ConsoleNotificationService). Quando a integração com a
 * WhatsApp Business API estiver pronta, basta criar uma nova classe que
 * implemente essa interface (ex: WhatsAppBusinessNotificationService) e
 * trocar o retorno de getNotificationService() — nada mais no resto da
 * aplicação precisa mudar.
 */
export interface NotificationService {
  notifyLoyaltyUpdate(customer: NotifiableCustomer): Promise<void>;
  notifyRewardUnlocked(customer: NotifiableCustomer): Promise<void>;
}

function cardLink(uniqueToken: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return `${base}/fidelidade/${uniqueToken}`;
}

class ConsoleNotificationService implements NotificationService {
  async notifyLoyaltyUpdate(customer: NotifiableCustomer) {
    const remaining = LOYALTY_GOAL - customer.loyaltyPoints;
    const message = [
      "🍕 Pizzas Viver Canoas — Fidelidade",
      "",
      `Olá, ${customer.name}!`,
      "",
      "Seu cartão fidelidade foi atualizado. 🔥",
      "",
      `${customer.loyaltyPoints} / ${LOYALTY_GOAL} pizzas`,
      "",
      `Faltam apenas ${remaining} pizza${remaining === 1 ? "" : "s"} para você ganhar uma pizza grátis! 🎁`,
      "",
      `👉 Acesse seu cartão: ${cardLink(customer.uniqueToken)}`,
    ].join("\n");

    // TODO: substituir por chamada real à WhatsApp Business API
    console.log(`[notify:${customer.whatsapp}]\n${message}`);
  }

  async notifyRewardUnlocked(customer: NotifiableCustomer) {
    const message = [
      "🎉 Pizzas Viver Canoas — Você ganhou uma pizza!",
      "",
      `Parabéns, ${customer.name}!`,
      "",
      `Você completou ${LOYALTY_GOAL} pizzas no seu cartão fidelidade. 🍕`,
      "",
      "🎁 Você ganhou 1 pizza grátis!",
      "",
      `Acesse seu cartão para escolher seu sabor e fazer seu pedido: ${cardLink(customer.uniqueToken)}`,
    ].join("\n");

    // TODO: substituir por chamada real à WhatsApp Business API
    console.log(`[notify:${customer.whatsapp}]\n${message}`);
  }
}

export function getNotificationService(): NotificationService {
  return new ConsoleNotificationService();
}
