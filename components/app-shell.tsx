export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      <header style={{ marginBottom: 24 }}>
        <h1>Sentinel</h1>
        <p>Solana wallet security scanner</p>
      </header>
      {children}
    </main>
  );
}