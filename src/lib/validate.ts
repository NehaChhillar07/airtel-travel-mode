/**
 * Form rules.
 *
 * The Figma drew the trip CTA disabled on 04.1 and enabled on 04.3 as two
 * separate pictures. This is the rule that decides which one you see.
 */

import { COPY, SETTINGS } from '../data'
import { isBackwardsRange, isCompleteRange, isPastDeparture, tripLengthDays } from './dates'
import { fill } from './format'
import type { TripDraft, TripValidation, ValidationError } from './types'

export function validateTrip(draft: TripDraft): TripValidation {
  const errors: ValidationError[] = []
  const c = COPY.trip

  if (draft.destinations.length === 0) {
    errors.push({ field: 'destinations', message: c.errNoDestination })
  }

  if (!isCompleteRange(draft.range)) {
    errors.push({ field: 'range', message: c.errNoDates })
  } else if (isBackwardsRange(draft.range)) {
    errors.push({ field: 'range', message: c.errRangeBackwards })
  } else if (isPastDeparture(draft.range)) {
    errors.push({ field: 'range', message: c.errPastDeparture })
  } else if (tripLengthDays(draft.range) > SETTINGS.maxTripDays) {
    errors.push({
      field: 'range',
      message: fill(c.errTooLong, { max: SETTINGS.maxTripDays }),
    })
  }

  const canViewPacks = errors.length === 0

  const packErrors: ValidationError[] = []
  if (!draft.selectedPackId) {
    packErrors.push({ field: 'pack', message: COPY.packs.errNoPack })
  }
  if (!draft.tcAccepted) {
    packErrors.push({ field: 'terms', message: COPY.packs.errNoTerms })
  }

  return {
    canViewPacks,
    canContinue: canViewPacks && packErrors.length === 0,
    errors: [...errors, ...packErrors],
  }
}

export function errorFor(
  validation: TripValidation,
  field: ValidationError['field'],
): string | null {
  return validation.errors.find((e) => e.field === field)?.message ?? null
}
