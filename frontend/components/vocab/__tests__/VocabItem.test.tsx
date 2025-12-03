import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { VocabItem } from '../VocabItem';

// Mock
jest.mock('../ExampleAudioButton', () => {
  return function MockExampleAudioButton() {
    return null;
  };
});

// Mock
jest.mock('expo-audio', () => ({
  useAudioPlayer: jest.fn(),
  useAudioPlayerStatus: jest.fn(),
}));

describe('VocabItem', () => {
  const mockVocab = {
    id: 1,
    word: 'apple',
    example_sentence: 'I ate an apple.',
    example_sentence_url: 'https://example.com/audio.mp3',
    pos: 'n.',
    meaning: '사과',
  };

  const mockPlayer = {} as any;
  const mockStatus = {} as any;
  const mockSetActiveId = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders vocab word', () => {
    render(
      <VocabItem
        item={mockVocab}
        player={mockPlayer}
        status={mockStatus}
        activeId={null}
        setActiveId={mockSetActiveId}
      />,
    );

    expect(screen.getByText('apple')).toBeTruthy();
  });

  it('renders part of speech', () => {
    render(
      <VocabItem
        item={mockVocab}
        player={mockPlayer}
        status={mockStatus}
        activeId={null}
        setActiveId={mockSetActiveId}
      />,
    );

    expect(screen.getByText('n.')).toBeTruthy();
  });

  it('renders meaning', () => {
    render(
      <VocabItem
        item={mockVocab}
        player={mockPlayer}
        status={mockStatus}
        activeId={null}
        setActiveId={mockSetActiveId}
      />,
    );

    expect(screen.getByText('사과')).toBeTruthy();
  });

  it('renders example sentence', () => {
    render(
      <VocabItem
        item={mockVocab}
        player={mockPlayer}
        status={mockStatus}
        activeId={null}
        setActiveId={mockSetActiveId}
      />,
    );

    expect(screen.getByText('I ate an apple.')).toBeTruthy();
  });

  it('renders example sentence label', () => {
    render(
      <VocabItem
        item={mockVocab}
        player={mockPlayer}
        status={mockStatus}
        activeId={null}
        setActiveId={mockSetActiveId}
      />,
    );

    expect(screen.getByText('예문')).toBeTruthy();
  });

  it('shows delete button when onDelete is provided', () => {
    const { getByTestId } = render(
      <VocabItem
        item={mockVocab}
        player={mockPlayer}
        status={mockStatus}
        activeId={null}
        setActiveId={mockSetActiveId}
        onDelete={mockOnDelete}
      />,
    );

    expect(getByTestId('delete-button')).toBeTruthy();
  });

  it('does not show delete button when onDelete is not provided', () => {
    const { queryByTestId } = render(
      <VocabItem
        item={mockVocab}
        player={mockPlayer}
        status={mockStatus}
        activeId={null}
        setActiveId={mockSetActiveId}
      />,
    );

    expect(queryByTestId('delete-button')).toBeNull();
  });

  it('calls onDelete with correct id when delete button is pressed', () => {
    const { getByTestId } = render(
      <VocabItem
        item={mockVocab}
        player={mockPlayer}
        status={mockStatus}
        activeId={null}
        setActiveId={mockSetActiveId}
        onDelete={mockOnDelete}
      />,
    );

    fireEvent.press(getByTestId('delete-button'));

    expect(mockOnDelete).toHaveBeenCalledWith(mockVocab);
  });

  it('renders with different vocab data', () => {
    const differentVocab = {
      id: 2,
      word: 'banana',
      example_sentence: 'I like bananas.',
      example_sentence_url: 'https://example.com/banana.mp3',
      pos: 'n.',
      meaning: '바나나',
    };

    render(
      <VocabItem
        item={differentVocab}
        player={mockPlayer}
        status={mockStatus}
        activeId={null}
        setActiveId={mockSetActiveId}
      />,
    );

    expect(screen.getByText('banana')).toBeTruthy();
    expect(screen.getByText('바나나')).toBeTruthy();
    expect(screen.getByText('I like bananas.')).toBeTruthy();
  });

  it('renders with different parts of speech', () => {
    const verbVocab = {
      ...mockVocab,
      word: 'run',
      pos: 'v.',
      meaning: '달리다',
    };

    render(
      <VocabItem
        item={verbVocab}
        player={mockPlayer}
        status={mockStatus}
        activeId={null}
        setActiveId={mockSetActiveId}
      />,
    );

    expect(screen.getByText('v.')).toBeTruthy();
  });

  it('handles null player', () => {
    render(
      <VocabItem
        item={mockVocab}
        player={null}
        status={mockStatus}
        activeId={null}
        setActiveId={mockSetActiveId}
      />,
    );

    expect(screen.getByText('apple')).toBeTruthy();
  });

  it('handles active state when item id matches activeId', () => {
    render(
      <VocabItem
        item={mockVocab}
        player={mockPlayer}
        status={mockStatus}
        activeId={1}
        setActiveId={mockSetActiveId}
      />,
    );

    expect(screen.getByText('apple')).toBeTruthy();
  });
});
