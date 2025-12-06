import TrackPlayer, { Event } from 'react-native-track-player';
import { PlaybackService } from '../PlaybackService';

jest.mock('react-native-track-player', () => ({
  addEventListener: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  skipToNext: jest.fn(),
  skipToPrevious: jest.fn(),
  seekTo: jest.fn(),
  Event: {
    RemotePlay: 'remote-play',
    RemotePause: 'remote-pause',
    RemoteNext: 'remote-next',
    RemotePrevious: 'remote-previous',
    RemoteSeek: 'remote-seek',
  },
}));

describe('PlaybackService', () => {
  let eventListeners: { [key: string]: Function } = {};

  beforeEach(() => {
    jest.clearAllMocks();
    eventListeners = {};

    (TrackPlayer.addEventListener as jest.Mock).mockImplementation(
      (event: string, handler: Function) => {
        eventListeners[event] = handler;
      },
    );
  });

  it('registers all remote control event listeners', async () => {
    await PlaybackService();

    expect(TrackPlayer.addEventListener).toHaveBeenCalledTimes(5);
    expect(TrackPlayer.addEventListener).toHaveBeenCalledWith(
      Event.RemotePlay,
      expect.any(Function),
    );
    expect(TrackPlayer.addEventListener).toHaveBeenCalledWith(
      Event.RemotePause,
      expect.any(Function),
    );
    expect(TrackPlayer.addEventListener).toHaveBeenCalledWith(
      Event.RemoteNext,
      expect.any(Function),
    );
    expect(TrackPlayer.addEventListener).toHaveBeenCalledWith(
      Event.RemotePrevious,
      expect.any(Function),
    );
    expect(TrackPlayer.addEventListener).toHaveBeenCalledWith(
      Event.RemoteSeek,
      expect.any(Function),
    );
  });

  it('handles RemotePlay event by calling TrackPlayer.play', async () => {
    await PlaybackService();

    eventListeners[Event.RemotePlay]();

    expect(TrackPlayer.play).toHaveBeenCalledTimes(1);
  });

  it('handles RemotePause event by calling TrackPlayer.pause', async () => {
    await PlaybackService();

    eventListeners[Event.RemotePause]();

    expect(TrackPlayer.pause).toHaveBeenCalledTimes(1);
  });

  it('handles RemoteNext event by calling TrackPlayer.skipToNext', async () => {
    (TrackPlayer.skipToNext as jest.Mock).mockResolvedValue(undefined);

    await PlaybackService();

    await eventListeners[Event.RemoteNext]();

    expect(TrackPlayer.skipToNext).toHaveBeenCalledTimes(1);
  });

  it('handles RemoteNext event error gracefully', async () => {
    const error = new Error('No next track');
    (TrackPlayer.skipToNext as jest.Mock).mockRejectedValue(error);

    await PlaybackService();

    await eventListeners[Event.RemoteNext]();

    expect(TrackPlayer.skipToNext).toHaveBeenCalledTimes(1);
  });

  it('handles RemotePrevious event by calling TrackPlayer.skipToPrevious', async () => {
    (TrackPlayer.skipToPrevious as jest.Mock).mockResolvedValue(undefined);

    await PlaybackService();

    await eventListeners[Event.RemotePrevious]();

    expect(TrackPlayer.skipToPrevious).toHaveBeenCalledTimes(1);
  });

  it('handles RemotePrevious event error gracefully', async () => {
    const error = new Error('No previous track');
    (TrackPlayer.skipToPrevious as jest.Mock).mockRejectedValue(error);

    await PlaybackService();

    await eventListeners[Event.RemotePrevious]();

    expect(TrackPlayer.skipToPrevious).toHaveBeenCalledTimes(1);
  });

  it('handles RemoteSeek event with position', async () => {
    await PlaybackService();

    eventListeners[Event.RemoteSeek]({ position: 30.5 });

    expect(TrackPlayer.seekTo).toHaveBeenCalledWith(30.5);
  });

  it('handles RemoteSeek with position 0', async () => {
    await PlaybackService();

    eventListeners[Event.RemoteSeek]({ position: 0 });

    expect(TrackPlayer.seekTo).toHaveBeenCalledWith(0);
  });

  it('handles RemoteSeek with large position', async () => {
    await PlaybackService();

    eventListeners[Event.RemoteSeek]({ position: 300.75 });

    expect(TrackPlayer.seekTo).toHaveBeenCalledWith(300.75);
  });

  it('registers event listeners in correct order', async () => {
    const callOrder: string[] = [];

    (TrackPlayer.addEventListener as jest.Mock).mockImplementation(
      (event: string) => {
        callOrder.push(event);
      },
    );

    await PlaybackService();

    expect(callOrder).toEqual([
      Event.RemotePlay,
      Event.RemotePause,
      Event.RemoteNext,
      Event.RemotePrevious,
      Event.RemoteSeek,
    ]);
  });
});
