import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';

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

/**
 * Google Sign-In Button Component
 *
 * Initiates native Google Sign-In flow and returns ID token.
 * Supports both login and signup flows.
 *
 * Requirements: 10.1, 10.6, 10.7
 */
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

      // Check if Google Play Services are available (Android only)
      await GoogleSignin.hasPlayServices();

      // Initiate Google Sign-In flow
      const userInfo = await GoogleSignin.signIn();

      const signInPayload = userInfo as {
        idToken?: string;
        data?: { idToken?: string };
      };
      const idToken = signInPayload.data?.idToken ?? signInPayload.idToken;

      if (!idToken) {
        throw new Error('No ID token received from Google Sign-In');
      }

      // Call the success callback with the ID token
      onSuccess(idToken);
    }
    catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Google Sign-In error:', err);
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
      className={`h-[52px] flex-row items-center justify-center rounded-xl border border-gray-300 bg-white${isProcessing ? 'opacity-60' : ''}`}
      onPress={handleGoogleSignIn}
      disabled={isProcessing}
    >
      {isProcessing
        ? (
            <ActivityIndicator color="#1F2937" size="small" />
          )
        : (
            <View className="flex-row items-center justify-center gap-3">
              <Text className="text-xl">G</Text>
              <Text className="ms-3 text-base font-semibold text-gray-900">{buttonLabel}</Text>
            </View>
          )}
    </Pressable>
  );
}
