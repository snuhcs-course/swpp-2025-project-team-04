import type { ElementRef } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Text,
  useWindowDimensions,
  View,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lyric, type LrcLine } from 'react-native-lyric';

// A simple button component for reuse
const Button = ({
  title,
  onPress,
  style,
}: {
  title: string;
  onPress: () => void;
  style?: object;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
      },
      style,
    ]}
    activeOpacity={0.8}
  >
    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
      {title}
    </Text>
  </TouchableOpacity>
);

// Sample LRC data
const LRC_SAMPLE = [
  '[ar:Neon Echo]',
  '[ti:Midnight Run]',
  '[00:00.00]test line 1',
  '[00:02.00]test line 2',
  '[00:04.00]test line 3',
  '[00:06.00]test line 4',
  '[00:08.00]test line 5',
  '[00:10.00]test line 6',
  '[00:12.00]test line 7',
  '[00:14.00]test line 8',
  '[00:16.00]test line 9',
  '[00:18.00]test line 10',
].join('\n');

// Total duration of the sample audio in milliseconds
const TOTAL_DURATION_MS = 49_000;

export default function LyricScreen() {
  const { height: windowHeight } = useWindowDimensions();
  // Calculate a suitable height for the lyric container
  const lyricContainerHeight = Math.min(windowHeight * 0.6, 450);

  const lyricRef = useRef<ElementRef<typeof Lyric>>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Effect to run the timer for lyric synchronization
  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    // Update the current time every 500ms
    const timer = setInterval(() => {
      setCurrentTime((previousTime) => {
        const nextTime = previousTime + 500;

        // Stop the timer when the song ends
        if (nextTime >= TOTAL_DURATION_MS) {
          clearInterval(timer);
          setIsPlaying(false);
          return TOTAL_DURATION_MS;
        }

        return nextTime;
      });
    }, 500);

    // Cleanup function to clear the interval
    return () => {
      clearInterval(timer);
    };
  }, [isPlaying]);

  // Toggles playback state or restarts if the song has ended
  const handleTogglePlayback = useCallback(() => {
    // If playback is finished and the user presses play again, restart from the beginning
    if (!isPlaying && currentTime >= TOTAL_DURATION_MS) {
      setCurrentTime(0);
      setIsPlaying(true);
    } else {
      // Otherwise, just toggle the play/pause state
      setIsPlaying((prev) => !prev);
    }
  }, [currentTime, isPlaying]);

  // Renders each line of the lyric, highlighting the active one
  const lineRenderer = useCallback(
    ({ lrcLine, active }: { lrcLine: LrcLine; active: boolean }) => (
      <Text
        style={{
          textAlign: 'center',
          color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
          fontSize: active ? 22 : 19,
          fontWeight: active ? '700' : '500',
          lineHeight: 30,
        }}
      >
        {lrcLine.content}
      </Text>
    ),
    [],
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0A1121' }}>
      <SafeAreaView style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        {/* Lyric Component Container */}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Lyric
            ref={lyricRef}
            lrc={LRC_SAMPLE}
            currentTime={currentTime}
            height={lyricContainerHeight}
            lineHeight={36}
            activeLineHeight={42}
            style={{
              paddingVertical: 32,
              paddingHorizontal: 12,
            }}
            showsVerticalScrollIndicator={false}
            autoScroll
            lineRenderer={lineRenderer}
          />
        </View>

        {/* Play/Pause Button */}
        <Button
          title={isPlaying ? 'Pause' : 'Play'}
          onPress={handleTogglePlayback}
          style={{
            backgroundColor: isPlaying ? '#C251FF' : '#4169E1',
            marginTop: 24,
          }}
        />
      </SafeAreaView>
    </View>
  );
}
