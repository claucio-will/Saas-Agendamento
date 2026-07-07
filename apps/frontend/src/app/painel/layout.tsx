import { PainelShell } from '../../components/painel-shell';

/** Layout da área do dono: app-shell com sidebar + conteúdo da página. */
export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PainelShell>{children}</PainelShell>;
}
