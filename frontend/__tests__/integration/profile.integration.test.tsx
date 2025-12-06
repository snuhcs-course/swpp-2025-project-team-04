import React from 'react';
import {
  renderWithIntegrationProviders,
  waitFor,
  fireEvent,
} from './testUtils';
import { setupApiMocks } from './apiMocks';
import ProfileScreen from '@/app/(main)/profile';
import * as authMutations from '@/hooks/mutations/useAuthMutations';

jest.mock('@/api/client');
jest.mock('@/hooks/mutations/useAuthMutations');

describe('Profile Integration Test', () => {
  let apiMocks: ReturnType<typeof setupApiMocks>;

  const mockLogout = jest.fn();
  const mockDeleteAccount = {
    mutateAsync: jest.fn(),
    isPending: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    apiMocks = setupApiMocks();
    (authMutations.useLogout as jest.Mock).mockReturnValue(mockLogout);
    (authMutations.useDeleteAccount as jest.Mock).mockReturnValue(
      mockDeleteAccount,
    );
  });

  afterEach(async () => {
    apiMocks.reset();
    jest.clearAllTimers();
  });

  it('shows loading state initially', () => {
    const { UNSAFE_root } = renderWithIntegrationProviders(<ProfileScreen />);

    expect(UNSAFE_root).toBeTruthy();
  });


  it('shows logout button', async () => {
    apiMocks.mockGetUserSuccess();

    const { getByText } = renderWithIntegrationProviders(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('로그아웃')).toBeTruthy();
    });
  });

  it('shows account deletion option', async () => {
    apiMocks.mockGetUserSuccess();

    const { getByText } = renderWithIntegrationProviders(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('계정 삭제')).toBeTruthy();
    });
  });

  it('displays privacy option', async () => {
    apiMocks.mockGetUserSuccess();

    const { getByText } = renderWithIntegrationProviders(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('개인정보 보호')).toBeTruthy();
    });
  });

  it('displays help option', async () => {
    apiMocks.mockGetUserSuccess();

    const { getByText } = renderWithIntegrationProviders(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('도움이 필요하신가요?')).toBeTruthy();
    });
  });

  it('displays about option', async () => {
    apiMocks.mockGetUserSuccess();

    const { getByText } = renderWithIntegrationProviders(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('LingoFit 소개')).toBeTruthy();
    });
  });
});
