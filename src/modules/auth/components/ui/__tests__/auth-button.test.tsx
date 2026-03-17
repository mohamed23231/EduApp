import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { cleanup, render, screen, setup } from '@/lib/test-utils';

import { AuthButton } from '../auth-button';

afterEach(cleanup);

// In the jest-expo environment Pressable renders as a View with `accessible={true}`.
// Use UNSAFE_getAllByType(View) + filter for className assertions.
// Use user.press(screen.getByText(...)) for press interaction tests (Text is a host element).
function getPressableView(view: ReturnType<typeof render>) {
  const views = view.UNSAFE_getAllByType(View);
  return views.find(v => v.props.accessible === true)!;
}

describe('authButton', () => {
  it('should render title text', () => {
    render(<AuthButton title="Sign In" onPress={jest.fn()} />);
    expect(screen.getByText('Sign In')).toBeOnTheScreen();
  });

  it('should call onPress when pressed', async () => {
    const onPress = jest.fn();
    const { user } = setup(<AuthButton title="Sign In" onPress={onPress} />);
    // Text is a host element — user.press propagates to the Pressable parent
    await user.press(screen.getByText('Sign In'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should show ActivityIndicator when loading is true', () => {
    const { UNSAFE_getAllByType } = render(
      <AuthButton title="Sign In" onPress={jest.fn()} loading={true} />,
    );
    const indicators = UNSAFE_getAllByType(ActivityIndicator);
    expect(indicators).toHaveLength(1);
  });

  it('should NOT show title text when loading is true', () => {
    render(<AuthButton title="Sign In" onPress={jest.fn()} loading={true} />);
    expect(screen.queryByText('Sign In')).toBeNull();
  });

  it('should NOT call onPress when disabled is true', async () => {
    const onPress = jest.fn();
    const { user } = setup(<AuthButton title="Sign In" onPress={onPress} disabled={true} />);
    // Text is a host element; Pressable parent is disabled so handler is not called
    await user.press(screen.getByText('Sign In'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should NOT call onPress when loading is true', async () => {
    const onPress = jest.fn();
    const { user, UNSAFE_getAllByType } = setup(
      <AuthButton title="Sign In" onPress={onPress} loading={true} />,
    );
    // No title text visible; press the ActivityIndicator's parent (the disabled Pressable View)
    const indicators = UNSAFE_getAllByType(ActivityIndicator);
    await user.press(indicators[0].parent);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should render with bg-gray-900 class for variant="black"', () => {
    const view = render(<AuthButton title="Sign In" onPress={jest.fn()} variant="black" />);
    const pressable = getPressableView(view);
    expect(pressable.props.className).toContain('bg-gray-900');
  });

  it('should render with bg-blue-500 class for variant="blue"', () => {
    const view = render(<AuthButton title="Sign In" onPress={jest.fn()} variant="blue" />);
    const pressable = getPressableView(view);
    expect(pressable.props.className).toContain('bg-blue-500');
  });

  it('should default to black variant when variant prop is omitted', () => {
    const view = render(<AuthButton title="Sign In" onPress={jest.fn()} />);
    const pressable = getPressableView(view);
    expect(pressable.props.className).toContain('bg-gray-900');
  });

  it('should render with bg-white class for variant="outlined"', () => {
    const view = render(<AuthButton title="Sign In" onPress={jest.fn()} variant="outlined" />);
    const pressable = getPressableView(view);
    expect(pressable.props.className).toContain('bg-white');
  });

  it('should apply opacity-50 class when disabled', () => {
    const view = render(<AuthButton title="Sign In" onPress={jest.fn()} disabled={true} />);
    const pressable = getPressableView(view);
    expect(pressable.props.className).toContain('opacity-50');
  });
});
