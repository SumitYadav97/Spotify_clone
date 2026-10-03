// app/(tabs)/_layout.tsx
import { Tabs, usePathname, useRouter } from 'expo-router';
import { Compass, Flame, Music2 } from 'lucide-react-native';
import { Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function CustomAestheticHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const isTabOne = pathname === '/' || pathname === '/index' || !pathname.includes('two');

  return (
    <SafeAreaView style={styles.safeHeader}>
      <View style={styles.headerContainer}>
        {/* Brand Logo & Name */}
        <View style={styles.brandRow}>
          <Music2 size={24} color="#E50914" />
          <Text style={styles.brandText}>
            MUSI<Text style={styles.brandAccent}>X</Text>
          </Text>
        </View>

        {/* Top Aesthetic Red & Black Navigation Switches */}
        <View style={styles.tabSwitchContainer}>
          <TouchableOpacity
            style={[styles.tabPill, isTabOne && styles.activePill]}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.8}
          >
            <Flame size={16} color={isTabOne ? '#FFFFFF' : '#888888'} />
            <Text style={[styles.pillText, isTabOne && styles.activePillText]}>
              Trending
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, !isTabOne && styles.activePill]}
            onPress={() => router.push('/(tabs)/two')}
            activeOpacity={0.8}
          >
            <Compass size={16} color={!isTabOne ? '#FFFFFF' : '#888888'} />
            <Text style={[styles.pillText, !isTabOne && styles.activePillText]}>
              Explore
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        header: () => <CustomAestheticHeader />, // 👈 Custom Red & Black Header
        headerShown: true,
        // Completely removes the bottom footer/tab bar
        tabBarStyle: {
          display: 'none',
          height: 0,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Trending' }} />
      <Tabs.Screen name="two" options={{ title: 'Explore' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  safeHeader: {
    backgroundColor: '#0a0a0a',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 9, 20, 0.25)', // Subtle crimson neon edge
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0a0a0a',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandAccent: {
    color: '#E50914', // Vibrant crimson red
  },
  tabSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: '#161616',
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
    borderColor: '#262626',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  activePill: {
    backgroundColor: '#E50914', // Solid Red Glow
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  pillText: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '700',
  },
  activePillText: {
    color: '#FFFFFF',
  },
});