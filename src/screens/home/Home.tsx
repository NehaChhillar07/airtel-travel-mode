import clsx from "clsx";
import {
  ChevronRight,
  CreditCard,
  Globe,
  Headphones,
  IndianRupee,
  ShoppingBag,
} from "lucide-react";
import { motion } from "motion/react";
import { HOME } from "../../data";
import { pluralise } from "../../lib/format";
import { dayFraction, packDaysLeft } from "../../lib/usage";
import { listItem, spring, staggerList } from "../../motion/presets";
import { useLiveStore } from "../../state/liveStore";
import {
  useDestinations,
  useSelectedPack,
  useTripDays,
} from "../../state/selectors";
import { useTripStore } from "../../state/tripStore";
import { useQuickActionNav, useUiStore } from "../../state/uiStore";
import type { RouteId } from "../../app/routes";
import { AppHeader, StatusBar, TileRow } from "../../ui/Chrome/Chrome";
import { Flag } from "../../ui/Flag/Flag";
import { Screen } from "../../ui/Screen/Screen";
import { Badge, Card, ProgressBar } from "../../ui/primitives";
import { DepartureCurtain } from "../../patterns/DepartureCurtain/DepartureCurtain";
import { useDepartureSequence } from "./useDepartureSequence";
import s from "./Home.module.css";

const SERVICE_ICONS: Record<string, typeof Globe> = {
  sim: CreditCard,
  roaming: Globe,
};

/**
 * The airtel swoosh, traced from the footer's own `Vector` node (145:1250).
 * 24 x 23.723 in the file, drawn #E40000 — a shade hotter than the `Manage`
 * label under it, which is #D73737.
 */
function AirtelMark() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 23.723"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7.13686 23.723C7.92686 23.723 8.84486 23.533 9.88786 23.169C11.4379 22.631 12.6719 21.888 13.8739 21.16L14.1899 20.955C15.5135 20.1479 16.772 19.2384 17.9539 18.235C20.454 16.2975 22.3476 13.685 23.4109 10.706C23.8059 9.568 24.3599 7.322 23.6789 5.219C23.1787 3.68035 22.1693 2.35803 20.8169 1.47C20.6589 1.344 18.9189 0 15.6139 0C12.6089 0 9.30386 1.107 5.80786 3.32L5.69786 3.4L5.38086 3.605C4.57199 4.11382 3.80037 4.67958 3.07186 5.298C1.58486 6.674 -0.0911393 8.967 0.00386068 10.928C0.0348607 11.718 0.430861 12.462 1.07886 12.936C1.71728 13.4094 2.49878 13.6494 3.29286 13.616C5.09586 13.616 7.05786 12.668 8.40186 11.876L8.65486 11.719L9.35086 11.276L9.58786 11.118C11.4859 9.884 13.4629 8.603 15.6929 7.86C16.1923 7.68762 16.7148 7.59155 17.2429 7.575C17.4664 7.57813 17.689 7.60494 17.9069 7.655C18.2194 7.71655 18.514 7.84801 18.7686 8.03954C19.0232 8.23108 19.2311 8.47772 19.3769 8.761C19.8999 9.773 19.7729 11.371 19.0609 12.841C17.8699 15.1147 16.2031 17.1052 14.1739 18.677C13.1857 19.5199 12.1157 20.262 10.9799 20.892L10.8849 20.923C10.415 21.1961 9.92295 21.4289 9.41386 21.619L9.33386 21.651L8.92386 21.809C6.69386 22.379 8.05386 20.48 8.05386 20.48C8.52786 19.943 9.03386 19.452 9.57186 18.978C9.88786 18.709 10.2049 18.424 10.5049 18.124L10.5689 18.061C10.9639 17.681 11.5019 17.159 11.4699 16.416C11.4229 15.436 10.3949 14.834 9.41386 14.803L9.35086 14.803C8.40086 14.803 7.53186 15.325 6.94686 15.783C6.32289 16.272 5.7831 16.8598 5.34886 17.523C4.74886 18.424 3.49886 20.749 4.71686 22.6C5.20686 23.343 6.02986 23.723 7.13686 23.723Z"
        fill="currentColor"
      />
    </svg>
  );
}

const NAV_ICONS: Record<string, typeof Globe> = {
  shop: ShoppingBag,
  ask: Headphones,
};

/**
 * A bottom-nav glyph, 24px in all three of its forms.
 *
 * `manage` is the wordmark. `finance` is the odd one out: a filled disc in the
 * metal gradient with a 14px rupee knocked out of it in white. The rest are
 * plain glyphs painted with that same gradient.
 */
function NavGlyph({ icon }: { icon: string }) {
  if (icon === "manage") {
    return (
      <span className={clsx(s.navGlyph, s.navLogo)}>
        <AirtelMark />
      </span>
    );
  }

  if (icon === "finance") {
    return (
      <span className={clsx(s.navGlyph, s.navDisc)}>
        <IndianRupee size={14} strokeWidth={2.4} aria-hidden="true" />
      </span>
    );
  }

  const Icon = NAV_ICONS[icon] ?? ShoppingBag;
  return (
    <span className={s.navGlyph}>
      <Icon
        size={24}
        strokeWidth={2}
        stroke="url(#nav-glyph)"
        color="url(#nav-glyph)"
        aria-hidden="true"
      />
    </span>
  );
}

/**
 * 01 The problem, and 01.1 Home screen today.
 *
 * The same home screen, before and after. With no trip it shows the row the
 * whole project is about — "International Roaming · Your plan doesn't work
 * outside India" — and with a live trip that row becomes the trip itself.
 *
 * There is only one of these. The Figma names the board "01 The problem" and
 * crops "01.1 Home screen today" out of it, but both are this screen.
 */
export function Home() {
  const status = useTripStore((x) => x.status);
  const pack = useSelectedPack();
  const days = useTripDays();
  const destinations = useDestinations();
  const live = useLiveStore();
  const navigate = useUiStore((x) => x.navigate);
  const quickAction = useQuickActionNav();

  const hasTrip = status === "confirmed";
  const daysLeft = packDaysLeft(live, pack);

  /*
    The departure sequence. Tapping anything that opens the trip screen turns
    the roaming row over first — so the Travel tile and the row itself both get
    the same answer, and there is only one animation to keep working.
  */
  const departure = useDepartureSequence();

  return (
    <Screen
      scrollKey="home"
      top={
        <>
          <StatusBar />
          <AppHeader />
          <TileRow
            items={HOME.quickActions}
            activeId="all"
            /* The Travel tile gets the same answer as the row it sits above —
               one animation, both doors. Everything else navigates plainly. */
            onSelect={(item, el) =>
              item.opens === "trip" ? departure.start(el) : quickAction(item)
            }
          />
        </>
      }
    >
      <motion.div
        className={s.body}
        variants={staggerList(0.05)}
        initial="hidden"
        animate="show"
      >
        <motion.section variants={listItem}>
          <h2 className="t-label-12" style={{ marginBottom: 14 }}>
            My Services
          </h2>

          {hasTrip ? (
            /* Travel Mode activation lands here: the roaming row becomes the
                 live trip. */
            <Card tone="outlined">
              <motion.button
                className={s.tripCard}
                style={{ width: "100%", textAlign: "left" }}
                layoutId="travel-card"
                transition={spring.gentle}
                onClick={() => navigate("dashboard")}
              >
                <div className={s.tripHead}>
                  <span className={s.flags}>
                    {destinations.map((c) => (
                      <Flag key={c.iso2} country={c} size={20} />
                    ))}
                  </span>
                  <Badge tone="success">Travel Mode on</Badge>
                </div>
                <span className="t-value-16-med">
                  {daysLeft} {pluralise(daysLeft, "day", "days")} left on your
                  pack
                </span>
                <ProgressBar
                  value={dayFraction(live, pack)}
                  label="Pack days used"
                />
                <span className="t-caption-12 t-secondary">
                  {days} {pluralise(days, "day", "days")} trip · tap to see what
                  it has cost
                </span>
              </motion.button>
            </Card>
          ) : (
            <div className={s.services}>
              {HOME.services.map((svc) => {
                const Icon = SERVICE_ICONS[svc.icon] ?? Globe;
                return (
                  <button
                    className={clsx(s.serviceRow, "pressable")}
                    key={svc.id}
                    onClick={(e) =>
                      svc.opens === "trip"
                        ? departure.start(e.currentTarget)
                        : svc.opens && navigate(svc.opens as RouteId)
                    }
                  >
                    <span className={s.serviceIcon}>
                      <Icon size={19} strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className={s.serviceText}>
                      <span className="t-value-16-bold">{svc.title}</span>
                      <span
                        className={clsx(
                          s.serviceSub,
                          "t-caption-12",
                          "t-secondary",
                        )}
                      >
                        {svc.subtitle}
                        {svc.status && (
                          <>
                            {" . "}
                            <span className="t-critical">{svc.status}</span>
                          </>
                        )}
                      </span>
                    </span>
                    <ChevronRight
                      className={s.chev}
                      size={18}
                      strokeWidth={2.2}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </motion.section>

        <motion.section variants={listItem}>
          <div className={s.sectionHead}>
            <h2 className="t-label-12">Buy Airtel products</h2>
            <span className="t-body-14-med t-link">View All</span>
          </div>
          <div className={s.grid}>
            {HOME.products.map((p) => (
              <span className={s.product} key={p.id}>
                {/* Black in the file, not the grey a caption defaults to —
                      the product name is the tile's heading. */}
                <span
                  className={clsx(s.productLabel, "t-caption-12", "t-heading")}
                >
                  {p.label}
                </span>
                <img className={s.productImg} src={p.image} alt="" />
              </span>
            ))}
          </div>
        </motion.section>
      </motion.div>

      <nav className={s.bottomNav} aria-label="Main">
        {/* Same trick as TileRow: the file's nav glyphs are raster fills in
              `linear-gradient(180.37deg,#7E8897,#000000)` and were not exported,
              so lucide stands in carrying that gradient. `userSpaceOnUse` is
              required — the default box resolves to zero width on hairline
              sub-paths and they disappear. */}
        <svg
          width="0"
          height="0"
          aria-hidden="true"
          style={{ position: "absolute" }}
        >
          <defs>
            <linearGradient
              id="nav-glyph"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="0.15"
              y2="24"
            >
              <stop offset="0%" stopColor="#7E8897" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
          </defs>
        </svg>

        {HOME.bottomNav.map((item, i) => {
          const active = i === 0;
          return (
            <button
              className={s.navItem}
              key={item.id}
              data-active={active}
              aria-current={active ? "page" : undefined}
            >
              <NavGlyph icon={item.icon} />
              {/*
                  Poppins 600 12/16 on the active tab, Inter 400 11.5/14 on the
                  rest — which is what the file draws, and why `.ios-caption`
                  turns up outside the iOS chrome it is otherwise reserved for.
                  See DIVERGENCES.md §4.
                */}
              <span
                className={active ? "t-caption-12-semi" : "ios-caption"}
                style={{ color: "inherit" }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Once a load. After it has been seen the tile just navigates — there
          is no second, shorter version any more. See useDepartureSequence. */}
      <DepartureCurtain
        origin={departure.origin}
        stage={departure.stage}
        onProblemLanded={departure.onProblemLanded}
        onAnswerLanded={departure.onAnswerLanded}
        onSkip={departure.skip}
      />
    </Screen>
  );
}
