import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { Inter } from "next/font/google";
import AmbientPlayer from "@/components/audio/AmbientPlayer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Finance Engine",
  description: "Personal finance system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider>
          <AmbientPlayer />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
