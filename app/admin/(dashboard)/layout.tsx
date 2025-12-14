import { AdminAuthProvider } from '@/components/admin/AdminAuthProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
