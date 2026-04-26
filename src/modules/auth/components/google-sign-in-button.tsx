import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import colors from '@/components/ui/colors';

/**
 * GoogleSignInButton — dark-shell variant per `contracts/visual-auth.md`.
 * Sits on the dark `<AuthShell>` canvas; matches the rest of the auth dark
 * inputs (rgba(255,255,255,0.06) fill, hairline white border, 56h, r16).
 */

type GoogleSigninModule = {
  GoogleSignin: {
    hasPlayServices: () => Promise<unknown>;
    signIn: () => Promise<unknown>;
  };
};

function getGoogleSigninModule() {
  try {
    return require('@react-native-google-signin/google-signin') as GoogleSigninModule;
  }
  catch {
    throw new Error(
      'Google Sign-In native module is not available in this build. Rebuild and install the development client.',
    );
  }
}

export type GoogleSignInButtonProps = {
  onSuccess: (idToken: string) => void;
  onError?: (error: Error) => void;
  isLoading?: boolean;
  variant?: 'login' | 'signup';
};

export function GoogleSignInButton({
  onSuccess,
  onError,
  isLoading = false,
  variant = 'login',
}: GoogleSignInButtonProps) {
  const { t } = useTranslation();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      const { GoogleSignin } = getGoogleSigninModule();
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const signInPayload = userInfo as { idToken?: string; data?: { idToken?: string } };
      const idToken = signInPayload.data?.idToken ?? signInPayload.idToken;
      if (!idToken) {
        throw new Error('No ID token received from Google Sign-In');
      }
      onSuccess(idToken);
    }
    catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
    }
    finally {
      setIsSigningIn(false);
    }
  };

  const isProcessing = isLoading || isSigningIn;
  const buttonLabel = variant === 'login'
    ? t('auth.login.signInWithGoogle')
    : t('auth.signup.signUpWithGoogle');

  return (
    <Pressable
      onPress={handleGoogleSignIn}
      disabled={isProcessing}
      accessibilityRole="button"
      accessibilityState={{ disabled: isProcessing }}
      style={({ pressed }) => ({
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 16,
        backgroundColor: pressed
          ? 'rgba(255,255,255,0.10)'
          : 'rgba(255,255,255,0.06)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.12)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        opacity: isProcessing ? 0.6 : 1,
      })}
    >
      {isProcessing
        ? (
            <ActivityIndicator color={colors.neutral.dim} size="small" />
          )
        : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              <Text style={{ color: colors.neutral.white, fontSize: 18, fontWeight: '700' }}>G</Text>
              <Text
                style={{
                  color: colors.neutral.white,
                  fontSize: 15,
                  fontWeight: '600',
                }}
              >
                {buttonLabel}
              </Text>
            </View>
          )}
    </Pressable>
  );
}
