import { Heart, Music, Pause, Play, Search as SearchIcon, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Track, usePlayerStore } from '../../components/store';
import { supabase } from '../../constants/supabase';

const GENRE_CARDS = [
  { id: '1', title: 'Pop', color: '#148A08' },
  { id: '2', title: 'Hip-Hop', color: '#BC5900' },
  { id: '3', title: 'Rock', color: '#E91429' },
  { id: '4', title: 'Dance', color: '#D84000' },
  { id: '5', title: 'Bollywood', color: '#8D67AB' },
  { id: '6', title: 'Indie', color: '#608108' },
];

export default function SearchScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentTrack, isPlaying, setTrack, togglePlay } = usePlayerStore();

  useEffect(() => {
    const query = searchTerm.trim();

    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const debounceTimer = setTimeout(async () => {
      try {
        // 1. Search global music library (Audius open audio streaming network)
        const audiusRes = await fetch(
          `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(
            query
          )}&app_name=SPOTIFY_CLONE`
        );
        const audiusData = await audiusRes.json();

        if (audiusData?.data && audiusData.data.length > 0) {
          const formattedTracks: Track[] = audiusData.data.slice(0, 25).map((track: any) => ({
            id: String(track.id),
            title: track.title || 'Unknown Title',
            artist: track.user?.name || 'Unknown Artist',
            artwork:
              track.artwork?.['480x480'] ||
              track.artwork?.['150x150'] ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
            audioUrl: `https://discoveryprovider.audius.co/v1/tracks/${track.id}/stream?app_name=SPOTIFY_CLONE`,
          }));
          setResults(formattedTracks);
          setLoading(false);
          return;
        }

        // 2. Fallback to Supabase database if external API yields no results
        const { data: dbData } = await supabase
          .from('tracks')
          .select('*')
          .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
          .limit(20);

        if (dbData && dbData.length > 0) {
          setResults(
            dbData.map((item: any) => ({
              id: String(item.id),
              title: item.title,
              artist: item.artist,
              artwork: item.artwork,
              audioUrl: item.audio_url,
            }))
          );
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const hasSearch = searchTerm.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Search Input */}
      <View style={styles.header}>
        <Text style={styles.screenHeading}>Search</Text>

        <View style={styles.searchBox}>
          <SearchIcon size={20} color="#121212" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="What do you want to listen to?"
            placeholderTextColor="#535353"
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {hasSearch && (
            <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearBtn}>
              <X size={18} color="#121212" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <ActivityIndicator size="small" color="#1DB954" style={{ marginVertical: 12 }} />
      )}

      {/* FlatLists separated with constant keys to prevent numColumns crash */}
      {hasSearch ? (
        <FlatList
          key="search-results-list"
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={1}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Music size={44} color="#535353" />
                <Text style={styles.emptyTitle}>No songs found</Text>
                <Text style={styles.emptySubtitle}>
                  Check your spelling or try searching for another artist or track.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isCurrent = currentTrack?.id === item.id;
            return (
              <TouchableOpacity
                style={styles.trackCard}
                onPress={() => setTrack(item)}
                activeOpacity={0.7}
              >
                <Image source={{ uri: item.artwork }} style={styles.trackCover} />
                <View style={styles.trackMeta}>
                  <Text
                    style={[styles.trackTitle, isCurrent && styles.activeText]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>
                    {item.artist}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <FlatList
          key="genres-grid-view"
          data={GENRE_CARDS}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.genreList}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>Browse all</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.genreCard, { backgroundColor: item.color }]}
              onPress={() => setSearchTerm(item.title)}
              activeOpacity={0.85}
            >
              <Text style={styles.genreCardText}>{item.title}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Persistent Mini-Player Bar */}
      {currentTrack && (
        <View style={styles.playerBar}>
          <View style={styles.playerProgress}>
            <View style={styles.playerFill} />
          </View>
          <View style={styles.playerContent}>
            <Image source={{ uri: currentTrack.artwork }} style={styles.playerArt} />
            <View style={styles.playerInfo}>
              <Text style={styles.playerSongTitle} numberOfLines={1}>
                {currentTrack.title}
              </Text>
              <Text style={styles.playerArtist} numberOfLines={1}>
                {currentTrack.artist}
              </Text>
            </View>
            <TouchableOpacity style={styles.playerAction}>
              <Heart size={20} color="#1DB954" fill="#1DB954" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.playerAction} onPress={togglePlay}>
              {isPlaying ? (
                <Pause size={24} color="#FFFFFF" fill="#FFFFFF" />
              ) : (
                <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  screenHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#000000',
    fontSize: 15,
    fontWeight: '600',
  },
  clearBtn: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  trackCover: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: '#282828',
  },
  trackMeta: {
    flex: 1,
    marginLeft: 12,
  },
  trackTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  activeText: {
    color: '#1DB954',
  },
  trackArtist: {
    color: '#B3B3B3',
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  genreList: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  genreCard: {
    flex: 1,
    height: 96,
    borderRadius: 8,
    padding: 12,
    margin: 6,
  },
  genreCardText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#8E8E93',
    fontSize: 13,
    textAlign: 'center',
  },
  playerBar: {
    position: 'absolute',
    bottom: 50,
    left: 8,
    right: 8,
    backgroundColor: '#222222',
    borderRadius: 8,
    overflow: 'hidden',
  },
  playerProgress: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: '100%',
  },
  playerFill: {
    height: '100%',
    width: '35%',
    backgroundColor: '#1DB954',
  },
  playerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  playerArt: {
    width: 42,
    height: 42,
    borderRadius: 4,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  playerSongTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  playerArtist: {
    color: '#B3B3B3',
    fontSize: 11,
    marginTop: 2,
  },
  playerAction: {
    paddingHorizontal: 8,
  },
});