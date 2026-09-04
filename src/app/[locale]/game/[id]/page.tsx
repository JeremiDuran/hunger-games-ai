import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { LiveArenaWorkspace } from "@/components/arena/LiveArenaWorkspace";

interface GamePageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ phaseId?: string }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function GamePage({ params, searchParams }: GamePageProps) {
  const { locale, id } = await params;
  const { phaseId } = await searchParams;

  if (!id || !UUID_REGEX.test(id)) {
    notFound();
  }

  setRequestLocale(locale);

  return <LiveArenaWorkspace gameId={id} initialPhaseId={phaseId} />;
}
