import { AdminShell } from '../../components/admin-shell';

/** Layout da área do Super Admin: app-shell com sidebar + conteúdo. */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
