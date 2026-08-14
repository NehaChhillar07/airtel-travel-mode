import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import { COPY, PACK_BY_ID } from '../../data'
import { inr, validityLabel } from '../../lib/format'
import { reasonFor } from '../../lib/recommend'
import { errorFor } from '../../lib/validate'
import { listItem, staggerList } from '../../motion/presets'
import { TripSummary } from '../../patterns/TripSummary/TripSummary'
import {
  useRankedPacks,
  useRecommendation,
  useTripDays,
  useValidation,
} from '../../state/selectors'
import { useTripStore } from '../../state/tripStore'
import { useUiStore } from '../../state/uiStore'
import { Button } from '../../ui/Button/Button'
import { NavBar, StatusBar } from '../../ui/Chrome/Chrome'
import { Checkbox } from '../../ui/Controls/Controls'
import { PackCard } from '../../ui/PackCard/PackCard'
import { Screen } from '../../ui/Screen/Screen'
import { PackDetailSheet } from './PackDetail'
import s from './PackSelect.module.css'

/**
 * 04.4 Pack selection, and 04.5 Pack detail as its sheet.
 *
 * The list is ranked by src/lib/recommend.ts against the trip the user built,
 * so both which pack is recommended and the sentence explaining why change
 * with the destinations and the dates. In the source file the recommendation
 * and its reason are a text node on a card.
 */
export function PackSelect() {
  const days = useTripDays()
  const ranked = useRankedPacks()
  const recommendation = useRecommendation()
  const validation = useValidation()

  const destinations = useTripStore((x) => x.destinations)
  const selectedPackId = useTripStore((x) => x.selectedPackId)
  const expandedPackId = useTripStore((x) => x.expandedPackId)
  const tcAccepted = useTripStore((x) => x.tcAccepted)
  const selectPack = useTripStore((x) => x.selectPack)
  const toggleExpandPack = useTripStore((x) => x.toggleExpandPack)
  const setTcAccepted = useTripStore((x) => x.setTcAccepted)

  const sheet = useUiStore((x) => x.sheet)
  const openSheet = useUiStore((x) => x.openSheet)
  const closeSheet = useUiStore((x) => x.closeSheet)
  const navigate = useUiStore((x) => x.navigate)
  const back = useUiStore((x) => x.back)
  const hasHistory = useUiStore((x) => x.history.length > 0)
  const toast = useUiStore((x) => x.toast)

  /*
   * 04.1 is where this screen is reached from, so that is where back goes when
   * there is no history to pop.
   *
   * `back()` returns the state untouched on an empty history, and history is
   * empty in the two ways a reviewer actually arrives: a pasted link to
   * #/trip/packs, and the index rail — `jump` clears history by design. Both
   * left the chevron drawn, enabled, and doing nothing. Same fix, and same
   * reason, as the one on 05.1.
   */
  const onBack = () => (hasHistory ? back() : navigate('trip', 'pop'))

  const recommendedId = recommendation?.pack.id ?? null
  const others = ranked.filter((r) => r.pack.id !== recommendedId)
  const top = ranked.find((r) => r.pack.id === recommendedId)

  const detailPack =
    sheet?.kind === 'pack-detail' ? (PACK_BY_ID[sheet.packId] ?? null) : null

  const packError = errorFor(validation, 'pack')
  const termsError = errorFor(validation, 'terms')

  function choose(id: string) {
    selectPack(id)
    const pack = PACK_BY_ID[id]
    if (pack) {
      toast({
        tone: 'neutral',
        title: `${inr(pack.priceExGst)} pack selected`,
        body: `${validityLabel(pack)} · nothing is charged yet`,
        ttlMs: 2600,
      })
    }
  }

  return (
    <Screen
      scrollKey="packs"
      top={
        <>
          <StatusBar />
          <NavBar title={COPY.packs.navTitle} onBack={onBack} />
        </>
      }
      bottom={
        <div className={s.bottom}>
          <Checkbox checked={tcAccepted} onCheckedChange={setTcAccepted} invalid={Boolean(termsError)}>
            {COPY.packs.tc} <span className="t-link">{COPY.packs.tcLink}</span>
          </Checkbox>
          <Button full disabled={!validation.canContinue} onClick={() => navigate('review')}>
            {COPY.packs.cta}
          </Button>
          <span className={clsx(s.caption, 't-caption-12', 't-secondary')}>
            {COPY.packs.caption}
          </span>
          {/* No terms error line: the Figma has no such text, and the caption
              below the CTA is "Nothing is charged yet." — a reassurance. Adding
              a red error under it undercut that. The disabled CTA and the
              checkbox's own invalid state already carry the message. */}
        </div>
      }
    >
      <TripSummary />

      <motion.div
        className={s.list}
        variants={staggerList(0.06)}
        initial="hidden"
        animate="show"
      >
        {top && (
          <motion.div className={s.cardWrap} variants={listItem}>
            <PackCard
              pack={top.pack}
              recommended
              selected={selectedPackId === top.pack.id}
              expanded={expandedPackId === top.pack.id}
              reason={recommendation?.reason}
              onSelect={choose}
              onToggleExpand={(id) => {
                toggleExpandPack(id)
                openSheet({ kind: 'pack-detail', packId: id })
              }}
            />
          </motion.div>
        )}

        {others.length > 0 && (
          <motion.div className={s.otherHead} variants={listItem}>
            <span className="t-label-12">{COPY.packs.otherPlans}</span>
          </motion.div>
        )}

        {others.map((entry) => (
          <motion.div className={s.cardWrap} key={entry.pack.id} variants={listItem}>
            <PackCard
              pack={entry.pack}
              selected={selectedPackId === entry.pack.id}
              expanded={expandedPackId === entry.pack.id}
              reason={reasonFor(entry.pack, { destinations, days }, entry.reasonKey)}
              onSelect={choose}
              onToggleExpand={(id) => {
                toggleExpandPack(id)
                openSheet({ kind: 'pack-detail', packId: id })
              }}
            />
          </motion.div>
        ))}

        {!selectedPackId && packError && (
          <span className={clsx(s.error, 't-caption-12', 't-secondary')}>{packError}</span>
        )}
      </motion.div>

      {/* 04.5. The sheet owns its own terms checkbox and CTA, so buying from
          it lands on Review directly rather than closing back onto the list. */}
      <AnimatePresence>
        {detailPack && (
          <PackDetailSheet
            key={detailPack.id}
            pack={detailPack}
            onClose={closeSheet}
            onBuy={() => {
              selectPack(detailPack.id)
              closeSheet()
              navigate('review')
            }}
          />
        )}
      </AnimatePresence>
    </Screen>
  )
}
