import React from 'react';
import {
  renderWithIntegrationProviders,
  waitFor,
  fireEvent,
} from './testUtils';
import { setupApiMocks } from './apiMocks';
import SignupScreen from '@/app/(auth)/signup';
import { useRouter } from 'expo-router';

jest.mock('@/api/client');

describe('Signup Integration Test', () => {
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

  it('successfully signs up and navigates to login', async () => {
    apiMocks.mockSignupSuccess();

    const { getByPlaceholderText, getByText } = renderWithIntegrationProviders(
      <SignupScreen />,
    );

    const nicknameInput = getByPlaceholderText('어떻게 불러드릴까요?');
    const usernameInput = getByPlaceholderText('아이디를 입력하세요');
    const passwordInput = getByPlaceholderText('3~30자 비밀번호를 입력하세요');
    const confirmPasswordInput = getByPlaceholderText(
      '비밀번호를 다시 입력하세요',
    );
    const signupButton = getByText('회원가입');

    fireEvent.changeText(nicknameInput, 'TestNick');
    fireEvent.changeText(usernameInput, 'newuser');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    fireEvent.press(signupButton);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    });
  });

  it('displays error when passwords do not match', () => {
    const { getByPlaceholderText, getByText, queryByText } =
      renderWithIntegrationProviders(<SignupScreen />);

    const nicknameInput = getByPlaceholderText('어떻게 불러드릴까요?');
    const usernameInput = getByPlaceholderText('아이디를 입력하세요');
    const passwordInput = getByPlaceholderText('3~30자 비밀번호를 입력하세요');
    const confirmPasswordInput = getByPlaceholderText(
      '비밀번호를 다시 입력하세요',
    );
    const signupButton = getByText('회원가입');

    fireEvent.changeText(nicknameInput, 'TestNick');
    fireEvent.changeText(usernameInput, 'newuser');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'different123');
    fireEvent.press(signupButton);

    expect(queryByText('비밀번호가 일치하지 않습니다.')).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('displays error when required fields are empty', () => {
    const { getByPlaceholderText, getByText } = renderWithIntegrationProviders(
      <SignupScreen />,
    );

    const nicknameInput = getByPlaceholderText('어떻게 불러드릴까요?');
    const usernameInput = getByPlaceholderText('아이디를 입력하세요');
    const passwordInput = getByPlaceholderText('3~30자 비밀번호를 입력하세요');
    const confirmPasswordInput = getByPlaceholderText(
      '비밀번호를 다시 입력하세요',
    );
    const signupButton = getByText('회원가입');

    fireEvent.changeText(nicknameInput, 'TestNick');
    fireEvent.changeText(usernameInput, '');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');

    fireEvent.press(signupButton);

    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('displays error when signup API fails', async () => {
    const errorMessage = 'Username already exists';
    apiMocks.mockSignupFailure(errorMessage);

    const { getByPlaceholderText, getByText, findByText } =
      renderWithIntegrationProviders(<SignupScreen />);

    const nicknameInput = getByPlaceholderText('어떻게 불러드릴까요?');
    const usernameInput = getByPlaceholderText('아이디를 입력하세요');
    const passwordInput = getByPlaceholderText('3~30자 비밀번호를 입력하세요');
    const confirmPasswordInput = getByPlaceholderText(
      '비밀번호를 다시 입력하세요',
    );
    const signupButton = getByText('회원가입');

    fireEvent.changeText(nicknameInput, 'TestNick');
    fireEvent.changeText(usernameInput, 'existinguser');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    fireEvent.press(signupButton);

    const errorElement = await findByText(errorMessage);
    expect(errorElement).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('navigates back to login when login link is pressed', () => {
    const { getByText } = renderWithIntegrationProviders(<SignupScreen />);

    const loginLink = getByText('로그인');
    fireEvent.press(loginLink);

    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('disables button when form is incomplete', () => {
    const { getByPlaceholderText, getByText } = renderWithIntegrationProviders(
      <SignupScreen />,
    );

    const nicknameInput = getByPlaceholderText('어떻게 불러드릴까요?');
    const usernameInput = getByPlaceholderText('아이디를 입력하세요');
    const passwordInput = getByPlaceholderText('3~30자 비밀번호를 입력하세요');
    const signupButton = getByText('회원가입');

    fireEvent.changeText(nicknameInput, 'TestNick');
    fireEvent.changeText(usernameInput, 'newuser');
    fireEvent.changeText(passwordInput, 'password123');

    fireEvent.press(signupButton);

    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
