import clsx from 'clsx'
import { ChevronDown, Globe, Info, PlaneTakeoff } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { COPY, COUNTRY_BY_ISO } from '../../data'
import { fill, fullSpeedGb, inr, priceLabel } from '../../lib/format'
import type { Pack } from '../../lib/types'
import { dur, ease } from '../../motion/presets'
import { useTripStore } from '../../state/tripStore'
import { Button } from '../../ui/Button/Button'
import { Checkbox } from '../../ui/Controls/Controls'
import { DestinationChip } from '../../ui/DestinationChip/DestinationChip'
import { Sheet } from '../../ui/Sheet/Sheet'
import s from './PackSelect.module.css'

/**
 * 04.5 Pack detail.
 *
 * Its own file because the sheet carries its own footer — the terms checkbox
 * and the buy button are drawn inside the sheet on this frame, not borrowed
 * from the list screen behind it — and because mounting it under `key={pack.id}`
 * is what resets the disclosure when you open a different pack.
 *
 * Every figure on it is read off the pack record. The Figma types "40 GB",
 * "900 mins" and "180+ countries" onto one frame while the card behind it says
 * something else (SOURCE_ISSUES §1.4); here they cannot disagree, which is why
 * the country count reads 17 rather than the drawn "180+".
 */
export function PackDetailSheet({
  pack,
  onClose,
  onBuy,
}: {
  pack: Pack
  onClose: () => void
  onBuy: () => void
}) {
  const [countriesOpen, setCountriesOpen] = useState(false)

  const destinations = useTripStore((x) => x.destinations)
  const tcAccepted = useTripStore((x) => x.tcAccepted)
  const setTcAccepted = useTripStore((x) => x.setTcAccepted)

  /* Your destinations first — on a seventeen-country list they are the only
     rows you opened this for. A destination the pack misses is not here at
     all: it is not covered, and the card that led you here already says so. */
  const covered = [
    ...destinations.filter((iso) => pack.countries.includes(iso)),
    ...pack.countries.filter((iso) => !destinations.includes(iso)),
  ].filter((iso) => COUNTRY_BY_ISO[iso])

  return (
    <Sheet
      open
      onOpenChange={(v) => (v ? undefined : onClose())}
      /* "₹2,999" carries the weight; "excl GST" runs alongside it at body/14,
         which is how the frame sets the two halves of the same line. */
      title={
        <>
          {inr(pack.priceExGst)}{' '}
          <span className="t-body-14 t-secondary">{COPY.packDetail.exclGst}</span>
        </>
      }
      description={priceLabel(pack)}
      trailing={
        <span className={clsx(s.daysChip, 't-caption-12-semi', 't-primary')}>
          {fill(COPY.packs.daysChip, { days: pack.validityDays })}
        </span>
      }
      footerClassName={s.sheetFoot}
      footer={
        <div className={s.sheetFootInner}>
          <Checkbox checked={tcAccepted} onCheckedChange={setTcAccepted}>
            {COPY.packs.tc} <span className="t-link">{COPY.packs.tcLink}</span>
          </Checkbox>
          <Button full disabled={!tcAccepted} onClick={onBuy}>
            {COPY.packDetail.cta}
          </Button>
          <span className={clsx(s.caption, 't-body-14')}>{COPY.packs.caption}</span>
        </div>
      }
    >
      <div className={s.sheetBody}>
        {/* Frame 51. Three allowances, left-aligned, in the chip treatment —
            a 3px white ring inside a 1px grey one. */}
        <div className={s.blocks}>
          <div className={s.block}>
            <span className="t-heading-18">{fullSpeedGb(pack)} GB</span>
            <span className="t-caption-12">{COPY.packDetail.dataLabel}</span>
          </div>
          <div className={s.block}>
            <span className="t-heading-18">{pack.voiceMins}</span>
            <span className="t-caption-12">{COPY.packDetail.voiceLabel}</span>
          </div>
          <div className={s.block}>
            <span className="t-heading-18">{pack.sms}</span>
            <span className="t-caption-12">{COPY.packDetail.smsLabel}</span>
          </div>
        </div>

        {/* Frame 52 — a bulleted list, not two loose paragraphs. The data note
            is written on the pack; the voice note is assembled from its
            minutes, so a 900-minute pack cannot claim 100. */}
        <ul className={s.notes}>
          <li className="t-body-14">{pack.fairUse}</li>
          {pack.voiceMins > 0 && (
            <li className="t-body-14">{fill(COPY.packDetail.voiceNote, { mins: pack.voiceMins })}</li>
          )}
        </ul>

        {pack.inFlight && (
          <section className={s.inflight}>
            {/* Frame 55's `image 6`, mirrored and bled past the top edge
                exactly as the file places it. Decorative, so no alt text. */}
            <img
              className={s.inflightArt}
              src="/assets/521de5fac753ae1790fec5e40ac1d75f0114ab2c.png"
              alt=""
            />
            <div className={s.inflightHead}>
              <span className="t-body-14-med t-link">{COPY.packDetail.inFlightTitle}</span>
              <span className="t-body-14 t-secondary">
                {fill(COPY.packDetail.inFlightValidity, { hours: pack.inFlight.validityHrs })}
              </span>
            </div>
            <p className="t-body-14">
              {fill(COPY.packDetail.inFlightBody, {
                data: pack.inFlight.dataMb,
                mins: pack.inFlight.mins,
                sms: pack.inFlight.sms,
              })}
            </p>
          </section>
        )}

        <div className={s.facts}>
          <button
            className={clsx(s.factRow, 'pressable')}
            aria-expanded={countriesOpen}
            onClick={() => setCountriesOpen((v) => !v)}
          >
            <span className={clsx(s.factIcon, s.factIconDisc)}>
              <Globe size={22} strokeWidth={2} aria-hidden="true" />
            </span>
            <span className={s.factText}>
              <span className="t-value-16-bold">{COPY.packDetail.coveredCountries}</span>
              <span className="t-caption-12">{COPY.packDetail.coveredCountriesSub}</span>
            </span>
            <ChevronDown
              className={s.factChev}
              data-open={countriesOpen}
              size={24}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>

          <AnimatePresence initial={false}>
            {countriesOpen && (
              <motion.div
                className={s.factPanel}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: dur.base, ease: ease.out }}
              >
                <div className={s.countryGrid}>
                  {covered.map((iso) => (
                    <DestinationChip
                      key={iso}
                      country={COUNTRY_BY_ISO[iso]}
                      property="block"
                      state={destinations.includes(iso) ? 'active' : 'default'}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lines 4 and 5. The file stacks them both here, 12px apart, which
              reads as a double border; one rule under each row is what a pair
              of them is for. */}
          <div className={s.factRule} />

          <div className={s.factRow}>
            <span className={clsx(s.factIcon, s.factIconTile)}>
              <PlaneTakeoff size={22} strokeWidth={2} aria-hidden="true" />
            </span>
            <span className={s.factText}>
              <span className="t-value-16-bold">{COPY.packDetail.coveredFlights}</span>
              <span className="t-caption-12">{COPY.packDetail.coveredFlightsSub}</span>
            </span>
            <ChevronDown className={s.factChev} size={24} strokeWidth={2} aria-hidden="true" />
          </div>

          <div className={s.factRule} />

          <p className={clsx(s.exclusion, 't-caption-12', 't-warning')}>
            <Info className={s.exclusionIcon} size={16} strokeWidth={1.33} aria-hidden="true" />
            {COPY.packDetail.exclusion}
          </p>
        </div>
      </div>
    </Sheet>
  )
}
