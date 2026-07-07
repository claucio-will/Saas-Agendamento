import { AdminNav } from '../../components/admin-nav';

/** Layout da área do Super Admin: navegação da plataforma + conteúdo. */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <AdminNav />
      {children}
    </div>
  );
}
