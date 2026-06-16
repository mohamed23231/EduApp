/**
 * ErrorBoundary component
 * Catches and logs errors in teacher screens.
 * The class boundary renders only translated copy passed in via `copy`
 * and never surfaces the raw error message to the user.
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { logError } from '../services/logger';

type BoundaryCopy = {
  title: string;
  message: string;
  retry: string;
};

type ClassProps = {
  children: React.ReactNode;
  screenName?: string;
  copy: BoundaryCopy;
};

type State = {
  hasError: boolean;
};

class ErrorBoundaryClass extends React.Component<ClassProps, State> {
  constructor(props: ClassProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.error('[TeacherErrorBoundary] caught error', error);
    logError({
      screen: this.props.screenName || 'Unknown',
      action: 'componentDidCatch',
      message: error.message,
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <SafeAreaView edges={['top']} style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>{this.props.copy.title}</Text>
            <Text style={styles.message}>{this.props.copy.message}</Text>
            <Button
              label={this.props.copy.retry}
              onPress={this.handleReset}
              variant="default"
              style={styles.button}
            />
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

type Props = {
  children: React.ReactNode;
  screenName?: string;
};

export function ErrorBoundary({ children, screenName }: Props) {
  const { t } = useTranslation();
  const copy: BoundaryCopy = {
    title: t('teacher.common.errorTitle'),
    message: t('teacher.common.loadError'),
    retry: t('teacher.common.retry'),
  };
  return (
    <ErrorBoundaryClass screenName={screenName} copy={copy}>
      {children}
    </ErrorBoundaryClass>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.paper,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.neutral.ink,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.neutral.inkMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    minWidth: 120,
  },
});
