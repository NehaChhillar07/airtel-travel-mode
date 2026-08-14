import clsx from 'clsx'
import { CalendarDays, ChevronRight, Globe, Plus, Voicemail } from 'lucide-react'
import type { ReactNode } from 'react'
import { COPY } from '../../data'
import type { Explainer } from '../../lib/types'
import { fill } from '../../lib/format'
import { Switch } from '../../ui/Controls/Controls'
import { WhatsAppGlyph } from '../../ui/Glyph/WhatsApp'
import s from './TripActions.module.css'

/** `Frame 1321322916` with the glyph the row is about. */
export function ActionIcon({ kind }: { kind: string }) {
  if (kind === 'speed') {
    return (
      <span className={clsx(s.icon, s.icon5g)} aria-hidden="true">
        5G
      </span>
    )
  }
  const Glyph =
    kind === 'calendar'
      ? CalendarDays
      : kind === 'voicemail'
        ? Voicemail
        : kind === 'globe'
          ? Globe
          : Plus
  return (
    <span className={s.icon} aria-hidden="true">
      <Glyph size={18} strokeWidth={2} />
    </span>
  )
}

interface ActionRowProps {
  explainer: Explainer
  /** Token values for the `{fup}` / `{validity}` / `{price}` placeholders. */
  tokens: Record<string, string | number>
  /** Rendered in place of the chevron. */
  trailing?: ReactNode
  divided?: boolean
  onClick?: () => void
}

/** `Frame 96` — icon, title, trailing control, and a caption under all three. */
export function ActionRow({ explainer, tokens, trailing, divided, onClick }: ActionRowProps) {
  /*
    Two columns: the icon, then everything it labels.

    The icon used to sit inside the title's own row, which put a 33px box on a
    22px line — so it stood 5.5px proud of the title above and hung the same
    below, into the caption's space. Given a column of its own it aligns to the
    top of the title and can no longer reach the caption at all, which is also
    what indents the caption without anyone measuring the icon to do it.
  */
  const body = (
    <>
      <ActionIcon kind={explainer.icon} />
      <span className={s.rowBody}>
        <span className={s.rowHead}>
          <span className={clsx(s.rowTitle, 't-value-16-bold')}>{explainer.title}</span>
          {trailing ?? (
            <ChevronRight className={s.chevron} size={24} strokeWidth={2} aria-hidden="true" />
          )}
        </span>
        <span className={clsx(s.rowNote, 't-caption-12')}>{fill(explainer.body, tokens)}</span>
      </span>
    </>
  )

  const className = clsx(s.row, divided && s.rowDivided)

  /*
    A switch row is not a button — the whole row would then have two things to
    press, and pressing the wrong one is how you buy a pack by accident.
  */
  return onClick ? (
    <button className={className} onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  )
}

/**
 * The three things you can do about the pack: add speed, add days, or arm the
 * top-up. `EXPLAINERS` decides which, so a fourth is a JSON edit.
 */
export function ActionRows({
  explainers,
  tokens,
  autoTopUp,
  onAutoTopUp,
}: {
  explainers: Explainer[]
  tokens: Record<string, string | number>
  autoTopUp: boolean
  onAutoTopUp: (v: boolean) => void
}) {
  return (
    <div className={s.rows}>
      {explainers.map((ex, i) => (
        <ActionRow
          key={ex.id}
          explainer={ex}
          tokens={tokens}
          divided={i < explainers.length - 1}
          trailing={
            ex.trailing === 'switch' ? (
              <Switch checked={autoTopUp} onCheckedChange={onAutoTopUp} label={ex.title} />
            ) : undefined
          }
        />
      ))}
    </div>
  )
}

/**
 * `Stop the drain` — the file's one alarming surface, and still not a
 * saturated red block.
 */
export function DrainCard({
  explainers,
  tokens,
  onSelect,
}: {
  explainers: Explainer[]
  tokens: Record<string, string | number>
  onSelect?: (id: string) => void
}) {
  if (explainers.length === 0) return null

  return (
    <div className={s.drainWrap}>
      <div className={s.drain}>
        <span className={clsx(s.drainHead, 't-label-12')}>{COPY.dashboard.stopTheDrain}</span>
        <div className={s.drainRows}>
          {explainers.map((ex, i) => (
            <ActionRow
              key={ex.id}
              explainer={ex}
              tokens={tokens}
              divided={i < explainers.length - 1}
              onClick={onSelect ? () => onSelect(ex.id) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/** `Frame 89` — the number that works when nothing else on the phone does. */
export function HelpCard() {
  return (
    <div className={s.helpWrap}>
      <div className={s.help}>
        <span className="t-label-12 t-inverse">{COPY.dashboard.helpTitle}</span>
        <div className={s.helpLead}>
          <span className="t-title-24 t-inverse">{COPY.dashboard.helpNumber}</span>
          <span className="t-caption-12 t-inverse">{COPY.dashboard.helpSub}</span>
        </div>
        <div className={s.helpBtns}>
          <button className={clsx(s.helpBtn, 't-value-16-med')}>{COPY.setup.callFree}</button>
          <button className={clsx(s.helpBtn, s.helpBtnGhost, 't-value-16-med', 't-inverse')}>
            <WhatsAppGlyph size={20} />
            {COPY.setup.whatsapp}
          </button>
        </div>
      </div>
    </div>
  )
}
