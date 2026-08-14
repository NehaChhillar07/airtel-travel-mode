import clsx from 'clsx'
import { Check, X } from 'lucide-react'
import { CHECKLIST, COPY } from '../../data'
import { useUiStore } from '../../state/uiStore'
import { Button } from '../../ui/Button/Button'
import { NavBar, StatusBar } from '../../ui/Chrome/Chrome'
import { WhatsAppGlyph } from '../../ui/Glyph/WhatsApp'
import { Screen } from '../../ui/Screen/Screen'
import s from './Away.module.css'

/**
 * 05.1 Setup checklist — three ordered fixes, from checklist.json.
 */
export function SetupChecklist() {
  const back = useUiStore((x) => x.back)
  const navigate = useUiStore((x) => x.navigate)
  const hasHistory = useUiStore((x) => x.history.length > 0)

  /*
   * 04.7 is where this screen is reached from, so that is where back goes when
   * there is no history to pop — landing here from a deep link or the index
   * rail used to leave the chevron doing nothing at all.
   */
  const onBack = () => (hasHistory ? back() : navigate('confirmation', 'pop'))

  return (
    <Screen
      scrollKey="setup"
      top={<><StatusBar /><NavBar title={COPY.setup.navTitle} onBack={onBack} /></>}
      bottom={
        <div className={s.footBar}>
          <Button full aria-label={`${COPY.setup.callFree} — calls ${COPY.dashboard.helpNumber}`}>
            <span className={s.callLabel}>
              {COPY.setup.callFree}
              <span className={clsx(s.callNumber, 't-caption-12')} aria-hidden="true">
                {COPY.dashboard.helpNumber}
              </span>
            </span>
          </Button>
          <Button full variant="secondary" iconLeft={<WhatsAppGlyph size={20} />}>
            {COPY.setup.whatsapp}
          </Button>
          <span className={clsx(s.footNote, 't-caption-12')}>
            {COPY.setup.whatsappNote}
          </span>
        </div>
      }
    >
      <div className={s.setupBody}>
        <p className={clsx(s.setupIntro, 't-body-14-med')}>{COPY.setup.intro}</p>

        {CHECKLIST.map((step) => (
          <div className={s.stepCard} key={step.n}>
            <div className={s.stepHead}>
              <span className="t-value-16-bold">{step.title}</span>
              <span className={clsx(s.stepWhy, 't-caption-12')}>{step.why}</span>
            </div>

            {step.settingsPath && (
              <span className={clsx(s.path, 't-label-12')}>{step.settingsPath}</span>
            )}

            {step.note && (
              <ol className={s.noteList}>
                {step.note.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
            )}

            {step.picks.length > 0 && (
              <div className={s.picks}>
                {step.picks.map((pick) => (
                  <span className={clsx(s.pick, pick.good && s.pickGood)} key={pick.label}>
                    <span className={clsx(s.pickLabel, 't-caption-12')}>{pick.label}</span>
                    <span className={clsx(s.pickHint, 't-caption-12')}>
                      {pick.good ? <Check size={16} strokeWidth={1.5} /> : <X size={16} />}
                      {pick.hint}
                    </span>
                  </span>
                ))}
              </div>
            )}

            {step.cta && <Button full>{step.cta}</Button>}

            {step.after && <span className={clsx(s.after, 't-caption-12')}>{step.after}</span>}
          </div>
        ))}
      </div>
    </Screen>
  )
}
