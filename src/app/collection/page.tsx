import { getProgress } from "@/actions/progress";
import { getSettings } from "@/actions/settings";
import { CollectionView } from "@/components/collection-view";
import { SettingsCard } from "@/components/settings-card";

export const dynamic = "force-dynamic";

export default async function CollectionPage() {
  const [data, settings] = await Promise.all([getProgress(), getSettings()]);
  return (
    <div className="max-w-lg mx-auto px-5 pt-8">
      <h1 className="text-3xl font-bold tracking-tight">Cat friends</h1>
      <p className="text-sm text-muted mt-1">Every workout brings a new friend closer. 🐾</p>
      <div className="mt-5 space-y-4">
        <CollectionView data={data} />
        <SettingsCard settings={settings} />
      </div>
    </div>
  );
}
