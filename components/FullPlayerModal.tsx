// components/FullMusicPlayer.tsx
import Slider from '@react-native-community/slider';
import {
    Pause,
    Play,
    RotateCcw,
    RotateCw,
    SkipBack,
    SkipForward,
} from 'lucide-react-native';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePlayerStore } from './store'; // Correct relative import

export function FullMusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    position = 0,
    duration = 1,
    togglePlay,
    nextTrack,
    previousTrack,
    seekBy,
    seekTo,
  } = usePlayerStore();

  if (!currentTrack) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyText}>No track selected</Text>
      </View>
    );
  }

  // Format Milliseconds to MM:SS
  const formatTime = (millis: number) => {
    if (!millis || isNaN(millis)) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const safeDuration = duration > 0 ? duration : 1;
  const safePosition = Math.min(Math.max(0, position), safeDuration);

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri:
            currentTrack.artwork ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
        }}
        style={styles.cover}
      />
      <Text style={styles.title} numberOfLines={1}>
        {currentTrack.title}
      </Text>
      <Text style={styles.artist} numberOfLines={1}>
        {currentTrack.artist}
      </Text>

      {/* Progress / Seek Bar */}
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={safeDuration}
        value={safePosition}
        minimumTrackTintColor="#E50914"
        maximumTrackTintColor="rgba(255,255,255,0.2)"
        thumbTintColor="#FFFFFF"
        onSlidingComplete={async (val) => {
          if (seekTo) await seekTo(val);
        }}
      />

      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(safePosition)}</Text>
        <Text style={styles.timeText}>{formatTime(safeDuration)}</Text>
      </View>

      {/* Player Controls Row */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          onPress={() => seekBy && seekBy(-10)}
          style={styles.smallBtn}
        >
          <RotateCcw size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={previousTrack} style={styles.iconBtn}>
          <SkipBack size={32} color="#FFFFFF" fill="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={togglePlay}
          style={styles.playBtn}
          activeOpacity={0.85}
        >
          {isPlaying ? (
            <Pause size={28} color="#000000" fill="#000000" />
          ) : (
            <Play size={28} color="#000000" fill="#000000" />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={nextTrack} style={styles.iconBtn}>
          <SkipForward size={32} color="#FFFFFF" fill="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => seekBy && seekBy(10)}
          style={styles.smallBtn}
        >
          <RotateCw size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default FullMusicPlayer;

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
  },
  emptyText: {
    color: '#777777',
    fontSize: 16,
  },
  cover: {
    width: 290,
    height: 290,
    borderRadius: 14,
    marginBottom: 24,
    backgroundColor: '#1c1c1e',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    width: '100%',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  artist: {
    color: '#8E8E93',
    fontSize: 15,
    marginTop: 6,
    marginBottom: 20,
    width: '100%',
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: -4,
    marginBottom: 16,
  },
  timeText: {
    color: '#8E8E93',
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '100%',
    marginTop: 10,
  },
  smallBtn: {
    padding: 8,
  },
  iconBtn: {
    padding: 8,
  },
  playBtn: {
    backgroundColor: '#E50914',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});