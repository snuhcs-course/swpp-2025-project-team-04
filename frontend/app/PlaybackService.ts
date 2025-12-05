import TrackPlayer, { Event } from 'react-native-track-player';

export const PlaybackService = async () => {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
  });
  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
  });
  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    TrackPlayer.skipToNext().catch(() => {});
  });
  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    TrackPlayer.skipToPrevious().catch(() => {});
  });
  TrackPlayer.addEventListener(Event.RemoteSeek, (e) => {
    TrackPlayer.seekTo(e.position);
  });
};
