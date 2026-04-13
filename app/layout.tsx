import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";

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
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
