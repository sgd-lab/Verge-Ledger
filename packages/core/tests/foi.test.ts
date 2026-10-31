import { describe, expect, it } from 'vitest';
import {
  CANONICAL_QUESTIONS,
  COMPREHENSIVE_QUESTIONS,
  ECOLOGICAL_QUESTIONS,
  FOI_UI_NOTICE,
  generateFoiRequest,
} from '../src/index.js';

describe('FOI and EIR Request Generator', () => {
  it('generates a canonical FOI/EIR request by default', () => {
    const text = generateFoiRequest({
      councilName: 'Norfolk County Council',
      requesterName: 'Jane Smith',
    });

    expect(text).toContain('Norfolk County Council');
    expect(text).toContain('Jane Smith');
    expect(text).toContain('Freedom of Information Act 2000');
    expect(text).toContain('Environmental Information Regulations 2004');
    expect(text).toContain('20 working days');
    expect(text).toContain('CSV or spreadsheet');

    // Verifies all 5 canonical questions are present
    for (const q of CANONICAL_QUESTIONS) {
      expect(text).toContain(q);
    }
  });

  it('generates an ecological preset request when requested', () => {
    const text = generateFoiRequest({
      councilName: 'Devon County Council',
      requesterName: 'Robin Goodfellow',
      preset: 'ecological',
    });

    expect(text).toContain('Devon County Council');
    for (const q of ECOLOGICAL_QUESTIONS) {
      expect(text).toContain(q);
    }
    expect(text).not.toContain(CANONICAL_QUESTIONS[4]!); // spend question from canonical
  });

  it('generates a comprehensive request with all 8 questions', () => {
    const text = generateFoiRequest({
      councilName: 'Oxfordshire County Council',
      preset: 'comprehensive',
    });

    expect(text).toContain('Oxfordshire County Council');
    expect(text).toContain('[Your Name]'); // Fallback default
    for (const q of COMPREHENSIVE_QUESTIONS) {
      expect(text).toContain(q);
    }
  });

  it('supports custom questions override and additional notes', () => {
    const text = generateFoiRequest({
      councilName: 'Suffolk County Council',
      requesterName: 'Alice Green',
      customQuestions: [
        'How many Roadside Nature Reserves are currently designated in Suffolk?',
        'What is the contractor flail cutter height setting specified in current contracts?',
      ],
      additionalNotes: 'This request relates specifically to the A140 and B1113 corridors.',
    });

    expect(text).toContain('1. How many Roadside Nature Reserves');
    expect(text).toContain('2. What is the contractor flail cutter height');
    expect(text).toContain('This request relates specifically to the A140 and B1113 corridors.');
  });

  it('exports user-facing UI advice notice', () => {
    expect(FOI_UI_NOTICE).toContain('Not legal advice');
    expect(FOI_UI_NOTICE).toContain('WhatDoTheyKnow');
  });
});
