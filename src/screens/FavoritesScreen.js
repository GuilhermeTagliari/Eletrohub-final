import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFavorites } from '../context/FavoritesContext';
import { useMyItems } from '../context/MyItemsContext';
import { useTheme } from '../context/ThemeContext';
import { onTabBarScroll, TAB_BAR_INSET } from '../utils/tabBarAnim';
import ProductCard from '../components/ProductCard';
import { getFallbackImage } from '../services/api';

export default function FavoritesScreen({ navigation }) {
  const { favorites } = useFavorites();
  const { myItems } = useMyItems();
  const { colors, isDark } = useTheme();
  const s = makeStyles(colors);

  const localIds = useMemo(() => new Set(myItems.map(i => `local-${i.id}`)), [myItems]);
  const displayFavorites = useMemo(
    () => favorites
      .filter(f => !f.isLocal || localIds.has(f.id))
      .map(f => {
        if (!f.fotos?.length && !f.foto) {
          const url = getFallbackImage(f.description || f.nome || '', f.categoria || '');
          if (url) return { ...f, fotos: [url] };
        }
        return f;
      }),
    [favorites, localIds]
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={s.header}>
        <Text style={s.title}>Favoritos</Text>
        {displayFavorites.length > 0 && (
          <Text style={s.count}>{displayFavorites.length} {displayFavorites.length === 1 ? 'item' : 'itens'}</Text>
        )}
      </View>

      {displayFavorites.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <Ionicons name="heart-outline" size={52} color={colors.textMuted} />
          </View>
          <Text style={s.emptyTitle}>Nenhum favorito ainda</Text>
          <Text style={s.emptyText}>Toque no ❤️ de qualquer produto para salvar aqui.</Text>
        </View>
      ) : (
        <FlatList
          data={displayFavorites}
          keyExtractor={item => String(item.id)}
          numColumns={2}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onScroll={e => onTabBarScroll(e.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ItemDetail', { product: item })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 16,
      backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    title: { fontSize: 22, fontWeight: '800', color: colors.text },
    count: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
    list: { padding: 16, paddingBottom: TAB_BAR_INSET + 8 },
    row: { justifyContent: 'space-between' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
    emptyIcon: {
      width: 88, height: 88, borderRadius: 44,
      backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  });
}
