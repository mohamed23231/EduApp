import { View } from 'react-native';

import colors from '@/components/ui/colors';

type HairlineProps = {
  color?: string;
};

function Hairline({ color }: HairlineProps) {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: color ?? colors.neutral.rule,
      }}
    />
  );
}

export { Hairline };
export type { HairlineProps };
