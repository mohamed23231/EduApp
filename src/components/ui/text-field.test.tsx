import * as React from 'react';

import { cleanup, render, screen, setup } from '@/lib/test-utils';

import { TextField } from './text-field';

afterEach(cleanup);

describe('textField', () => {
  it('renders with label and value', () => {
    render(
      <TextField label="Email" value="test@example.com" onChange={jest.fn()} testID="tf" />,
    );
    expect(screen.getByTestId('tf-label')).toBeOnTheScreen();
    expect(screen.getByTestId('tf')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('test@example.com')).toBeOnTheScreen();
  });

  it('calls onChange on text input', async () => {
    const onChange = jest.fn();
    const { user } = setup(
      <TextField value="" onChange={onChange} testID="tf" />,
    );
    await user.type(screen.getByTestId('tf'), 'hello');
    expect(onChange).toHaveBeenCalled();
  });

  it('shows error message when error prop is set', () => {
    render(
      <TextField value="" onChange={jest.fn()} error="Required field" testID="tf" />,
    );
    expect(screen.getByText('Required field')).toBeOnTheScreen();
    expect(screen.getByTestId('tf-error')).toBeOnTheScreen();
  });
});
