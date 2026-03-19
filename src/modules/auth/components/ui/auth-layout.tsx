import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AuthLayoutProps = PropsWithChildren<{
  testID?: string;
}>;

export function AuthLayout({ children, testID }: AuthLayoutProps) {
  return (
    <SafeAreaView style={layoutStyles.flex} className="bg-white" testID={testID}>
      <KeyboardAvoidingView
        style={layoutStyles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={layoutStyles.flex}
          contentContainerStyle={layoutStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const layoutStyles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 8 },
});
