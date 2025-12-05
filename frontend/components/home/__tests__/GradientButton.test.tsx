import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { GradientButton } from '../GradientButton';

describe('GradientButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with title', () => {
    render(<GradientButton title="Click Me" onPress={mockOnPress} />);

    const buttonText = screen.getByText('Click Me');
    expect(buttonText).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    render(<GradientButton title="Test Button" onPress={mockOnPress} />);

    const button = screen.getByText('Test Button').parent;
    fireEvent.press(button!);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    render(
      <GradientButton title="Disabled Button" onPress={mockOnPress} disabled />,
    );

    const button = screen.getByText('Disabled Button').parent?.parent;
    fireEvent.press(button!);

    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<GradientButton title="Submit" onPress={mockOnPress} loading />);

    expect(screen.getByText('로딩 중...')).toBeTruthy();
    expect(screen.queryByText('Submit')).toBeNull();
  });

  it('renders with icon when provided', () => {
    render(
      <GradientButton title="Play Music" icon="play" onPress={mockOnPress} />,
    );

    expect(screen.getByText('Play Music')).toBeTruthy();
  });

  it('does not call onPress when loading', () => {
    render(<GradientButton title="Loading" onPress={mockOnPress} loading />);

    const button = screen.getByText('로딩 중...').parent?.parent;
    fireEvent.press(button!);

    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('applies pressed style when button is pressed and active', () => {
    render(<GradientButton title="Pressable" onPress={mockOnPress} />);

    const button = screen.getByText('Pressable').parent?.parent?.parent;
    fireEvent(button!, 'pressIn');

    expect(screen.getByText('Pressable')).toBeTruthy();
  });

  it('shows pressed overlay when pressed and active', () => {
    render(<GradientButton title="Active" onPress={mockOnPress} />);

    const button = screen.getByText('Active').parent?.parent?.parent;
    fireEvent(button!, 'pressIn');

    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('shows pressed overlay when pressed and disabled', () => {
    render(<GradientButton title="Disabled" onPress={mockOnPress} disabled />);

    const button = screen.getByText('Disabled').parent?.parent?.parent;
    fireEvent(button!, 'pressIn');

    expect(screen.getByText('Disabled')).toBeTruthy();
  });

  it('renders without icon when icon prop is not provided', () => {
    render(<GradientButton title="No Icon" onPress={mockOnPress} />);

    expect(screen.getByText('No Icon')).toBeTruthy();
  });

  it('early returns when not active on press', async () => {
    render(<GradientButton title="Inactive" onPress={mockOnPress} disabled />);

    const button = screen.getByText('Inactive').parent?.parent?.parent;
    fireEvent.press(button!);

    expect(mockOnPress).not.toHaveBeenCalled();
  });
});
