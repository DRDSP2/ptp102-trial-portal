export const PROHIBITED_TERMS = [
  'cure',
  'safe',
  'effective',
  'breakthrough',
  'no adverse reactions',
  'symptoms resolve',
  'guaranteed',
  'fda approved',
  'fda-approved',
  'miracle',
  'revolutionary',
  'completely safe',
  'no risk',
  'cures laminitis',
  'guaranteed results',
] as const;

export type ProhibitedTermCheck = {
  isClean: boolean;
  flaggedTerms: string[];
  message: string;
};

export function checkProhibitedTerms(text: string): ProhibitedTermCheck {
  const lowerText = text.toLowerCase();
  const flaggedTerms: string[] = [];

  for (const term of PROHIBITED_TERMS) {
    if (lowerText.includes(term.toLowerCase())) {
      flaggedTerms.push(term);
    }
  }

  const isClean = flaggedTerms.length === 0;

  return {
    isClean,
    flaggedTerms,
    message: isClean
      ? ''
      : `This language is prohibited under 21 CFR 511.1(b)(8)(iv) for investigational drugs. Flagged terms: ${flaggedTerms.join(', ')}. Please use objective, factual language only.`,
  };
}

export function sanitizeForDisplay(text: string): { sanitized: string; hasViolations: boolean } {
  let sanitized = text;
  let hasViolations = false;

  for (const term of PROHIBITED_TERMS) {
    const regex = new RegExp(`(${term})`, 'gi');
    if (regex.test(sanitized)) {
      hasViolations = true;
      sanitized = sanitized.replace(regex, '███');
    }
  }

  return { sanitized, hasViolations };
}
