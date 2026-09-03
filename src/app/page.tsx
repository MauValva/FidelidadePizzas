import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 28 }}>🍕 Atelier do Pão</h1>
      <p style={{ color: "var(--crust-soft)", maxWidth: 380 }}>
        Cada cliente acessa seu cartão fidelidade através de um link único enviado pelo
        WhatsApp. Esta página inicial não é usada no dia a dia.
      </p>
      <Link
        href="/admin"
        style={{
          marginTop: 12,
          background: "var(--tomato)",
          color: "white",
          padding: "12px 20px",
          borderRadius: 12,
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        Ir para o painel administrativo
      </Link>
    </main>
  );
}
