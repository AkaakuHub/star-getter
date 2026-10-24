import { ArrowRight, Disc3, SlidersHorizontal, Trophy } from 'lucide-preact';
import { useState } from 'preact/hooks';
import { resolveDeck } from '../../content/cards';
import { performers } from '../../content/performers';
import { tracks } from '../../content/tracks';
import { bestScore, type Library } from '../../infrastructure/storage/library';
import { formatScore, formatTime } from '../cardDescription';
import { DeckEditor } from './DeckEditor';
import { Portrait } from './Portrait';
import { loveGatherHeartShowLimitSettings } from '../../domain/game/live/heartPresentation';

export function Lobby({
  library,
  heartShowLimit,
  onHeartShowLimit,
  onChange,
  onStart,
  busy,
}: Readonly<{
  library: Library;
  heartShowLimit: number;
  onHeartShowLimit: (value: number) => void;
  onChange: (library: Library) => void;
  onStart: () => void;
  busy: boolean;
}>) {
  const [editing, setEditing] = useState(false);
  const deck = resolveDeck(library.deckIds);
  return (
    <main className="lobby">
      <section className="track-panel panel">
        <h2>
          <Disc3 aria-hidden="true" />
          楽曲
        </h2>
        <div className="track-list">
          {tracks.map((track, index) => (
            <button
              key={track.id}
              type="button"
              className={`track-choice track-${index}`}
              aria-pressed={library.trackId === track.id}
              disabled={busy}
              onClick={() => onChange({ ...library, trackId: track.id })}
            >
              <span className="track-cover" aria-hidden="true">
                <span />
                <Disc3 size={40} />
              </span>
              <span className="track-info">
                <strong>{track.name}</strong>
                <span>
                  {formatTime((track.beats * 60) / track.bpm)}
                  <span className="dot">・</span>
                  {track.bpm} BPM
                </span>
                <span className="best">
                  <Trophy size={14} aria-label="最高得点" />
                  {formatScore(bestScore(library, track.id))}
                </span>
              </span>
              <ArrowRight size={20} className="track-arrow" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>
      <section className="heart-display-panel panel">
        <div className="panel-heading">
          <label htmlFor="heart-show-limit">ハート表示数</label>
          <output htmlFor="heart-show-limit">{heartShowLimit}個</output>
        </div>
        <input
          id="heart-show-limit"
          type="range"
          min={loveGatherHeartShowLimitSettings.minimum}
          max={loveGatherHeartShowLimitSettings.maximum}
          step={loveGatherHeartShowLimitSettings.step}
          value={heartShowLimit}
          disabled={busy}
          onInput={(event) => onHeartShowLimit(Number(event.currentTarget.value))}
        />
      </section>
      <section className="team-panel panel">
        <div className="panel-heading">
          <h2>編成</h2>
          <button
            className="button quiet"
            type="button"
            disabled={busy}
            onClick={() => setEditing(true)}
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            編集
          </button>
        </div>
        <div className="team-lineup">
          {Object.values(performers).map((performer) => (
            <section key={performer.id} className={`performer-column color-${performer.id}`}>
              <Portrait performer={performer.id} />
              <h3>{performer.name}</h3>
              <ul>
                {deck
                  .filter((card) => card.performer === performer.id)
                  .map((card) => (
                    <li key={card.id}>{card.name}</li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
      <button
        type="button"
        className="button primary start-button"
        disabled={busy}
        onClick={onStart}
      >
        {busy ? '準備中' : 'ライブをはじめる'}
        <ArrowRight size={22} aria-hidden="true" />
      </button>
      {editing && (
        <DeckEditor
          initial={library.deckIds}
          onClose={() => setEditing(false)}
          onSave={(deckIds) => {
            onChange({ ...library, deckIds });
            setEditing(false);
          }}
        />
      )}
    </main>
  );
}
