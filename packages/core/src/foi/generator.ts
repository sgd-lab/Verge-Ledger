import {
  CANONICAL_QUESTIONS,
  COMPREHENSIVE_QUESTIONS,
  ECOLOGICAL_QUESTIONS,
  FOI_DEFAULT_SALUTATION,
} from './constants.js';
import type { FoiRequestParams } from './types.js';

/**
 * Generates a formal statutory request letter under EIR 2004 (Reg 5) and FOIA 2000 (s.1).
 *
 * Produces clean, professional markdown/plain-text ready to copy to clipboard or send via WhatDoTheyKnow.
 * Zero DOM, network, or external runtime dependencies.
 */
export function generateFoiRequest(params: FoiRequestParams): string {
  const salutation = params.salutation ?? FOI_DEFAULT_SALUTATION;
  const council = params.councilName.trim();
  const requester = params.requesterName?.trim() || '[Your Name]';

  // Determine questions list
  let questions: string[];
  if (params.customQuestions && params.customQuestions.length > 0) {
    questions = params.customQuestions;
  } else if (params.preset === 'ecological') {
    questions = ECOLOGICAL_QUESTIONS;
  } else if (params.preset === 'comprehensive') {
    questions = COMPREHENSIVE_QUESTIONS;
  } else {
    questions = CANONICAL_QUESTIONS;
  }

  const numberedQuestions = questions.map((q, idx) => `${idx + 1}. ${q}`).join('\n');

  const lines: string[] = [
    salutation,
    '',
    `Under the Freedom of Information Act 2000 and the Environmental Information Regulations 2004, please provide the following information about ${council}'s management of highway verges:`,
    '',
    numberedQuestions,
  ];

  if (params.additionalNotes && params.additionalNotes.trim().length > 0) {
    lines.push('', params.additionalNotes.trim());
  }

  lines.push(
    '',
    'Please provide the information in a reusable, machine-readable format such as CSV or spreadsheet where possible.',
    '',
    'If any part of this request is unclear, please contact me as public authorities have a duty to advise and assist under FOIA Section 16 and EIR Regulation 9. If you refuse any part of this request, please cite the specific exemption or exception relied upon and explain the public interest test applied.',
    '',
    'I note that under EIR Regulation 7 and FOIA Section 10, a response is due as soon as possible and in any event within 20 working days.',
    '',
    'Yours sincerely,',
    requester,
  );

  return lines.join('\n');
}
