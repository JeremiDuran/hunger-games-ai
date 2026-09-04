import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { GameHubWorkspace } from "@/components/gamehub/GameHubWorkspace";

interface GameHubPageProps {
  params: Promise<{ locale: string; id: string }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function GameHubPage({ params }: GameHubPageProps) {
  const { locale, id } = await params;

  if (!id || !UUID_REGEX.test(id)) {
    notFound();
  }

  setRequestLocale(locale);

  return <GameHubWorkspace gameId={id} />;
}
