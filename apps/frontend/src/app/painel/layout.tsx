import { PainelNav } from '../../components/painel-nav';

/** Layout da área do dono: barra de navegação fixa + conteúdo da página. */
export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <PainelNav />
      {children}
    </div>
  );
}
