import * as React from 'react';
import { Text } from 'react-native';

import { cleanup, render, screen, setup } from '@/lib/test-utils';

import { TopBar } from './top-bar';

afterEach(cleanup);

describe('topBar', () => {
  it('renders title', () => {
    render(<TopBar title="Settings" />);
    expect(screen.getByText('Settings')).toBeOnTheScreen();
  });

  it('renders back button when onBack is provided', () => {
    const onBack = jest.fn();
    render(<TopBar title="Back" onBack={onBack} />);
    expect(screen.getByLabelText('Go back')).toBeOnTheScreen();
  });

  it('does not render back button when onBack is not provided', () => {
    render(<TopBar title="No Back" />);
    expect(screen.queryByLabelText('Go back')).toBeNull();
  });

  it('calls onBack when back button is pressed', async () => {
    const onBack = jest.fn();
    const { user } = setup(<TopBar title="Title" onBack={onBack} />);
    await user.press(screen.getByLabelText('Go back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders right slot', () => {
    render(
      <TopBar title="Title" right={<Text>Right action</Text>} />,
    );
    expect(screen.getByText('Right action')).toBeOnTheScreen();
  });

  it('applies testID', () => {
    render(<TopBar title="Title" testID="top-bar" />);
    expect(screen.getByTestId('top-bar')).toBeOnTheScreen();
  });

  it('renders without title', () => {
    render(<TopBar testID="top-bar" />);
    expect(screen.getByTestId('top-bar')).toBeOnTheScreen();
  });
});
