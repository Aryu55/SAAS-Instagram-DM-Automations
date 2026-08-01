import ReactQueryProvider from "@/providers/react-query-provider";
import ReduxProvider from "@/providers/redux-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";
import { Cormorant_Garamond, Instrument_Sans, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Janus AI — The AI Content Factory",
  description: "Script. Voice. Render. Publish. Three autonomous content machines generating short-form video on autopilot. Internal tool by Mindmaxing.",
  icons:
    "https://private-user-images.githubusercontent.com/99180855/399478068-9e74d0e3-d1dc-447b-b69b-538017f51992.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MzU2NTE3NDksIm5iZiI6MTczNTY1MTQ0OSwicGF0aCI6Ii85OTE4MDg1NS8zOTk0NzgwNjgtOWU3NGQwZTMtZDFkYy00NDdiLWI2OWItNTM4MDE3ZjUxOTkyLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNDEyMzElMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjQxMjMxVDEzMjQwOVomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWJlZjE3YjlhYzAyNGE3YWEyNWQ1Y2VjZTVjMGI0YjI0NzRmMDBkNmY3OGQ4MGQ1YjljYWFiMDA0ZTY5ZWY3ZmYmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.UyOWRdw6hlgBxTqlWxMSxp-AxkDgoiLbR1Gkd_dxyuk",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${instrument.variable} ${cormorant.variable} ${spaceGrotesk.variable} antialiased`} style={{ fontFamily: "var(--font-instrument), system-ui, sans-serif" }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
        >
          <ReduxProvider>
            <ReactQueryProvider>
              <TooltipProvider delayDuration={300}>
                {children}
              </TooltipProvider>
            </ReactQueryProvider>
          </ReduxProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
