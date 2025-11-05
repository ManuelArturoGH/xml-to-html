import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Convertidor XML a PDF - CFDI 4.0",
  description: "Convierte tus facturas XML CFDI 4.0 a PDF de manera fácil y rápida",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
