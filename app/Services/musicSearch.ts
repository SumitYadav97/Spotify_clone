// app/Services/musicSearch.ts
import { Platform } from 'react-native';
import { Track } from '../../components/store';
import { supabase } from '../../constants/supabase';

export async function searchWorldwideSongs(query: string): Promise<Track[]> {
  const clean = query?.trim();
  if (!clean) return [];

  // JioSaavn mirror endpoint
  const targetUrl = `https://saavn.dev/api/search/songs?query=${encodeURIComponent(clean)}&limit=30`;

  // Use a CORS proxy on Web (localhost:8081) to bypass browser network blocking
  const fetchUrl =
    Platform.OS === 'web'
      ? `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
      : targetUrl;

  try {
    const res = await fetch(fetchUrl);
    const json = await res.json();

    // Account for all potential response formats from Saavn API
    const songList =
      json?.data?.results ||
      json?.data?.songs?.results ||
      (Array.isArray(json?.data) ? json.data : []);

    if (!Array.isArray(songList) || songList.length === 0) {
      return [];
    }

    return songList
      .map((song: any) => {
        // High quality artwork (500x500)
        const art =
          song.image?.[2]?.url ||
          song.image?.[1]?.url ||
          song.image?.[0]?.url ||
          (typeof song.image === 'string' ? song.image : null) ||
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500';

        // Select 320kbps / 160kbps audio link
        const downloadUrls = song.downloadUrl || [];
        const bestAudio =
          downloadUrls[downloadUrls.length - 1]?.url ||
          downloadUrls[0]?.url ||
          song.media_url ||
          '';

        const cleanTitle = song.name
          ? song.name
              .replace(/&quot;/g, '"')
              .replace(/&#039;/g, "'")
              .replace(/&amp;/g, '&')
          : 'Unknown Track';

        const artistName =
          song.artists?.primary?.map((a: any) => a.name).join(', ') ||
          song.album?.name ||
          'Artist';

        return {
          id: String(song.id || Math.random()),
          title: cleanTitle,
          artist: artistName,
          artwork: art,
          audioUrl: bestAudio,
        };
      })
      .filter((track: Track) => Boolean(track.audioUrl));
  } catch (error) {
    console.error('JioSaavn search error:', error);
    return [];
  }
}

export async function saveTrackToSupabase(item: Track) {
  try {
    await supabase.from('tracks').upsert(
      {
        id: item.id,
        title: item.title,
        artist: item.artist,
        artwork: item.artwork,
        audio_url: item.audioUrl,
      },
      { onConflict: 'id' }
    );
  } catch (err) {
  }
} 