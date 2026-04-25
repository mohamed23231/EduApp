import * as React from 'react';

import { cleanup, render, screen, setup } from '@/lib/test-utils';

import { ConfirmSheet } from './confirm-sheet';

afterEach(cleanup);

describe('confirmSheet', () => {
  it('renders title', () => {
    render(
      <ConfirmSheet
        open
        title="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByText('Are you sure?')).toBeOnTheScreen();
  });

  it('renders confirm and cancel buttons', () => {
    render(
      <ConfirmSheet
        open
        title="Delete?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByText('Confirm')).toBeOnTheScreen();
    expect(screen.getByText('Cancel')).toBeOnTheScreen();
  });

  it('renders custom button labels', () => {
    render(
      <ConfirmSheet
        open
        title="Delete?"
        confirmLabel="Delete"
        cancelLabel="Go back"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByText('Delete')).toBeOnTheScreen();
    expect(screen.getByText('Go back')).toBeOnTheScreen();
  });

  it('renders body text when provided', () => {
    render(
      <ConfirmSheet
        open
        title="Title"
        body="This is the body"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByText('This is the body')).toBeOnTheScreen();
  });

  it('calls onCancel when cancel button is pressed', async () => {
    const onCancel = jest.fn();
    const { user } = setup(
      <ConfirmSheet
        open
        title="Title"
        cancelLabel="Abort"
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />,
    );
    await user.press(screen.getByText('Abort'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button is pressed', async () => {
    const onConfirm = jest.fn();
    const { user } = setup(
      <ConfirmSheet
        open
        title="Title"
        confirmLabel="Yes"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />,
    );
    await user.press(screen.getByText('Yes'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
