import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import PlayerControls from '../PlayerControls';

describe('PlayerControls', () => {
  const mockOnTogglePlay = jest.fn();
  const mockOnFinish = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders play button when not playing', () => {
    render(
      <PlayerControls
        isPlaying={false}
        onTogglePlay={mockOnTogglePlay}
        onFinish={mockOnFinish}
      />,
    );

    const playButton = screen.getByLabelText('재생');
    expect(playButton).toBeTruthy();
  });

  it('renders pause button when playing', () => {
    render(
      <PlayerControls
        isPlaying={true}
        onTogglePlay={mockOnTogglePlay}
        onFinish={mockOnFinish}
      />,
    );

    const pauseButton = screen.getByLabelText('일시정지');
    expect(pauseButton).toBeTruthy();
  });

  it('calls onTogglePlay when play/pause button is pressed', () => {
    render(
      <PlayerControls
        isPlaying={false}
        onTogglePlay={mockOnTogglePlay}
        onFinish={mockOnFinish}
      />,
    );

    const playButton = screen.getByLabelText('재생');
    fireEvent.press(playButton);

    expect(mockOnTogglePlay).toHaveBeenCalledTimes(1);
  });

  it('calls onFinish when finish button is pressed', () => {
    render(
      <PlayerControls
        isPlaying={false}
        onTogglePlay={mockOnTogglePlay}
        onFinish={mockOnFinish}
      />,
    );

    const finishButton = screen.getByText('학습 종료');
    fireEvent.press(finishButton);

    expect(mockOnFinish).toHaveBeenCalledTimes(1);
  });

  it('renders finish button with correct text', () => {
    render(
      <PlayerControls
        isPlaying={false}
        onTogglePlay={mockOnTogglePlay}
        onFinish={mockOnFinish}
      />,
    );

    expect(screen.getByText('학습 종료')).toBeTruthy();
  });

  it('toggles between play and pause states', () => {
    const { rerender } = render(
      <PlayerControls
        isPlaying={false}
        onTogglePlay={mockOnTogglePlay}
        onFinish={mockOnFinish}
      />,
    );

    expect(screen.getByLabelText('재생')).toBeTruthy();

    rerender(
      <PlayerControls
        isPlaying={true}
        onTogglePlay={mockOnTogglePlay}
        onFinish={mockOnFinish}
      />,
    );

    expect(screen.getByLabelText('일시정지')).toBeTruthy();
  });

  it('has correct accessibility labels', () => {
    render(
      <PlayerControls
        isPlaying={false}
        onTogglePlay={mockOnTogglePlay}
        onFinish={mockOnFinish}
      />,
    );

    const playButton = screen.getByLabelText('재생');
    const finishButton = screen.getByLabelText('학습 종료');

    expect(playButton).toBeTruthy();
    expect(finishButton).toBeTruthy();
  });

  it('handles async onTogglePlay function', async () => {
    const asyncOnTogglePlay = jest.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    render(
      <PlayerControls
        isPlaying={false}
        onTogglePlay={asyncOnTogglePlay}
        onFinish={mockOnFinish}
      />,
    );

    const playButton = screen.getByLabelText('재생');
    fireEvent.press(playButton);

    expect(asyncOnTogglePlay).toHaveBeenCalledTimes(1);
  });

  it('handles async onFinish function', async () => {
    const asyncOnFinish = jest.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    render(
      <PlayerControls
        isPlaying={false}
        onTogglePlay={mockOnTogglePlay}
        onFinish={asyncOnFinish}
      />,
    );

    const finishButton = screen.getByText('학습 종료');
    fireEvent.press(finishButton);

    expect(asyncOnFinish).toHaveBeenCalledTimes(1);
  });
});
