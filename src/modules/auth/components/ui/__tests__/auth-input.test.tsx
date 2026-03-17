import * as React from 'react';
import { View } from 'react-native';

import { cleanup, fireEvent, render, screen, setup } from '@/lib/test-utils';

import { AuthInput } from '../auth-input';

afterEach(cleanup);

// In the jest-expo environment Pressable renders as a View with `accessible={true}`.
// Use UNSAFE_getAllByType(View) filtered by accessible prop to locate Pressable instances.
// Use fireEvent.press for direct element press (user.press requires host elements from screen queries).
function getAccessibleViews(view: ReturnType<typeof render>) {
  return view.UNSAFE_getAllByType(View).filter(v => v.props.accessible === true);
}

describe('authInput', () => {
  it('should render label text', () => {
    render(<AuthInput label="Email" />);
    expect(screen.getByText('Email')).toBeOnTheScreen();
  });

  it('should render placeholder via placeholder prop', () => {
    render(<AuthInput label="Email" placeholder="Enter your email" />);
    expect(screen.getByPlaceholderText('Enter your email')).toBeOnTheScreen();
  });

  it('should show error message when error prop is provided', () => {
    render(<AuthInput label="Email" error="Invalid email address" />);
    expect(screen.getByText('Invalid email address')).toBeOnTheScreen();
  });

  it('should NOT show error message when error prop is omitted', () => {
    render(<AuthInput label="Email" />);
    expect(screen.queryByText('Invalid email address')).toBeNull();
  });

  it('should NOT show eye icon pressable when isPassword is false', () => {
    const view = render(<AuthInput label="Username" isPassword={false} />);
    const accessibleViews = getAccessibleViews(view);
    expect(accessibleViews).toHaveLength(0);
  });

  it('should NOT show eye icon pressable when isPassword is omitted', () => {
    const view = render(<AuthInput label="Username" />);
    const accessibleViews = getAccessibleViews(view);
    expect(accessibleViews).toHaveLength(0);
  });

  it('should show eye icon toggle pressable when isPassword is true', () => {
    const view = render(
      <AuthInput label="Password" isPassword={true} placeholder="Enter password" />,
    );
    const accessibleViews = getAccessibleViews(view);
    expect(accessibleViews).toHaveLength(1);
    expect(accessibleViews[0].props.className).toContain('ps-3');
  });

  it('should start with secureTextEntry=true when isPassword is true', () => {
    render(<AuthInput label="Password" isPassword={true} placeholder="secret" />);
    const input = screen.getByPlaceholderText('secret');
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('should toggle secureTextEntry when eye icon pressable is pressed', () => {
    const view = render(<AuthInput label="Password" isPassword={true} placeholder="secret" />);
    // Initially secure
    expect(screen.getByPlaceholderText('secret').props.secureTextEntry).toBe(true);

    const eyeToggle = getAccessibleViews(view)[0];
    fireEvent.press(eyeToggle);
    // Now visible
    expect(screen.getByPlaceholderText('secret').props.secureTextEntry).toBe(false);

    // Press again to hide
    fireEvent.press(getAccessibleViews(view)[0]);
    expect(screen.getByPlaceholderText('secret').props.secureTextEntry).toBe(true);
  });

  it('should call onChangeText with typed text', async () => {
    const onChangeText = jest.fn();
    const { user } = setup(
      <AuthInput label="Email" placeholder="email" onChangeText={onChangeText} />,
    );
    const input = screen.getByPlaceholderText('email');
    await user.type(input, 'hello');
    expect(onChangeText).toHaveBeenCalled();
    expect(onChangeText).toHaveBeenCalledWith('hello');
  });
});
