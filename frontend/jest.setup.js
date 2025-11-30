jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  Redirect: jest.fn(),
  Link: jest.fn(),
  Stack: {
    Screen: jest.fn(),
  },
}));

jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: {
    setupPlayer: jest.fn(() => Promise.resolve()),
    registerPlaybackService: jest.fn(),
    add: jest.fn(() => Promise.resolve()),
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(() => Promise.resolve()),
    seekTo: jest.fn(() => Promise.resolve()),
    getPosition: jest.fn(() => Promise.resolve(0)),
    getDuration: jest.fn(() => Promise.resolve(0)),
    getState: jest.fn(() => Promise.resolve('paused')),
    updateOptions: jest.fn(() => Promise.resolve()),
  },
  usePlaybackState: jest.fn(() => ({ state: 'paused' })),
  useProgress: jest.fn(() => ({ position: 0, duration: 0 })),
  State: {
    Playing: 'playing',
    Paused: 'paused',
    Stopped: 'stopped',
  },
  Capability: {
    Play: 'play',
    Pause: 'pause',
    SeekTo: 'seekTo',
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
}));

jest.mock('@react-native-community/slider', () => {
  const mockReact = require('react');
  const mockRN = require('react-native');
  return {
    __esModule: true,
    default: (props) =>
      mockReact.createElement(mockRN.View, { testID: 'slider', ...props }),
  };
});

jest.mock(
  'expo-av',
  () => ({
    Audio: {
      Sound: {
        createAsync: jest.fn(() =>
          Promise.resolve({
            sound: {
              playAsync: jest.fn(),
              pauseAsync: jest.fn(),
              unloadAsync: jest.fn(),
            },
            status: {},
          }),
        ),
      },
      setAudioModeAsync: jest.fn(() => Promise.resolve()),
    },
  }),
  { virtual: true },
);

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock(
  'expo-audio',
  () => {
    const mockPlayer = {
      play: jest.fn(),
      pause: jest.fn(),
      seekTo: jest.fn(),
      replace: jest.fn(),
    };

    return {
      useAudioPlayer: jest.fn(() => mockPlayer),
      useAudioPlayerStatus: jest.fn(() => ({
        playing: false,
        currentTime: 0,
        duration: 0,
      })),
    };
  },
  { virtual: true },
);

jest.mock(
  'expo-file-system/legacy',
  () => ({
    downloadAsync: jest.fn(() =>
      Promise.resolve({
        uri: 'file://test.wav',
        status: 200,
        headers: {},
        md5: '',
      }),
    ),
    cacheDirectory: 'file://cache/',
  }),
  { virtual: true },
);

jest.mock('react-native-lyric', () => ({
  __esModule: true,
  default: 'LyricView',
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: jest.fn((callback) => {
    const cleanup = callback();
    if (cleanup) return cleanup;
  }),
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  })),
  useRoute: jest.fn(() => ({
    params: {},
  })),
}));

global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

process.env.EXPO_PUBLIC_API_URL = 'http://test-api.example.com';
