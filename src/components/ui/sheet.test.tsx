import * as React from 'react';
import { Text } from 'react-native';

import { cleanup, render, screen } from '@/lib/test-utils';

import { Sheet } from './sheet';

afterEach(cleanup);

describe('sheet', () => {
  it('renders children when open', () => {
    render(
      <Sheet open onClose={jest.fn()}>
        <Text>Sheet content</Text>
      </Sheet>,
    );
    expect(screen.getByText('Sheet content')).toBeOnTheScreen();
  });

  it('renders title when provided', () => {
    render(
      <Sheet open onClose={jest.fn()} title="Test Title">
        <Text>Content</Text>
      </Sheet>,
    );
    expect(screen.getByText('Test Title')).toBeOnTheScreen();
  });

  it('renders without title', () => {
    render(
      <Sheet open onClose={jest.fn()}>
        <Text>No title content</Text>
      </Sheet>,
    );
    expect(screen.queryByText('Test Title')).toBeNull();
    expect(screen.getByText('No title content')).toBeOnTheScreen();
  });

  it('applies testID', () => {
    render(
      <Sheet open onClose={jest.fn()} testID="test-sheet">
        <Text>Content</Text>
      </Sheet>,
    );
    expect(screen.getByTestId('test-sheet')).toBeOnTheScreen();
  });

  it('applies accessibilityLabel', () => {
    render(
      <Sheet open onClose={jest.fn()} accessibilityLabel="My Sheet" testID="sheet">
        <Text>Content</Text>
      </Sheet>,
    );
    expect(screen.getByTestId('sheet')).toBeOnTheScreen();
  });
});
