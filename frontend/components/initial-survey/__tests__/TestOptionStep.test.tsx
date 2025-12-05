import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import TestOptionStep from '../TestOptionStep';

describe('TestOptionStep', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and description', () => {
    render(<TestOptionStep onSelect={mockOnSelect} />);

    expect(screen.getByText(/듣기 테스트를/)).toBeTruthy();
    expect(screen.getByText(/진행할까요?/)).toBeTruthy();
    expect(screen.getByText('약 3분 소요 · 5 문항')).toBeTruthy();
  });

  it('renders both option buttons', () => {
    render(<TestOptionStep onSelect={mockOnSelect} />);

    expect(screen.getByText('테스트 진행하기')).toBeTruthy();
    expect(screen.getByText('건너뛰기')).toBeTruthy();
  });

  it('calls onSelect with false when "테스트 진행하기" is pressed', () => {
    render(<TestOptionStep onSelect={mockOnSelect} />);

    const testButton = screen.getByText('테스트 진행하기');
    fireEvent.press(testButton);

    expect(mockOnSelect).toHaveBeenCalledWith(false);
  });

  it('calls onSelect with true when "건너뛰기" is pressed', () => {
    render(<TestOptionStep onSelect={mockOnSelect} />);

    const skipButton = screen.getByText('건너뛰기');
    fireEvent.press(skipButton);

    expect(mockOnSelect).toHaveBeenCalledWith(true);
  });

  it('renders helper text', () => {
    render(<TestOptionStep onSelect={mockOnSelect} />);

    expect(screen.getByText('정확한 실력 측정')).toBeTruthy();
    expect(screen.getByText('바로 시작하기')).toBeTruthy();
  });

  it('allows selecting test option', () => {
    render(<TestOptionStep onSelect={mockOnSelect} />);

    const testButton = screen.getByText('테스트 진행하기');
    fireEvent.press(testButton);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('allows selecting skip option', () => {
    render(<TestOptionStep onSelect={mockOnSelect} />);

    const skipButton = screen.getByText('건너뛰기');
    fireEvent.press(skipButton);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('can change selection', () => {
    render(<TestOptionStep onSelect={mockOnSelect} />);

    const testButton = screen.getByText('테스트 진행하기');
    fireEvent.press(testButton);

    expect(mockOnSelect).toHaveBeenCalledWith(false);

    const skipButton = screen.getByText('건너뛰기');
    fireEvent.press(skipButton);

    expect(mockOnSelect).toHaveBeenCalledWith(true);
    expect(mockOnSelect).toHaveBeenCalledTimes(2);
  });
});
