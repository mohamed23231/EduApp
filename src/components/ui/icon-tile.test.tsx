import * as React from 'react';
import { Text } from 'react-native';
import { cleanup, render, screen } from '@/lib/test-utils';
import { IconTile } from './icon-tile';

afterEach(cleanup);

describe('iconTile', () => {
  it('renders with default props and testID', () => {
    render(
      <IconTile icon={<Text>X</Text>} bg="#6366F1" testID="icon-tile" />,
    );
    expect(screen.getByTestId('icon-tile')).toBeOnTheScreen();
  });

  it('renders with accessibilityLabel', () => {
    render(
      <IconTile icon={<Text>X</Text>} bg="#6366F1" testID="icon-tile" accessibilityLabel="Star icon" />,
    );
    expect(screen.getByTestId('icon-tile').props.accessibilityLabel).toBe('Star icon');
  });

  it('applies custom size and radius', () => {
    render(
      <IconTile icon={<Text>X</Text>} bg="#FF0000" size={56} radius={16} testID="icon-tile" />,
    );
    const el = screen.getByTestId('icon-tile');
    expect(el.props.style.width).toBe(56);
    expect(el.props.style.borderRadius).toBe(16);
  });
});
