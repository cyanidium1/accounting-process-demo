import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Бухгалтерія на аутсорсі — як це працює",
  description:
    "Ви пишете завдання у месенджер — далі бухгалтерія працює сама: задача зафіксована, дедлайн у календарі, документ у вашій папці.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
