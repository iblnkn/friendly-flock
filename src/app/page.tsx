import MyStationsCard from '@/components/MyStationsCard';
import HighlightsCard from '@/components/HighlightsCard';
import TodaysSpeciesCard from '@/components/TodaysSpeciesCard';
import NowPlayingCard from '@/components/NowPlayingCard';
import PatternsCard from '@/components/PatternsCard';
import { WindowCard } from '@/components/WindowCard';

export default function Page() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)', padding: 'var(--s-5)' }}>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* App header (retro style) */}
        <WindowCard title="Bird Buddy" retro icon="🐦" className="overflow-hidden">
          <div style={{ padding: 'var(--s-2)' }}>
            <h1 className="mb-2" style={{ fontFamily: 'var(--font-tight)' }}>
              Bird Buddy
            </h1>
            <p className="muted" style={{ fontSize: 'var(--step-0)' }}>
              Your personal BirdWeather dashboard
            </p>
          </div>
        </WindowCard>

        <MyStationsCard />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <HighlightsCard />
          </div>
          <TodaysSpeciesCard />
          <NowPlayingCard />
          <PatternsCard />
        </div>
      </div>
    </main>
  );
}
