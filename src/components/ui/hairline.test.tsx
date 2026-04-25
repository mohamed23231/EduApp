import { cleanup, render, screen } from '@/lib/test-utils';

import { Hairline } from './hairline';

afterEach(cleanup);

describe('hairline', () => {
  it('renders without crashing', () => {
    render(<Hairline />);
    expect(screen.UNSAFE_queryAllByType(require('react-native').View).length).toBeGreaterThan(0);
  });

  it('renders with custom color', () => {
    render(<Hairline color="#FF0000" />);
    const views = screen.UNSAFE_queryAllByType(require('react-native').View);
    expect(views.length).toBeGreaterThan(0);
  });

  it('has height of 1', () => {
    render(<Hairline />);
    const views = screen.UNSAFE_queryAllByType(require('react-native').View);
    const hairline = views[0];
    expect(hairline.props.style.height).toBe(1);
  });

  it('uses neutral.rule as default background color', () => {
    render(<Hairline />);
    const views = screen.UNSAFE_queryAllByType(require('react-native').View);
    const hairline = views[0];
    expect(hairline.props.style.backgroundColor).toBe('#E6E3DB');
  });
});
