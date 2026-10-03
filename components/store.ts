// components/store.ts
import { Audio, AVPlaybackStatus } from 'expo-av';
import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  audioUrl: string;
}

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  position: number;
  duration: number;
  soundObj: Audio.Sound | null;
  isShuffle: boolean;
  loopMode: 'off' | 'all' | 'one';

  // Actions
  setTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
  togglePlay: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  seekTo: (millis: number) => Promise<void>;
  seekBy: (seconds: number) => Promise<void>;
  toggleShuffle: () => void;
  cycleLoopMode: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  position: 0,
  duration: 1,
  soundObj: null,
  isShuffle: false,
  loopMode: 'off',

  // 1. Play Specific Song
  setTrack: async (track: Track, newQueue?: Track[]) => {
    try {
      const { soundObj } = get();

      // Purana audio unload karo taaki memory leak na ho
      if (soundObj) {
        await soundObj.unloadAsync();
      }

      // Audio setup (Background play enable)
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Naya sound object banao
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.audioUrl },
        { shouldPlay: true },
        (status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;

          set({
            position: status.positionMillis || 0,
            duration: status.durationMillis || 1,
            isPlaying: status.isPlaying,
          });

          // Gaana khatam hone par agla song khud play karo
          if (status.didJustFinish && !status.isLooping) {
            const { loopMode, nextTrack, seekTo } = get();
            if (loopMode === 'one') {
              seekTo(0);
            } else {
              nextTrack();
            }
          }
        }
      );

      set({
        currentTrack: track,
        soundObj: sound,
        isPlaying: true,
        position: 0,
        queue: newQueue && newQueue.length > 0 ? newQueue : get().queue,
      });
    } catch (error) {
      console.error('Audio load error:', error);
    }
  },

  // 2. Play / Pause Toggle
  togglePlay: async () => {
    const { soundObj, isPlaying } = get();
    if (!soundObj) return;

    try {
      if (isPlaying) {
        await soundObj.pauseAsync();
        set({ isPlaying: false });
      } else {
        await soundObj.playAsync();
        set({ isPlaying: true });
      }
    } catch (err) {
      console.warn('Play/Pause error:', err);
    }
  },

  // 3. Next Track (Shuffle Support ke sath)
  nextTrack: async () => {
    const { queue, currentTrack, isShuffle, loopMode, setTrack } = get();
    if (!queue || queue.length === 0 || !currentTrack) return;

    let nextIndex = 0;
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);

    if (isShuffle) {
      // Random gaana pick karo jo current song na ho
      let randomIndex = Math.floor(Math.random() * queue.length);
      if (queue.length > 1 && randomIndex === currentIndex) {
        randomIndex = (randomIndex + 1) % queue.length;
      }
      nextIndex = randomIndex;
    } else {
      if (currentIndex < queue.length - 1) {
        nextIndex = currentIndex + 1;
      } else {
        // Last song ke baad loop check karo
        if (loopMode === 'all') {
          nextIndex = 0;
        } else {
          return; // Playlist khatam
        }
      }
    }

    const nextSong = queue[nextIndex];
    if (nextSong) {
      await setTrack(nextSong, queue);
    }
  },

  // 4. Previous Track
  previousTrack: async () => {
    const { queue, currentTrack, position, setTrack, seekTo } = get();
    if (!currentTrack) return;

    // Agar song 3 second se zyada chal chuka hai, toh restart kar do
    if (position > 3000) {
      await seekTo(0);
      return;
    }

    if (!queue || queue.length === 0) return;

    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    let prevIndex = currentIndex - 1;

    if (prevIndex < 0) {
      prevIndex = queue.length - 1; // Round back to end
    }

    const prevSong = queue[prevIndex];
    if (prevSong) {
      await setTrack(prevSong, queue);
    }
  },

  // 5. Seek To (Slider se aage piche drag karne ke liye)
  seekTo: async (millis: number) => {
    const { soundObj, duration } = get();
    if (!soundObj) return;

    const safeMillis = Math.max(0, Math.min(millis, duration));
    try {
      await soundObj.setPositionAsync(safeMillis);
      set({ position: safeMillis });
    } catch (err) {
      console.warn('Seek error:', err);
    }
  },

  // 6. Seek By (+10 seconds aage ya -10 seconds piche)
  seekBy: async (seconds: number) => {
    const { soundObj, position, duration } = get();
    if (!soundObj) return;

    const target = Math.max(0, Math.min(position + seconds * 1000, duration));
    try {
      await soundObj.setPositionAsync(target);
      set({ position: target });
    } catch (err) {
      console.warn('SeekBy error:', err);
    }
  },

  // 7. Shuffle On/Off Toggle
  toggleShuffle: () => {
    set((state) => ({ isShuffle: !state.isShuffle }));
  },

  // 8. Loop Mode Cycle (Off -> All -> One -> Off)
  cycleLoopMode: () => {
    const currentMode = get().loopMode;
    let nextMode: 'off' | 'all' | 'one' = 'off';

    if (currentMode === 'off') nextMode = 'all';
    else if (currentMode === 'all') nextMode = 'one';
    else nextMode = 'off';

    set({ loopMode: nextMode });
  },
}));