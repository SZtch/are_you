import "./globals.css";

export const metadata = {
  title: "Sentinel",
  description: "Solana wallet security scanner",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}