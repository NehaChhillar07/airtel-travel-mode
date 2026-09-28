import { AnimatePresence } from 'motion/react'
import { useEffect } from 'react'
import { NOTIFICATION_BY_ID } from '../../data'
import { addDays } from 'date-fns'
import { formatLockDate, fromISO, toISO } from '../../lib/dates'
import { fill, fullSpeedGb, inr } from '../../lib/format'
import { unexpectedSpend } from '../../lib/pricing'
import { dataFraction, minsLeft, packDaysLeft, smsLeft } from '../../lib/usage'
import { useLiveStore } from '../../state/liveStore'
import { useTripStore } from '../../state/tripStore'
import { useCurrentCountry, useSelectedPack, useTripDays } from '../../state/selectors'
import type { RouteId } from '../../app/routes'
import { useUiStore } from '../../state/uiStore'
import { StatusBar } from '../../ui/Chrome/Chrome'
import { LiveActivity } from '../../ui/LiveActivity/LiveActivity'
import { Notification } from '../../ui/Notification/Notification'
import s from './LockScreen.module.css'

/**
 * 05.7 - 05.13, all seven, as one screen.
 *
 * They are seven pictures of the same lock screen with a different banner on
 * it, so they are one component reading notifications.json. 05.12 is the same
 * screen with the Live Activity showing instead.
 *
 * Which of the eight states you see is set by the index rail, which already
 * lists all seven notification screens plus the widget. There is no picker on
 * the screen itself — it would be a second control for the same thing, sitting
 * on top of the lock screen it is meant to be showing you.
 */
export function LockScreen() {
  const pack = useSelectedPack()
  const tripDays = useTripDays()
  const country = useCurrentCountry()
  const live = useLiveStore()
  const range = useTripStore((x) => x.range)

  const notificationId = useUiStore((x) => x.notificationId)
  const setNotification = useUiStore((x) => x.setNotification)
  const expanded = useUiStore((x) => x.liveActivityExpanded)
  const setExpanded = useUiStore((x) => x.setLiveActivityExpanded)
  const navigate = useUiStore((x) => x.navigate)

  const showLiveActivity = !notificationId
  const record = notificationId ? NOTIFICATION_BY_ID[notificationId] : null

  /*
    Days of the *trip*, not of the pack — the widget's headline counts down to
    coming home, and the pack outlasts the trip by a day. Today counts, so a
    9-day trip on day 3 has 7 to go, not 6.
  */
  const daysToGo = Math.max(0, tripDays - live.dayOfTrip + 1)
  const extra = unexpectedSpend(live.ledger)
  /* Landed and Today are behind you from day one; Last day and Home are not. */
  const stepIndex = live.dayOfTrip > tripDays ? 3 : live.dayOfTrip >= tripDays ? 2 : 1
  /* The bar and the rail have to agree, so both read the same fraction. */
  const progress = tripDays > 0 ? Math.min(1, live.dayOfTrip / tripDays) : 0

  /*
    The lock screen's date is the trip's date, not the day the wallpaper was
    photographed. The wallpaper used to carry its own "Thu 13 Aug · 6:26",
    twelve days before this trip even starts; that strip is now painted over
    and the date comes from the same trip day the banners are counting.
  */
  const lockDate = range.from
    ? formatLockDate(toISO(addDays(fromISO(range.from), Math.max(0, live.dayOfTrip - 1))))
    : ''

  /* "tomorrow" only when it is. Pack days left counts today. */
  const daysLeft = packDaysLeft(live, pack)
  const endsWhen =
    daysLeft <= 1 ? 'tonight' : daysLeft === 2 ? 'tomorrow' : `in ${daysLeft - 1} days`

  const tokens = {
    flag: country?.flagEmoji ?? '',
    country: country?.name ?? 'Singapore',
    dayOfPack: live.dayOfPack,
    dayOfTrip: live.dayOfTrip,
    mins: pack?.voiceMins ?? 0,
    packDays: pack?.validityDays ?? 0,
    amount: inr(extra),
    endsWhen,
    dataPct: `${Math.round(dataFraction(live, pack) * 100)}%`,
    fup: pack ? fullSpeedGb(pack) : 0,
    price: pack ? inr(pack.priceExGst) : '—',
    validity: pack?.validityDays ?? 0,
    tripDays,
  }

  /*
    The morph IS the screen — 05.12's note says so. So the widget always
    arrives collapsed and opens a beat later, even when the index entry asked
    for the expanded state, and the reviewer sees the pill become the card
    instead of finding the card already there.
  */
  useEffect(() => {
    if (!showLiveActivity) return
    setExpanded(false)
    const t = setTimeout(() => setExpanded(true), 900)
    return () => clearTimeout(t)
  }, [showLiveActivity, setExpanded])

  return (
    <div className={s.screen}>
      <img
        className={s.wallpaper}
        src="/assets/f643f0a57e7b794f33f8c123ddb7a38ce983ac46.png"
        alt=""
      />
      {/* `image 9` is a full lock-screen capture with its own status bar, date
          and clock baked in. Its top is plain black, so that strip is painted
          over and the date and clock are drawn from the trip instead. */}
      <span className={s.wallpaperMask} aria-hidden="true" />
      <span className={s.wash} aria-hidden="true" />
      <div className={s.statusLayer}>
        <StatusBar dark carrier="airtel" battery={86} />
      </div>

      <div className={s.clock}>
        <span className={s.date}>{lockDate}</span>
        <span className={s.time}>6:26</span>
      </div>

      {showLiveActivity ? (
        <div className={s.islandWrap}>
          <LiveActivity
            country={tokens.country}
            dayOfTrip={live.dayOfTrip}
            tripDays={tripDays}
            daysToGo={daysToGo}
            stepIndex={stepIndex}
            progress={progress}
            minsLeft={pack && pack.voiceMins > 0 ? minsLeft(live, pack) : null}
            smsLeft={pack && pack.sms > 0 ? smsLeft(live, pack) : null}
            extraSpend={extra}
            expanded={expanded}
            onToggle={() => setExpanded(!expanded)}
            onOpen={() => navigate('dashboard', 'jump')}
            onBuyPack={() => navigate('packs', 'jump')}
          />
        </div>
      ) : (
        <div className={s.notifications}>
          <AnimatePresence initial={false}>
            {record && (
              <Notification
                key={record.id}
                app={record.app}
                at={record.at}
                title={fill(record.title, tokens)}
                body={fill(record.body, tokens)}
                tone={record.tone}
                onDark
                onPress={() => navigate(record.opens as RouteId, 'jump')}
                onDismiss={() => setNotification(null)}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* No drawn flashlight, camera or home bar: the wallpaper photo already
          carries all three, and drawing them again stacked a second set a
          few pixels off the first. */}
    </div>
  )
}
