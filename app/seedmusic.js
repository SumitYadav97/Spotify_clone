// seed-music.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gebxaurqrqxmephfveev.supabase.co';
const SUPABASE_KEY = 'sb_publishable_bfo1AGX3ipRp9ZLhfKdmpA_zwKk4o00';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ARTISTS = [
  'Drake',
  'Travis Scott',
  'Kendrick Lamar',
  'The Weeknd',
  'Taylor Swift',
  'Dua Lipa',
  'Arijit Singh',
  'AP Dhillon',
  'Diljit Dosanjh',
  'Sidhu Moose Wala',
  'Bad Bunny',
  'BTS',
];

async function seedWorldwideSongs() {
  console.log('Fetching worldwide tracks from music catalog...');
  const allTracks = [];

  for (const artist of ARTISTS) {
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=4`
      );
      const data = await res.json();

      if (data.results) {
        for (const item of data.results) {
          if (item.previewUrl) {
            allTracks.push({
              title: item.trackName,
              artist: item.artistName,
              artwork: item.artworkUrl100
                ? item.artworkUrl100.replace('100x100bb', '600x600bb')
                : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
              audio_url: item.previewUrl,
            });
          }
        }
      }
    } catch (err) {
      console.error(`Error fetching songs for ${artist}:`, err.message);
    }
  }

  console.log(`Uploading ${allTracks.length} tracks to Supabase table...`);

  const { data, error } = await supabase.from('tracks').insert(allTracks);

  if (error) {
    console.error('Supabase upload error:', error.message);
  } else {
    console.log('Successfully inserted worldwide songs into Supabase!');
  }
}

seedWorldwideSongs();