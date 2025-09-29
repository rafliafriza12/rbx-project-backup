import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Poppins } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GoogleAuthProvider from "@/components/GoogleAuthProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-poppins",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RBXNET",
  description:
    "rbxnet adalah website penjualan Robux yang aman, cepat, dan terpercaya untuk semua pemain Roblox di Indonesia. Nikmati harga terbaik, proses instan, serta layanan customer support yang ramah dan profesional.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          property="og:title"
          content="rbxnet | Jual Beli Robux Aman, Cepat, & Terpercaya"
        />
        <meta
          property="og:description"
          content="Website penjualan Robux terpercaya dengan harga terbaik, proses instan, dan layanan customer support 24/7."
        />
        <meta property="og:url" content="https://rbxnet.com" />
        <meta property="og:type" content="website" />

        <script
          type="text/javascript"
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        ></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
      >
        <NextTopLoader
          color="#F63AE6"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #00F5FF,0 0 5px #00F5FF"
          zIndex={99999}
        />
        <GoogleAuthProvider>
          <AuthProvider>{children}</AuthProvider>
        </GoogleAuthProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </body>
    </html>
  );
}
