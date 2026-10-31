/**
 * Verge Ledger Core Domain Module
 * Pure domain logic, Zod schemas, scoring engine, advisor, and export helpers.
 * Zero DOM, Node, or network dependencies.
 */

export const CORE_VERSION = '0.1.0';

export function getCoreVersion(): string {
  return CORE_VERSION;
}

export * from './schemas/index.js';
