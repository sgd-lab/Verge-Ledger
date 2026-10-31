import type { IndicatorSpecies } from '@verge-ledger/core';
import rawIndicators from '../indicators.json' with { type: 'json' };

export const DATA_VERSION = '0.1.0';
export const INDICATOR_SPECIES: IndicatorSpecies[] = rawIndicators as IndicatorSpecies[];
