import * as React from 'react';
import { Text } from 'react-native';

import { cleanup, render, screen, setup } from '@/lib/test-utils';

import { PressButton } from './press-button';

afterEach(cleanup);

describe('pressButton', () => {
  it('renders with testID', () => {
    render(
      <PressButton variant="primary" testID="press-btn">
        <Text>Tap me</Text>
      </PressButton>,
    );
    expect(screen.getByTestId('press-btn')).toBeOnTheScreen();
  });

  it('renders children', () => {
    render(
      <PressButton variant="primary" testID="press-btn">
        <Text>Hello</Text>
      </PressButton>,
    );
    expect(screen.getByText('Hello')).toBeOnTheScreen();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    const { user } = setup(
      <PressButton variant="primary" testID="press-btn" onPress={onPress}>
        <Text>Tap</Text>
      </PressButton>,
    );
    await user.press(screen.getByTestId('press-btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    const { user } = setup(
      <PressButton variant="primary" testID="press-btn" disabled onPress={onPress}>
        <Text>Tap</Text>
      </PressButton>,
    );
    await user.press(screen.getByTestId('press-btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('calls onPressIn and onPressOut callbacks', async () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    const { user } = setup(
      <PressButton variant="primary" testID="press-btn" onPressIn={onPressIn} onPressOut={onPressOut}>
        <Text>Tap</Text>
      </PressButton>,
    );
    await user.press(screen.getByTestId('press-btn'));
    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onPressOut).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <PressButton variant="primary" testID="press-btn" disabled>
        <Text>Tap</Text>
      </PressButton>,
    );
    expect(screen.getByTestId('press-btn')).toBeDisabled();
  });

  it('renders the gradient variant with a label', () => {
    render(
      <PressButton variant="gradient" testID="press-btn" label="Continue" />,
    );
    expect(screen.getByTestId('press-btn')).toBeOnTheScreen();
    expect(screen.getByText('Continue')).toBeOnTheScreen();
  });
});
