import clsx from 'clsx'
import { Globe } from 'lucide-react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { COPY, COUNTRIES, COUNTRY_BY_ISO, POPULAR_COUNTRIES } from '../../data'
import { fill } from '../../lib/format'
import { rankCountries } from '../../lib/search'
import { collapse, listItem, popItem, staggerList } from '../../motion/presets'
import { useTripStore } from '../../state/tripStore'
import { DestinationChip } from '../../ui/DestinationChip/DestinationChip'
import { SearchField } from '../../ui/SearchField/SearchField'
import { Divider, EmptyState } from '../../ui/primitives'
import s from './DestinationPicker.module.css'

/**
 * Destination search and selection.
 *
 * This is the component the whole rebuild exists for. In the source file the
 * search box is a <div> containing the text "Where are you going?", the typed
 * query on 04.2 is the literal string "UAE |" with a drawn cursor, and the
 * chips are flattened instances that cannot be selected. Moving between the
 * three states meant loading three different pictures.
 *
 * Hand-rolled rather than built on a combobox library, deliberately: this is
 * not a combobox. There is no popup and no single selection — the results stay
 * on the page, each row carries its own Add/Added control, and the selection
 * lives in an array elsewhere on the screen. `useCombobox` models exactly one
 * selected item behind a floating listbox, and fighting that costs more than
 * the ~40 lines of keyboard handling below.
 */
export function DestinationPicker() {
  const query = useTripStore((x) => x.query)
  const setQuery = useTripStore((x) => x.setQuery)
  const destinations = useTripStore((x) => x.destinations)
  const toggleDestination = useTripStore((x) => x.toggleDestination)
  const touch = useTripStore((x) => x.touch)

  /** Toggling anything marks the field as used, so its error may now show. */
  const toggle = (iso2: string) => {
    touch('destinations')
    toggleDestination(iso2)
  }

  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const results = useMemo(
    () => (query.trim() ? rankCountries(query, COUNTRIES, 5) : []),
    [query],
  )

  const showResults = query.trim().length > 0

  /**
   * One row, not two — and the trip is at the front of it.
   *
   * The file draws two groups, "On this trip" and "Popular right now", which
   * means a country has to move between lists when you pick it. One row in
   * selection order does the same job: what you have chosen gathers at the
   * left, the suggestions you have not taken sit behind them, and adding
   * United States from the search field lands it next to UAE rather than at
   * the far end of the row. Everything not chosen is pushed out of the frame,
   * which is the "Popular right now" group disappearing without a second list
   * to disappear from.
   *
   * `layout` on each chip is what makes that a slide rather than a jump.
   */
  const chips = useMemo(() => {
    const chosen = destinations.map((iso) => COUNTRY_BY_ISO[iso]).filter(Boolean)
    const rest = POPULAR_COUNTRIES.filter((c) => !destinations.includes(c.iso2))
    return [...chosen, ...rest]
  }, [destinations])

  /*
   * Three chips already fill the row, so the fourth arrives off the right
   * edge and adding a country looks like it did nothing. Scroll the new one
   * into view instead.
   *
   * It is safe to measure it immediately: the chip that just mounted is at its
   * final position already — only the chips it displaced are mid-`layout`, and
   * those are not what we are scrolling to.
   */
  const chipsRef = useRef<HTMLDivElement>(null)
  const lastCount = useRef(destinations.length)
  useEffect(() => {
    if (destinations.length > lastCount.current) {
      const added = destinations[destinations.length - 1]
      chipsRef.current
        ?.querySelector(`[data-iso="${added}"]`)
        ?.scrollIntoView({ behavior: 'smooth', inline: 'end', block: 'nearest' })
    }
    lastCount.current = destinations.length
  }, [destinations])

  function commit(iso2: string) {
    toggle(iso2)
    setQuery('')
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!showResults || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const pick = results[activeIndex] ?? results[0]
      if (pick) commit(pick.country.iso2)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setQuery('')
      setActiveIndex(-1)
    }
  }

  return (
    <div className={s.wrap}>
      <SearchField
        inputRef={inputRef}
        value={query}
        onValueChange={(v) => {
          setQuery(v)
          setActiveIndex(-1)
        }}
        placeholder={COPY.trip.searchPlaceholder}
        aria-label={COPY.trip.searchAria}
        role="combobox"
        aria-expanded={showResults}
        aria-controls={listId}
        aria-activedescendant={
          activeIndex >= 0 && results[activeIndex]
            ? `${listId}-${results[activeIndex].country.iso2}`
            : undefined
        }
        onKeyDown={onKeyDown}
      />

      <AnimatePresence initial={false}>
        {showResults && (
          <motion.div
            className={s.results}
            variants={collapse}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {results.length > 0 ? (
              <motion.div
                className={s.resultsInner}
                id={listId}
                role="listbox"
                aria-label={COPY.trip.resultsLabel}
                variants={staggerList()}
                initial="hidden"
                animate="show"
              >
                {results.map((hit, i) => {
                  const isSelected = destinations.includes(hit.country.iso2)
                  return (
                    <motion.div
                      key={hit.country.iso2}
                      id={`${listId}-${hit.country.iso2}`}
                      role="option"
                      aria-selected={isSelected}
                      variants={listItem}
                      className={clsx(i === activeIndex && s.active)}
                    >
                      {i > 0 && <Divider />}
                      <DestinationChip
                        country={hit.country}
                        property="row"
                        state={isSelected ? 'active' : 'default'}
                        via={hit.via}
                        onToggle={commit}
                      />
                    </motion.div>
                  )
                })}
              </motion.div>
            ) : (
              <EmptyState
                icon={<Globe size={20} />}
                title={COPY.trip.emptySearchTitle}
                body={fill(COPY.trip.emptySearchBody, { query: query.trim() })}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announces result counts without stealing focus. */}
      <span className="sr-only" role="status" aria-live="polite">
        {showResults
          ? `${results.length} ${results.length === 1 ? 'result' : 'results'}`
          : ''}
      </span>

      {/* One LayoutGroup so a chip that grows on selection pushes its
          neighbours along rather than jumping. */}
      <LayoutGroup>
        <div className={s.chips} ref={chipsRef}>
          <AnimatePresence mode="popLayout" initial={false}>
            {chips.map((c) => (
              <motion.div
                key={c.iso2}
                data-iso={c.iso2}
                layout
                variants={popItem}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <DestinationChip
                  country={c}
                  state={destinations.includes(c.iso2) ? 'active' : 'default'}
                  onToggle={toggle}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </div>
  )
}
