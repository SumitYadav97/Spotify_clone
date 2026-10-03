// app/(tabs)/index.tsx
import {
  ChevronDown,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FullMusicPlayer } from '../../components/FullPlayerModal';
import { Track, usePlayerStore } from '../../components/store';
import { supabase } from '../../constants/supabase';
import { searchWorldwideSongs } from '../Services/musicSearch';

export default function HomeScreen() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // 👈 Store se saare controls yahan extract kiye gaye hain
  const {
    currentTrack,
    isPlaying,
    position = 0,
    duration = 1,
    setTrack,
    togglePlay,
    nextTrack,
    previousTrack,
    seekBy,
  } = usePlayerStore();

  useEffect(() => {
    loadInitialSongs();
  }, []);

  async function loadInitialSongs() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('tracks')
        .select('*')
        .order('id', { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        setTracks(
          data.map((item: any) => ({
            id: String(item.id),
            title: item.title,
            artist: item.artist,
            artwork:
              item.artwork ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
            audioUrl: item.audio_url,
          }))
        );
      } else {
        const defaultHits = await searchWorldwideSongs('Arijit Singh');
        if (defaultHits.length > 0) {
          setTracks(defaultHits);
        }
      }
    } catch (err) {
      console.warn('Tracks fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Live progress line calculate karne ke liye
  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Trending Now</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#E50914" style={styles.loader} />
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isCurrent = currentTrack?.id === item.id;
            return (
              <TouchableOpacity
                style={[styles.songRow, isCurrent && styles.activeSongRow]}
                activeOpacity={0.7}
                onPress={() => setTrack(item, tracks)}
              >
                <Image source={{ uri: item.artwork }} style={styles.songArt} />
                <View style={styles.songInfo}>
                  <Text
                    style={[styles.songTitle, isCurrent && styles.activeTitle]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.songArtist} numberOfLines={1}>
                    {item.artist}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* --- AESTHETIC BOTTOM MINI PLAYER --- */}
      {currentTrack && (
        <TouchableOpacity
          style={styles.miniPlayer}
          activeOpacity={0.95}
          onPress={() => setModalVisible(true)}
        >
          {/* Live Progress Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>

          <View style={styles.miniContent}>
            <Image source={{ uri: currentTrack.artwork }} style={styles.miniArt} />
            <View style={styles.miniMeta}>
              <Text style={styles.miniTitle} numberOfLines={1}>
                {currentTrack.title}
              </Text>
              <Text style={styles.miniArtist} numberOfLines={1}>
                {currentTrack.artist}
              </Text>
            </View>

            {/* 10s Piche Rewind */}
            <TouchableOpacity
              style={styles.miniAction}
              onPress={(e) => {
                e.stopPropagation();
                seekBy(-10);
              }}
            >
              <RotateCcw size={18} color="#A0A0A0" />
            </TouchableOpacity>

            {/* Previous Track */}
            <TouchableOpacity
              style={styles.miniAction}
              onPress={(e) => {
                e.stopPropagation();
                previousTrack();
              }}
            >
              <SkipBack size={20} color="#FFFFFF" fill="#FFFFFF" />
            </TouchableOpacity>

            {/* Play / Pause Toggle */}
            <TouchableOpacity
              style={styles.miniAction}
              onPress={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
            >
              {isPlaying ? (
                <Pause size={22} color="#E50914" fill="#E50914" />
              ) : (
                <Play size={22} color="#FFFFFF" fill="#FFFFFF" />
              )}
            </TouchableOpacity>

            {/* Next Track */}
            <TouchableOpacity
              style={styles.miniAction}
              onPress={(e) => {
                e.stopPropagation();
                nextTrack();
              }}
            >
              <SkipForward size={20} color="#FFFFFF" fill="#FFFFFF" />
            </TouchableOpacity>

            {/* 10s Aage Fast Forward */}
            <TouchableOpacity
              style={styles.miniAction}
              onPress={(e) => {
                e.stopPropagation();
                seekBy(10);
              }}
            >
              <RotateCw size={18} color="#A0A0A0" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Full Player Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalRoot}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setModalVisible(false)}
          >
            <ChevronDown size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <FullMusicPlayer />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  loader: {
    marginTop: 40,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeSongRow: {
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
  },
  songArt: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: '#1c1c1e',
  },
  songInfo: {
    flex: 1,
    marginLeft: 12,
  },
  songTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  activeTitle: {
    color: '#E50914',
  },
  songArtist: {
    color: '#777777',
    fontSize: 13,
    marginTop: 2,
  },
  miniPlayer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: '#141414',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262626',
    overflow: 'hidden',
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E50914',
  },
  miniContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  miniArt: {
    width: 42,
    height: 42,
    borderRadius: 6,
    backgroundColor: '#1c1c1e',
  },
  miniMeta: {
    flex: 1,
    marginLeft: 10,
  },
  miniTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  miniArtist: {
    color: '#888888',
    fontSize: 11,
    marginTop: 2,
  },
  miniAction: {
    padding: 6,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  closeBtn: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});