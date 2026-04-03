import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Sentinel</h1>
      <p>Solana wallet security scanner</p>
      <Link href="/dashboard">Open dashboard</Link>
    </main>
  );
}