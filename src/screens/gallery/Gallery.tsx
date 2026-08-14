import { useState } from 'react'
import { LayoutGroup } from 'motion/react'
import { Globe, Plane } from 'lucide-react'
import { COUNTRY_BY_ISO, HOME } from '../../data'
import { Screen } from '../../ui/Screen/Screen'
import { NavBar, StatusBar, TileRow } from '../../ui/Chrome/Chrome'
import { Button } from '../../ui/Button/Button'
import { DestinationChip } from '../../ui/DestinationChip/DestinationChip'
import { SearchField } from '../../ui/SearchField/SearchField'
import { DateField, DateFieldRow } from '../../ui/DateField/DateField'
import { Checkbox, Switch, SwitchRow } from '../../ui/Controls/Controls'
import { Money } from '../../ui/Money/Money'
import { Badge, Card, Divider, EmptyState, ProgressBar, Skeleton } from '../../ui/primitives'
import { useUiStore } from '../../state/uiStore'
import s from './Gallery.module.css'

/**
 * Every variant, side by side.
 *
 * The brief that produced this rebuild said the components had been drawn but
 * "you did not pick the state management and variants very seriously". This
 * page is the answer to that: one scroll that renders each Figma component set
 * in every state it was designed with, so a missing variant is visible rather
 * than discovered three screens later.
 */

const SURFACE_TOKENS = [
  'bg-page', 'bg-card', 'bg-raised', 'bg-chip', 'bg-info', 'bg-alert', 'bg-success',
]
const INK_TOKENS = [
  'text-heading', 'text-primary', 'text-secondary', 'text-alert', 'text-link',
  'action-primary-fill', 'border-subtle', 'brand', 'status-critical', 'status-success',
]

/** The twelve TEXT styles named in the Figma file, in scale order. */
const TYPE_STYLES: [string, string][] = [
  ['display/32', 't-display-32'],
  ['title/24', 't-title-24'],
  ['title/24 Med', 't-title-24-med'],
  ['heading/18', 't-heading-18'],
  ['value/16 Bold', 't-value-16-bold'],
  ['value/16 Med', 't-value-16-med'],
  ['body/14', 't-body-14'],
  ['body/14 Med', 't-body-14-med'],
  ['bodyStrong/14', 't-bodystrong-14'],
  ['label/12', 't-label-12'],
  ['caption/12', 't-caption-12'],
  ['caption/12 Semi', 't-caption-12-semi'],
]

function Group({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className={s.group}>
      <header className={s.groupHead}>
        <h2 className="t-label-12">{title}</h2>
        {note && <span className="t-caption-12 t-secondary">{note}</span>}
      </header>
      {children}
    </section>
  )
}

export function Gallery() {
  const back = useUiStore((x) => x.back)
  const [checked, setChecked] = useState(true)
  const [switched, setSwitched] = useState(true)
  const [query, setQuery] = useState('Sing')
  const [selected, setSelected] = useState<string[]>(['SG', 'MY'])
  const [loading, setLoading] = useState(false)

  const toggle = (iso: string) =>
    setSelected((prev) => (prev.includes(iso) ? prev.filter((c) => c !== iso) : [...prev, iso]))

  const SG = COUNTRY_BY_ISO.SG
  const MY = COUNTRY_BY_ISO.MY
  const AE = COUNTRY_BY_ISO.AE
  const TH = COUNTRY_BY_ISO.TH

  return (
    <Screen top={<><StatusBar /><NavBar title="Component gallery" onBack={back} /></>}>
      <div className={s.wrap}>
        <header className={s.head}>
          <h1 className="t-title-24">Foundations, in code</h1>
          <p className="t-body-14 t-secondary">
            Every swatch and type style below is read from tokens.css, not
            re-typed. Every component shows the full variant matrix the Figma
            component set defines.
          </p>
        </header>

        <Group title="Surfaces">
          <div className={s.swatches}>
            {SURFACE_TOKENS.map((t) => (
              <div className={s.swatch} key={t}>
                <span className={s.chipDot} style={{ background: `var(--${t})` }} />
                <span className="t-caption-12">{t.replace('-', '/')}</span>
              </div>
            ))}
          </div>
        </Group>

        <Group title="Ink, action, status">
          <div className={s.swatches}>
            {INK_TOKENS.map((t) => (
              <div className={s.swatch} key={t}>
                <span className={s.chipDot} style={{ background: `var(--${t})` }} />
                <span className="t-caption-12">{t.replace(/-/g, '/')}</span>
              </div>
            ))}
          </div>
        </Group>

        <Group title="Type" note="12 named styles">
          <div className={s.col}>
            {TYPE_STYLES.map(([name, cls]) => (
              <div className={s.typeRow} key={name}>
                <span className={`${s.typeName} t-caption-12`}>{name}</span>
                <span className={cls}>Days left</span>
              </div>
            ))}
          </div>
          <p className="t-caption-12 t-secondary">
            These are the twelve TEXT styles named in the Figma file, with the
            weights measured off the nodes that use them. Four are Medium or
            Semibold, which the Foundations board's "Regular and Bold only" rule
            does not yet allow for.
          </p>
        </Group>

        <Group title="Destination · Chip" note="State × Property">
          <LayoutGroup>
            <div className={s.row}>
              {[SG, MY, AE, TH].map((c) => (
                <DestinationChip
                  key={c.iso2}
                  country={c}
                  state={selected.includes(c.iso2) ? 'active' : 'default'}
                  onToggle={toggle}
                />
              ))}
            </div>
          </LayoutGroup>
          <span className={`${s.caption} t-caption-12 t-secondary`}>
            Tap one. Default is 47px with the gradient fill; Active is 53px,
            flat, with a 3px white ring inside a 1px grey ring.
          </span>
        </Group>

        <Group title="Destination · Row">
          <Card tone="outlined" padding="sm" style={{ padding: 0, overflow: 'hidden' }}>
            {[AE, SG, MY].map((c, i) => (
              <div key={c.iso2}>
                {i > 0 && <Divider />}
                <DestinationChip
                  country={c}
                  property="row"
                  state={selected.includes(c.iso2) ? 'active' : 'default'}
                  onToggle={toggle}
                />
              </div>
            ))}
          </Card>
        </Group>

        <Group title="Destination · Block">
          <div className={s.row}>
            {[SG, MY, AE].map((c) => (
              <DestinationChip
                key={c.iso2}
                country={c}
                property="block"
                state={selected.includes(c.iso2) ? 'active' : 'default'}
                onToggle={toggle}
              />
            ))}
          </div>
        </Group>

        <Group title="Button" note="type × size × state">
          <div className={s.col}>
            <div className={s.row}>
              <Button size="md">Primary</Button>
              <Button size="md" variant="secondary">Secondary</Button>
              <Button size="md" variant="ghost">Ghost</Button>
            </div>
            <div className={s.row}>
              <Button size="md" disabled>Disabled</Button>
              <Button size="md" variant="secondary" disabled>Disabled</Button>
              <Button size="sm">Small</Button>
            </div>
            <Button
              full
              loading={loading}
              onClick={() => {
                setLoading(true)
                setTimeout(() => setLoading(false), 1400)
              }}
            >
              Tap for the loading state
            </Button>
          </div>
        </Group>

        <Group title="Fields">
          <div className={s.col}>
            <SearchField value={query} onValueChange={setQuery} placeholder="Where are you going?" />
            <DateFieldRow>
              <DateField label="Leaving" value="2026-08-25" placeholder="Select" />
              <DateField label="Coming back" value={null} placeholder="Select" />
            </DateFieldRow>
          </div>
        </Group>

        <Group title="Controls">
          <div className={s.col}>
            <Checkbox checked={checked} onCheckedChange={setChecked}>
              I agree to all terms and conditions
            </Checkbox>
            <Checkbox checked={false} onCheckedChange={() => {}} invalid>
              Invalid state
            </Checkbox>
            <SwitchRow>
              <span className="t-body-14">Add another pack if this one runs out</span>
              <Switch checked={switched} onCheckedChange={setSwitched} label="Auto top-up" />
            </SwitchRow>
          </div>
        </Group>

        <Group title="Badges">
          <div className={s.row}>
            <Badge tone="brand">Recommended</Badge>
            <Badge tone="neutral">9 Days</Badge>
            <Badge tone="alert">Payment overdue</Badge>
            <Badge tone="success">Connected</Badge>
          </div>
        </Group>

        <Group title="Cards">
          <div className={s.col}>
            <Card tone="surface"><span className="t-body-14">bg/card</span></Card>
            <Card tone="raised"><span className="t-body-14">bg/raised</span></Card>
            <Card tone="info"><span className="t-body-14">bg/info</span></Card>
            <Card tone="alert"><span className="t-body-14 t-alert">bg/alert</span></Card>
            <Card tone="outlined"><span className="t-body-14">outlined</span></Card>
          </div>
        </Group>

        <Group title="Tiles" note="Property 1 = Default | Active">
          <TileRow items={HOME.quickActions} activeId="travel" />
        </Group>

        <Group title="Money" note="counts from the previous value">
          <div className={s.row}>
            <span className="t-display-32"><Money value={3539} /></span>
          </div>
        </Group>

        <Group title="Progress">
          <div className={s.col}>
            <ProgressBar value={0.35} label="Data used" />
            <ProgressBar value={0.88} tone="alert" label="Data used" />
          </div>
        </Group>

        <Group title="States the Figma never drew">
          <div className={s.col}>
            <Card tone="outlined" padding="sm">
              <EmptyState
                icon={<Globe size={20} />}
                title="No match"
                body="We don't have a pack for that yet. Try the country rather than the city."
              />
            </Card>
            <Card tone="outlined" padding="sm">
              <div className={s.col}>
                <Skeleton width="60%" />
                <Skeleton width="40%" />
                <Skeleton variant="block" />
              </div>
            </Card>
            <Card tone="outlined" padding="sm">
              <EmptyState
                icon={<Plane size={20} />}
                title="No trip yet"
                body="Tell us where you are going and we'll size a pack for it."
              />
            </Card>
          </div>
        </Group>
      </div>
    </Screen>
  )
}
