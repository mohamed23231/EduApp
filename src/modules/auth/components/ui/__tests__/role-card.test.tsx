import * as React from 'react';
import { View } from 'react-native';

import { cleanup, render, screen, setup } from '@/lib/test-utils';

import { ROLE_OPTIONS, RoleCards } from '../role-card';

// react-i18next is already mocked globally in jest-setup.ts
// t() returns the key as-is, so labelKey values are returned verbatim

afterEach(cleanup);

const allRoles = [ROLE_OPTIONS.TEACHER, ROLE_OPTIONS.PARENT, ROLE_OPTIONS.MANAGER];

// In the jest-expo environment Pressable renders as a View with `accessible={true}`.
// Filter to find card Pressable Views (they have border-related classes).
function getCardPressableViews(view: ReturnType<typeof render>) {
  return view
    .UNSAFE_getAllByType(View)
    .filter(v => v.props.accessible === true && v.props.className?.includes('rounded-xl'));
}

describe('roleCards', () => {
  it('should render all role option translated labels (key returned as label)', () => {
    render(<RoleCards roles={allRoles} selected={null} onSelect={jest.fn()} />);
    expect(screen.getByText('auth.signup.teacherLabel')).toBeOnTheScreen();
    expect(screen.getByText('auth.signup.parentLabel')).toBeOnTheScreen();
    expect(screen.getByText('auth.signup.managerLabel')).toBeOnTheScreen();
  });

  it('should call onSelect with TEACHER value when teacher card is pressed', async () => {
    const onSelect = jest.fn();
    const { user } = setup(
      <RoleCards roles={allRoles} selected={null} onSelect={onSelect} />,
    );
    await user.press(screen.getByText('auth.signup.teacherLabel'));
    expect(onSelect).toHaveBeenCalledWith('TEACHER');
  });

  it('should call onSelect with PARENT value when parent card is pressed', async () => {
    const onSelect = jest.fn();
    const { user } = setup(
      <RoleCards roles={allRoles} selected={null} onSelect={onSelect} />,
    );
    await user.press(screen.getByText('auth.signup.parentLabel'));
    expect(onSelect).toHaveBeenCalledWith('PARENT');
  });

  it('should call onSelect with MANAGER value when manager card is pressed', async () => {
    const onSelect = jest.fn();
    const { user } = setup(
      <RoleCards roles={allRoles} selected={null} onSelect={onSelect} />,
    );
    await user.press(screen.getByText('auth.signup.managerLabel'));
    expect(onSelect).toHaveBeenCalledWith('MANAGER');
  });

  it('should apply border-blue-500 class to selected card', () => {
    const view = render(
      <RoleCards roles={allRoles} selected="TEACHER" onSelect={jest.fn()} />,
    );
    const cards = getCardPressableViews(view);
    // TEACHER is the first card (index 0)
    expect(cards[0].props.className).toContain('border-blue-500');
  });

  it('should NOT apply border-blue-500 class to unselected cards', () => {
    const view = render(
      <RoleCards roles={allRoles} selected="TEACHER" onSelect={jest.fn()} />,
    );
    const cards = getCardPressableViews(view);
    // PARENT is the second card (index 1)
    expect(cards[1].props.className).not.toContain('border-blue-500');
    expect(cards[1].props.className).toContain('border-gray-200');
    // MANAGER is the third card (index 2)
    expect(cards[2].props.className).not.toContain('border-blue-500');
  });

  it('should apply border-gray-200 to all cards when nothing is selected', () => {
    const view = render(
      <RoleCards roles={allRoles} selected={null} onSelect={jest.fn()} />,
    );
    const cards = getCardPressableViews(view);
    expect(cards).toHaveLength(3);
    cards.forEach((card) => {
      expect(card.props.className).toContain('border-gray-200');
    });
  });

  it('should render overlineLabel when provided', () => {
    render(
      <RoleCards
        roles={allRoles}
        selected={null}
        onSelect={jest.fn()}
        overlineLabel="Select your role"
      />,
    );
    expect(screen.getByText('Select your role')).toBeOnTheScreen();
  });

  it('should NOT render overlineLabel when not provided', () => {
    render(<RoleCards roles={allRoles} selected={null} onSelect={jest.fn()} />);
    expect(screen.queryByText('Select your role')).toBeNull();
  });

  it('should render only the provided roles subset', () => {
    const twoRoles = [ROLE_OPTIONS.TEACHER, ROLE_OPTIONS.PARENT];
    render(<RoleCards roles={twoRoles} selected={null} onSelect={jest.fn()} />);
    expect(screen.getByText('auth.signup.teacherLabel')).toBeOnTheScreen();
    expect(screen.getByText('auth.signup.parentLabel')).toBeOnTheScreen();
    expect(screen.queryByText('auth.signup.managerLabel')).toBeNull();
  });
});
