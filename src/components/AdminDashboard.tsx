"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buildAccessLinkMessage, buildLoyaltyUpdateMessage, buildWhatsappUrl } from "@/lib/whatsapp";
import { CustomerListItem, HistoryItem } from "@/types";

export function AdminDashboard() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerListItem[] | null>(null);
  const [businessPhone, setBusinessPhone] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [historyFor, setHistoryFor] = useState<CustomerListItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [activeScreen, setActiveScreen] = useState<"customers" | "insights" | "profile">("customers");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const loadCustomers = useCallback(async () => {
    const res = await fetch("/api/customers");
    if (res.ok) setCustomers(await res.json());
  }, []);

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setBusinessPhone(data.business_phone);
      setPhoneInput(data.business_phone);
      setPixKey(data.pix_key ?? "");
    }
  }, []);

  useEffect(() => {
    loadCustomers();
    loadSettings();
  }, [loadCustomers, loadSettings]);

  function openCustomerWhatsapp(customer: CustomerListItem) {
    const cardUrl = `${window.location.origin}/fidelidade/${customer.unique_token}`;
    const message = buildLoyaltyUpdateMessage({
      name: customer.name,
      loyaltyPoints: customer.loyalty_points,
      rewardAvailable: customer.reward_available,
      cardUrl,
    });
    window.open(buildWhatsappUrl(customer.whatsapp, message), "_blank", "noopener,noreferrer");
  }

  async function runAction(id: string, action: "add" | "remove" | "redeem", label: string) {
    const res = await fetch(`/api/customers/${id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const updated = (await res.json()) as CustomerListItem;
      showToast(label);
      loadCustomers();
      if (action !== "redeem") openCustomerWhatsapp(updated);
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error ?? "Não foi possível completar a ação.");
    }
  }

  async function saveSettings() {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessPhone: phoneInput, pixKey }),
    });
    if (res.ok) {
      setBusinessPhone(phoneInput);
      showToast("Número salvo");
    }
  }

  async function openHistory(customer: CustomerListItem) {
    setHistoryFor(customer);
    setHistory(null);
    const res = await fetch(`/api/customers/${customer.id}/history`);
    if (res.ok) setHistory(await res.json());
  }

  function sendAccessLink(customer: CustomerListItem) {
    const cardUrl = `${window.location.origin}/fidelidade/${customer.unique_token}`;
    const message = buildAccessLinkMessage({ name: customer.name, cardUrl });
    window.open(buildWhatsappUrl(customer.whatsapp, message), "_blank", "noopener,noreferrer");
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  if (!customers) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--crust-soft)" }}>Carregando...</div>;
  }

  const totalPizzas = customers.reduce((s, c) => s + c.total_pizzas, 0);
  const nearReward = customers.filter((c) => c.loyalty_points >= 8 && c.loyalty_points < 10).length;
  const rewardsAvail = customers.filter((c) => c.reward_available).length;
  const screenTitle = activeScreen === "customers" ? "Clientes" : activeScreen === "insights" ? "Informações" : "Perfil";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 18px 104px", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <p style={{ color: "var(--tomato-deep)", fontSize: 12, fontWeight: 700, letterSpacing: 0.4, margin: "0 0 3px", textTransform: "uppercase" }}>Pizzas Viver Canoas</p>
          <h1 style={{ fontSize: 22, margin: 0 }}>{screenTitle}</h1>
        </div>
        <button onClick={handleLogout} style={ghostBtn}>
          Sair
        </button>
      </div>

      {activeScreen === "insights" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 24 }}>
        <StatCard num={customers.length} label="Clientes" />
        <StatCard num={totalPizzas} label="Pizzas registradas" />
        <StatCard num={nearReward} label="Clientes com 8+ pizzas" />
        <StatCard num={rewardsAvail} label="Recompensas disponíveis" />
      </div>}

      {activeScreen === "customers" && <><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 17, margin: 0 }}>Clientes</h2>
        <button onClick={() => setShowNewCustomer(true)} style={primaryBtn}>
          + Novo cliente
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="customer-list-table" style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow)" }}>
          <thead>
            <tr>
              <Th>Cliente</Th>
              <Th>Apto</Th>
              <Th>Fidelidade</Th>
              <Th>Link</Th>
              <Th>Ação</Th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <Td label="Cliente">
                  {c.name}
                  <br />
                  <span style={{ color: "var(--crust-soft)", fontSize: 12 }}>{c.whatsapp}</span>
                </Td>
                <Td label="Apartamento">
                  {c.block}-{c.apartment}
                </Td>
                <Td label="Fidelidade">
                  <span
                    style={{
                      display: "inline-flex",
                      padding: "3px 9px",
                      borderRadius: 100,
                      fontSize: 12.5,
                      fontWeight: 600,
                      background: c.reward_available ? "var(--tomato)" : "var(--dough-deep)",
                      color: c.reward_available ? "white" : "var(--crust-soft)",
                    }}
                  >
                    {c.loyalty_points}/10 {c.reward_available ? "🎁" : ""}
                  </span>
                </Td>
                <Td label="Link">
                  <button onClick={() => sendAccessLink(c)} style={sendLinkBtn}>
                    Enviar link
                  </button>
                </Td>
                <Td label="Ações">
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {c.reward_available ? (
                      <button onClick={() => runAction(c.id, "redeem", `Recompensa resgatada — ${c.name}`)} style={primaryBtn}>
                        Resgatar
                      </button>
                    ) : (
                      <>
                        <button onClick={() => runAction(c.id, "add", `+1 pizza para ${c.name}`)} style={iconBtn}>
                          +1
                        </button>
                        <button onClick={() => runAction(c.id, "remove", `-1 pizza para ${c.name}`)} style={iconBtn}>
                          −1
                        </button>
                      </>
                    )}
                    <button onClick={() => openHistory(c)} style={iconBtn}>
                      🕓
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></>}

      {activeScreen === "profile" && <div style={{ marginTop: 24, fontSize: 12.5, color: "var(--crust-soft)", background: "white", borderRadius: 14, padding: 18, boxShadow: "var(--shadow)" }}>
        WhatsApp do negócio (recebe os pedidos):
        <input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} style={{ marginLeft: 6, padding: "6px 10px", borderRadius: 8, border: "1.5px solid var(--line)", fontSize: 13 }} />
        <label style={{ marginLeft: 12 }}>
          Chave PIX:
          <input value={pixKey} onChange={(e) => setPixKey(e.target.value)} style={{ marginLeft: 6, padding: "6px 10px", borderRadius: 8, border: "1.5px solid var(--line)", fontSize: 13 }} placeholder="CPF, e-mail, telefone ou aleatória" />
        </label>
        <button onClick={saveSettings} style={{ ...iconBtn, width: "auto", padding: "6px 12px", marginLeft: 6 }}>
          Salvar
        </button>
        {businessPhone && <span style={{ marginLeft: 8 }}>atual: {businessPhone}</span>}
      </div>}

      {showNewCustomer && (
        <NewCustomerModal
          onClose={() => setShowNewCustomer(false)}
          onCreated={() => {
            setShowNewCustomer(false);
            loadCustomers();
            showToast("Cliente cadastrado");
          }}
        />
      )}

      {historyFor && (
        <HistoryModal customer={historyFor} history={history} onClose={() => setHistoryFor(null)} />
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 86,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--crust)",
            color: "white",
            padding: "10px 18px",
            borderRadius: 100,
            fontSize: 13.5,
            zIndex: 100,
            boxShadow: "var(--shadow)",
          }}
        >
          {toast}
        </div>
      )}

      <nav aria-label="Navegação do painel" style={bottomNav}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", padding: "7px 12px" }}>
          <NavItem icon="👥" label="Clientes" active={activeScreen === "customers"} onClick={() => setActiveScreen("customers")} />
          <NavItem icon="📊" label="Informações" active={activeScreen === "insights"} onClick={() => setActiveScreen("insights")} />
          <NavItem icon="⚙️" label="Perfil" active={activeScreen === "profile"} onClick={() => setActiveScreen("profile")} />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-current={active ? "page" : undefined} style={{ border: "none", background: "transparent", color: active ? "var(--tomato-deep)" : "var(--crust-soft)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, fontSize: 11.5, fontWeight: active ? 700 : 500, padding: "5px 8px" }}>
      <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
      {label}
    </button>
  );
}

function StatCard({ num, label }: { num: number; label: string }) {
  return (
    <div style={{ background: "white", borderRadius: 14, padding: 16, boxShadow: "var(--shadow)" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600 }}>{num}</div>
      <div style={{ fontSize: 12.5, color: "var(--crust-soft)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: "left", fontSize: 12, color: "var(--crust-soft)", padding: "12px 14px", borderBottom: "1px solid var(--line)", fontWeight: 600 }}>{children}</th>;
}
function Td({ children, label }: { children: React.ReactNode; label?: string }) {
  return <td data-label={label} style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)", fontSize: 14, verticalAlign: "middle" }}>{children}</td>;
}

const primaryBtn: React.CSSProperties = {
  background: "var(--tomato)",
  color: "white",
  border: "none",
  borderRadius: 9,
  padding: "8px 14px",
  fontSize: 13.5,
  cursor: "pointer",
  fontWeight: 500,
};
const ghostBtn: React.CSSProperties = {
  background: "transparent",
  color: "var(--tomato)",
  border: "1.5px solid var(--tomato)",
  borderRadius: 9,
  padding: "8px 14px",
  fontSize: 13.5,
  cursor: "pointer",
  fontWeight: 500,
};
const iconBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  border: "1.5px solid var(--line)",
  background: "white",
  cursor: "pointer",
  fontSize: 14,
};
const sendLinkBtn: React.CSSProperties = {
  background: "white",
  color: "var(--tomato-deep)",
  border: "1.5px solid var(--tomato)",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 12,
  cursor: "pointer",
  fontWeight: 600,
  whiteSpace: "nowrap",
};
const bottomNav: React.CSSProperties = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 40,
  background: "rgba(255,255,255,0.97)",
  borderTop: "1px solid var(--line)",
  boxShadow: "0 -5px 18px rgba(36,21,18,0.08)",
};

function NewCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [block, setBlock] = useState("");
  const [apartment, setApartment] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name || !block || !apartment || !whatsapp) {
      setError("Preencha todos os campos.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, block, apartment, whatsapp }),
    });
    setSaving(false);
    if (res.ok) onCreated();
    else setError("Não foi possível cadastrar o cliente.");
  }

  return (
    <Overlay onClose={onClose}>
      <h2 style={{ marginTop: 0 }}>Novo cliente</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Nome" full>
          <input value={name} onChange={(e) => setName(e.target.value)} style={fieldInput} placeholder="Nome do cliente" />
        </Field>
        <Field label="Bloco">
          <input value={block} onChange={(e) => setBlock(e.target.value)} style={fieldInput} placeholder="B" />
        </Field>
        <Field label="Apartamento">
          <input value={apartment} onChange={(e) => setApartment(e.target.value)} style={fieldInput} placeholder="302" />
        </Field>
        <Field label="WhatsApp" full>
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} style={fieldInput} placeholder="55519xxxxxxxx" />
        </Field>
      </div>
      {error && <p style={{ color: "var(--tomato-deep)", fontSize: 13 }}>{error}</p>}
      <button onClick={handleSave} disabled={saving} style={{ ...primaryBtn, width: "100%", padding: 14, marginTop: 18, fontSize: 15.5 }}>
        {saving ? "Salvando..." : "Cadastrar cliente"}
      </button>
    </Overlay>
  );
}

function HistoryModal({ customer, history, onClose }: { customer: CustomerListItem; history: HistoryItem[] | null; onClose: () => void }) {
  return (
    <Overlay onClose={onClose}>
      <h2 style={{ marginTop: 0 }}>Histórico — {customer.name}</h2>
      {history === null && <p style={{ color: "var(--crust-soft)" }}>Carregando...</p>}
      {history?.length === 0 && <p style={{ textAlign: "center", color: "var(--crust-soft)", fontSize: 13.5, padding: "30px 0" }}>Nenhuma movimentação registrada ainda.</p>}
      {history?.map((h) => (
        <div key={h.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)", fontSize: 13.5 }}>
          <span style={{ color: "var(--crust-soft)", fontSize: 12 }}>{new Date(h.created_at).toLocaleDateString("pt-BR")}</span>
          <span style={{ float: "right", fontWeight: 600 }}>Saldo: {h.balance_after}/10</span>
          <br />
          {h.points > 0 ? "+" : ""}
          {h.points} pizza — {h.type}
          {h.description ? ` · ${h.description}` : ""}
        </div>
      ))}
    </Overlay>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ gridColumn: full ? "1/-1" : undefined }}>
      <label style={{ fontSize: 12.5, color: "var(--crust-soft)", display: "block", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}
const fieldInput: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 9,
  border: "1.5px solid var(--line)",
  fontSize: 14,
};

function Overlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ position: "fixed", inset: 0, background: "rgba(36,21,18,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}
    >
      <div style={{ background: "var(--dough)", width: "100%", maxWidth: 440, borderRadius: 18, padding: "24px 22px", maxHeight: "88vh", overflowY: "auto", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--crust-soft)" }}>
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
