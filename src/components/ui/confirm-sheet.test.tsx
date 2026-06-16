import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { ConfirmIntent } from './confirm-sheet';

import * as React from 'react';

import colors from '@/components/ui/colors';
import { cleanup, screen, setup } from '@/lib/test-utils';

import { ConfirmSheet } from './confirm-sheet';

afterEach(cleanup);

type HarnessProps = {
  intent?: ConfirmIntent;
  variant?: 'destructive' | 'default';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

/**
 * The ConfirmSheet content lives inside a @gorhom/bottom-sheet Modal, which only
 * mounts its children once presented via the ref. This harness owns the ref with
 * useRef and auto-presents on mount so tests see the rendered content.
 */
function Harness(props: HarnessProps) {
  const ref = React.useRef<BottomSheetModal>(null);
  React.useEffect(() => {
    ref.current?.present();
  }, []);
  return (
    <ConfirmSheet
      ref={ref}
      title="Delete student?"
      message="This cannot be undone."
      onConfirm={props.onConfirm ?? jest.fn()}
      onCancel={props.onCancel ?? jest.fn()}
      intent={props.intent}
      variant={props.variant}
      confirmLabel={props.confirmLabel}
      cancelLabel={props.cancelLabel}
    />
  );
}

async function present(ui: React.ReactElement) {
  const utils = setup(ui);
  expect(await screen.findByTestId('confirm-sheet-cancel')).toBeOnTheScreen();
  return utils;
}

function backgroundColorOf(testID: string): string | undefined {
  const node = screen.getByTestId(testID);
  const style = node.props.style as unknown;
  const flat = Array.isArray(style)
    ? Object.assign({}, ...(style as object[]).flat())
    : (style as Record<string, unknown>);
  return flat?.backgroundColor as string | undefined;
}

describe('confirmSheet — rendering & interaction', () => {
  it('renders title, message and labels once presented', async () => {
    await present(<Harness confirmLabel="Delete" cancelLabel="Keep" />);
    expect(screen.getByText('Delete student?')).toBeOnTheScreen();
    expect(screen.getByText('This cannot be undone.')).toBeOnTheScreen();
    expect(screen.getByText('Delete')).toBeOnTheScreen();
    expect(screen.getByText('Keep')).toBeOnTheScreen();
  });

  it('calls onConfirm when the confirm button is pressed', async () => {
    const onConfirm = jest.fn();
    const { user } = await present(<Harness onConfirm={onConfirm} />);
    await user.press(screen.getByTestId('confirm-sheet-confirm-routine'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the cancel button is pressed', async () => {
    const onCancel = jest.fn();
    const { user } = await present(<Harness onCancel={onCancel} />);
    await user.press(screen.getByTestId('confirm-sheet-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('confirmSheet — intent color law', () => {
  it('intent="routine" (default) paints the confirm button ink', async () => {
    await present(<Harness />);
    expect(backgroundColorOf('confirm-sheet-confirm-routine')).toBe(colors.neutral.ink);
  });

  it('intent="reversible" paints the confirm button amber', async () => {
    await present(<Harness intent="reversible" />);
    expect(backgroundColorOf('confirm-sheet-confirm-reversible')).toBe(colors.semantic.excused);
  });

  it('intent="destructive" paints the confirm button red', async () => {
    await present(<Harness intent="destructive" />);
    expect(backgroundColorOf('confirm-sheet-confirm-destructive')).toBe(colors.semantic.absent);
  });

  it('legacy variant="destructive" maps to the destructive (red) treatment', async () => {
    await present(<Harness variant="destructive" />);
    expect(backgroundColorOf('confirm-sheet-confirm-destructive')).toBe(colors.semantic.absent);
  });

  it('legacy variant="default" maps to the routine (ink) treatment', async () => {
    await present(<Harness variant="default" />);
    expect(backgroundColorOf('confirm-sheet-confirm-routine')).toBe(colors.neutral.ink);
  });

  it('intent wins over legacy variant when both are supplied', async () => {
    await present(<Harness intent="reversible" variant="destructive" />);
    expect(backgroundColorOf('confirm-sheet-confirm-reversible')).toBe(colors.semantic.excused);
  });
});
