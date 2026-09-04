import { buildLoyaltyUpdateMessage, buildRewardUnlockedMessage } from "@/lib/whatsapp";

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
    const message = buildLoyaltyUpdateMessage({
      name: customer.name,
      loyaltyPoints: customer.loyaltyPoints,
      rewardAvailable: false,
      cardUrl: cardLink(customer.uniqueToken),
    });

    // TODO: substituir por chamada real à WhatsApp Business API
    console.log(`[notify:${customer.whatsapp}]\n${message}`);
  }

  async notifyRewardUnlocked(customer: NotifiableCustomer) {
    const message = buildRewardUnlockedMessage({
      name: customer.name,
      cardUrl: cardLink(customer.uniqueToken),
    });

    // TODO: substituir por chamada real à WhatsApp Business API
    console.log(`[notify:${customer.whatsapp}]\n${message}`);
  }
}

export function getNotificationService(): NotificationService {
  return new ConsoleNotificationService();
}
