import * as React from 'react';
import { TextInput } from 'react-native';

import { cleanup, fireEvent, render } from '@/lib/test-utils';

import { OtpInput } from '../otp-input';

afterEach(cleanup);

describe('otpInput', () => {
  it('should render correct number of input boxes (default 6)', () => {
    const { UNSAFE_getAllByType } = render(<OtpInput value="" onChange={jest.fn()} />);
    const inputs = UNSAFE_getAllByType(TextInput);
    expect(inputs).toHaveLength(6);
  });

  it('should render 4 boxes when length={4}', () => {
    const { UNSAFE_getAllByType } = render(<OtpInput value="" onChange={jest.fn()} length={4} />);
    const inputs = UNSAFE_getAllByType(TextInput);
    expect(inputs).toHaveLength(4);
  });

  it('should render 8 boxes when length={8}', () => {
    const { UNSAFE_getAllByType } = render(<OtpInput value="" onChange={jest.fn()} length={8} />);
    const inputs = UNSAFE_getAllByType(TextInput);
    expect(inputs).toHaveLength(8);
  });

  it('should call onChange with updated value when digit entered in first box', () => {
    const onChange = jest.fn();
    const { UNSAFE_getAllByType } = render(<OtpInput value="" onChange={onChange} />);
    const inputs = UNSAFE_getAllByType(TextInput);
    fireEvent.changeText(inputs[0], '5');
    expect(onChange).toHaveBeenCalledWith('5');
  });

  it('should call onChange with updated value when digit entered in second box', () => {
    const onChange = jest.fn();
    const { UNSAFE_getAllByType } = render(<OtpInput value="5" onChange={onChange} />);
    const inputs = UNSAFE_getAllByType(TextInput);
    fireEvent.changeText(inputs[1], '3');
    expect(onChange).toHaveBeenCalledWith('53');
  });

  it('should strip non-numeric characters from input', () => {
    const onChange = jest.fn();
    const { UNSAFE_getAllByType } = render(<OtpInput value="" onChange={onChange} />);
    const inputs = UNSAFE_getAllByType(TextInput);
    fireEvent.changeText(inputs[0], 'a');
    // Non-digit is sanitized — onChange called with empty string result
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('should display current digits in the input boxes', () => {
    const { UNSAFE_getAllByType } = render(<OtpInput value="123" onChange={jest.fn()} />);
    const inputs = UNSAFE_getAllByType(TextInput);
    expect(inputs[0].props.value).toBe('1');
    expect(inputs[1].props.value).toBe('2');
    expect(inputs[2].props.value).toBe('3');
    // Remaining boxes are empty
    expect(inputs[3].props.value).toBe('');
    expect(inputs[4].props.value).toBe('');
    expect(inputs[5].props.value).toBe('');
  });

  it('should call onChange when backspace is pressed on an empty box with previous content', () => {
    const onChange = jest.fn();
    const { UNSAFE_getAllByType } = render(<OtpInput value="1" onChange={onChange} />);
    const inputs = UNSAFE_getAllByType(TextInput);
    // Simulate backspace on index 1 (empty) — should clear index 0
    fireEvent(inputs[1], 'keyPress', { nativeEvent: { key: 'Backspace' } });
    expect(onChange).toHaveBeenCalledWith('');
  });
});
