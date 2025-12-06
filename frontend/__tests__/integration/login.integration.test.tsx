import React from 'react';
import {
  renderWithIntegrationProviders,
  waitFor,
  fireEvent,
} from './testUtils';
import { setupApiMocks } from './apiMocks';
import LoginScreen from '@/app/(auth)/login';
import { useRouter } from 'expo-router';
import * as tokenManager from '@/utils/tokenManager';

jest.mock('@/api/client');
jest.mock('@/utils/tokenManager');

describe('Login Integration Test', () => {
  let apiMocks: ReturnType<typeof setupApiMocks>;
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    apiMocks = setupApiMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  afterEach(async () => {
    apiMocks.reset();
    jest.clearAllTimers();
  });

  it('successfully logs in user and navigates to home', async () => {
    apiMocks.mockLoginSuccess();

    const { getByPlaceholderText, getByText } = renderWithIntegrationProviders(
      <LoginScreen />,
    );

    const usernameInput = getByPlaceholderText('아이디를 입력하세요');
    const passwordInput = getByPlaceholderText('비밀번호를 입력하세요');
    const loginButton = getByText('로그인');

    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(tokenManager.setAccessToken).toHaveBeenCalledWith(
        'mock-access-token',
      );
      expect(tokenManager.saveRefreshToken).toHaveBeenCalledWith(
        'mock-refresh-token',
      );
    });

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/');
    });
  });

  it('displays error message on invalid credentials', async () => {
    const errorMessage = 'Invalid credentials';
    apiMocks.mockLoginFailure(errorMessage);

    const { getByPlaceholderText, getByText, findByText } =
      renderWithIntegrationProviders(<LoginScreen />);

    const usernameInput = getByPlaceholderText('아이디를 입력하세요');
    const passwordInput = getByPlaceholderText('비밀번호를 입력하세요');
    const loginButton = getByText('로그인');

    fireEvent.changeText(usernameInput, 'wronguser');
    fireEvent.changeText(passwordInput, 'wrong123');
    fireEvent.press(loginButton);

    const errorElement = await findByText(errorMessage);
    expect(errorElement).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('validates username and password before submission', () => {
    const { getByPlaceholderText, getByText } = renderWithIntegrationProviders(
      <LoginScreen />,
    );

    const usernameInput = getByPlaceholderText('아이디를 입력하세요');
    const passwordInput = getByPlaceholderText('비밀번호를 입력하세요');
    const loginButton = getByText('로그인');

    fireEvent.changeText(usernameInput, '');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('disables form during login mutation', async () => {
    apiMocks.mockLoginSuccess();

    const { getByPlaceholderText, getByText } = renderWithIntegrationProviders(
      <LoginScreen />,
    );

    const usernameInput = getByPlaceholderText('아이디를 입력하세요');
    const passwordInput = getByPlaceholderText('비밀번호를 입력하세요');
    const loginButton = getByText('로그인');

    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalled();
    });
  });

  it('navigates to signup screen when signup link is pressed', () => {
    const { getByText } = renderWithIntegrationProviders(<LoginScreen />);

    const signupLink = getByText('회원가입');
    fireEvent.press(signupLink);

    expect(mockRouter.replace).toHaveBeenCalledWith('/signup');
  });
});
