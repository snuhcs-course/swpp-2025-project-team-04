import TrackPlayer from 'react-native-track-player';
import { PlaybackService } from './app/PlaybackService';

TrackPlayer.registerPlaybackService(() => {
  return PlaybackService;
});

require('expo-router/entry-classic');
