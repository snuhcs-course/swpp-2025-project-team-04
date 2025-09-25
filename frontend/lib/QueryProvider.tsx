import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { ReactNode, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

function useAppStateRefocus() {
  useEffect(() => {
    const onAppStateChange = (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active');
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);
}

export function QueryProvider({ children }: { children: ReactNode }) {
  useAppStateRefocus();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
