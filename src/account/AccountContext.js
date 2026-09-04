import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { loadSkinChallengeProgress } from '../challenges/skinChallenges';
import { supabase } from '../services/supabaseClient';

WebBrowser.maybeCompleteAuthSession();

const AUTH_CALLBACK_PATH = 'auth/callback';
const AccountContext = createContext({
  session: null,
  user: null,
  loading: true,
  signingInProvider: null,
  signInWithApple: async () => null,
  signInWithGoogle: async () => null,
  signOut: async () => {},
});

function getAuthRedirectUrl() {
  return makeRedirectUri({
    scheme: 'autobingo',
    path: AUTH_CALLBACK_PATH,
  });
}

function getProviderLabel(provider) {
  return provider === 'apple' ? 'Apple' : 'Google';
}

function getAppleFullName(fullName) {
  return [
    fullName?.givenName,
    fullName?.middleName,
    fullName?.familyName,
  ].filter(Boolean).join(' ');
}

function isUserCancelledAppleSignIn(error) {
  return error?.code === 'ERR_REQUEST_CANCELED'
    || error?.code === 'ERR_CANCELED'
    || error?.message?.toLowerCase?.().includes('cancel');
}

async function createSessionFromUrl(url) {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode || params?.error) {
    throw new Error(params?.error_description ?? errorCode ?? params.error);
  }

  if (params?.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);

    if (error) {
      throw error;
    }

    return data?.session ?? null;
  }

  if (params?.access_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });

    if (error) {
      throw error;
    }

    return data?.session ?? null;
  }

  return null;
}

async function signInWithNativeApple() {
  const appleAvailable = await AppleAuthentication.isAvailableAsync();

  if (!appleAvailable) {
    return null;
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Apple login gaf geen identity token terug.');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      access_token: credential.authorizationCode,
    });

    if (error) {
      throw error;
    }

    const fullName = getAppleFullName(credential.fullName);

    if (fullName) {
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          given_name: credential.fullName?.givenName ?? null,
          family_name: credential.fullName?.familyName ?? null,
        },
      }).catch(() => {});
    }

    return data?.session ?? null;
  } catch (error) {
    if (isUserCancelledAppleSignIn(error)) {
      return null;
    }

    throw error;
  }
}

export function AccountProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingInProvider, setSigningInProvider] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      setSession(data?.session ?? null);
      setLoading(false);
    }

    void loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);

      if (nextSession?.user) {
        void loadSkinChallengeProgress();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithProvider = useCallback(async (provider) => {
    setSigningInProvider(provider);

    try {
      if (provider === 'apple' && Platform.OS === 'ios') {
        const nativeSession = await signInWithNativeApple();

        if (nativeSession?.user) {
          await loadSkinChallengeProgress();
        }

        return nativeSession;
      }

      const redirectTo = getAuthRedirectUrl();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.url) {
        throw new Error(`${getProviderLabel(provider)} login is nu niet beschikbaar.`);
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
        preferEphemeralSession: false,
        showInRecents: Platform.OS === 'android',
      });

      if (result.type !== 'success') {
        return null;
      }

      const nextSession = await createSessionFromUrl(result.url);

      if (nextSession?.user) {
        await loadSkinChallengeProgress();
      }

      return nextSession;
    } finally {
      setSigningInProvider(null);
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }, []);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    loading,
    signingInProvider,
    signInWithApple: () => signInWithProvider('apple'),
    signInWithGoogle: () => signInWithProvider('google'),
    signOut,
  }), [loading, session, signInWithProvider, signOut, signingInProvider]);

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}
