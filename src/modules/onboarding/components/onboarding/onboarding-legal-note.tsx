import * as React from 'react';
import { LegalNote } from '@/components/ui';

type OnboardingLegalNoteProps = {
  marginBottom: number;
};

export function OnboardingLegalNote({ marginBottom }: OnboardingLegalNoteProps) {
  return <LegalNote marginTop={6} marginBottom={marginBottom} />;
}
