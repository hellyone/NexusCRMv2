import './globals.css';
import { Inter } from 'next/font/google';
import { auth } from '@/auth';
import Sidebar from '@/components/Sidebar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/ToastContainer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Nexus OS',
  description: 'Sistema de Gestão de Ordens de Serviço',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className} suppressHydrationWarning={true}>
        <ErrorBoundary>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
