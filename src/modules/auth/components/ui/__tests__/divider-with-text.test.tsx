import * as React from 'react';

import { cleanup, render, screen } from '@/lib/test-utils';

import { DividerWithText } from '../divider-with-text';

afterEach(cleanup);

describe('dividerWithText', () => {
  it('should render the text between divider lines', () => {
    render(<DividerWithText text="or" />);
    expect(screen.getByText('or')).toBeOnTheScreen();
  });

  it('should render with custom text', () => {
    render(<DividerWithText text="Continue with" />);
    expect(screen.getByText('Continue with')).toBeOnTheScreen();
  });

  it('should render with Arabic text', () => {
    render(<DividerWithText text="أو" />);
    expect(screen.getByText('أو')).toBeOnTheScreen();
  });

  it('should render exactly one text node with the provided text', () => {
    render(<DividerWithText text="or" />);
    const textElements = screen.getAllByText('or');
    expect(textElements).toHaveLength(1);
  });
});
