import type { Metadata } from 'next';
import './globals.css';
import { ReduxProvider } from '../redux/ReduxProvider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Divinesoft GYM — SuperAdmin Console',
  description: 'Multi-Tenant SaaS Fleet Management & Analytics Command Center powered by Divinesoft GYM',
  icons: {
    icon: [
      { url: '/logo.png', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/logo.png',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="bg-[#09090b] text-zinc-100 min-h-screen antialiased selection:bg-red-600 selection:text-white"
        suppressHydrationWarning
      >
        <ReduxProvider>
          {children}
          <Toaster position="bottom-center" richColors theme="dark" closeButton toastOptions={{
            classNames: {
              // Close button ko right ya left corner par move karne ke liye
              closeButton: '!left-auto !right-2 !top-2',
            },
          }} />
        </ReduxProvider>
      </body>
    </html>
  );
}
