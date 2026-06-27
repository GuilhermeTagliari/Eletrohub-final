import React, { useRef } from 'react';
import { formatBRL } from '../utils/formatters';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';
import { useTheme } from '../context/ThemeContext';
import { hapticLight } from '../utils/haptics';

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

const BRAND_COLORS = {
  Apple: '#1c1c1e',
  Samsung: '#1428A0',
  Motorola: '#003087',
  Xiaomi: '#FF6900',
  Google: '#4285F4',
  OnePlus: '#F5010C',
};

export default function ProductCard({ product, onPress }) {
  const { toggle, isFavorite } = useFavorites();
  const { colors } = useTheme();
  const heartScale = useRef(new Animated.Value(1)).current;

  const price = product.convertedPrice ?? product.price ?? 0;
  const label = product.description || product.name || 'Produto';
  const brand = product.brand || '';
  const bgColor = BRAND_COLORS[brand] || (product.isLocal ? '#2c4a7c' : '#1a1a2e');
  const liked = isFavorite(product.id);
  const foto = product.fotos?.[0] || null;

  function handleHeart() {
    toggle(product);
    hapticLight();
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.45, useNativeDriver: true, speed: 60, bounciness: 14 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 60, bounciness: 14 }),
    ]).start();
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.image, { backgroundColor: foto ? '#f0f0f0' : bgColor }]}>
        {foto ? (
          <Image source={{ uri: foto }} style={StyleSheet.absoluteFill} resizeMode="contain" />
        ) : (
          <Ionicons name="storefront-outline" size={36} color="rgba(255,255,255,0.7)" />
        )}
        <Animated.View style={[styles.heartBtn, { transform: [{ scale: heartScale }] }]}>
          <TouchableOpacity onPress={handleHeart} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={18}
              color={liked ? '#ff4757' : 'rgba(255,255,255,0.8)'}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
      <View style={styles.info}>
        <Text style={[styles.brand, { color: colors.textMuted }]} numberOfLines={1}>{brand}</Text>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>{label}</Text>
        <Text style={[styles.price, { color: colors.text }]}>
          {price > 0 ? formatBRL(price) : '—'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 14,
    padding: 5,
  },
  info: { padding: 12 },
  brand: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
    marginBottom: 4,
    lineHeight: 18,
  },
  price: { fontSize: 15, fontWeight: '800' },
});
