import React, { useMemo, useState, useEffect } from 'react';
import { formatBRL } from '../utils/formatters';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useMyItems } from '../context/MyItemsContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { productAPI, getFallbackImage } from '../services/api';
import { TAB_BAR_INSET } from '../utils/tabBarAnim';

function isPromocaoAtiva(item) {
  if (!item.emPromocao) return false;
  if (!item.promocaoExpira) return true;
  return new Date(item.promocaoExpira) > new Date();
}

export default function OffersScreen({ navigation }) {
  const { myItems } = useMyItems();
  const { colors, isDark } = useTheme();
  const { token } = useAuth();
  const s = makeStyles(colors);

  const [remoteProducts, setRemoteProducts] = useState([]);
  const [loadingRemote, setLoadingRemote] = useState(true);

  useEffect(() => {
    productAPI.getAll(token)
      .then(setRemoteProducts)
      .catch(() => setRemoteProducts([]))
      .finally(() => setLoadingRemote(false));
  }, []);

  // Itens locais em promoção
  const ofertasLocais = useMemo(() => {
    return myItems.filter(i => !i.vendido && isPromocaoAtiva(i)).map(item => {
      const preco = Math.max(0, parseFloat(String(item.preco || 0).replace(/\./g, '').replace(',', '.')) || 0);
      const precoPromo = item.desconto > 0
        ? Math.round(preco * (1 - item.desconto / 100) * 100) / 100
        : preco;
      return {
        id: `local-${item.id}`,
        description: item.nome,
        categoria: item.categoria,
        fotos: item.fotos?.length > 0 ? item.fotos : [getFallbackImage(item.nome || '', item.categoria || '')].filter(Boolean),
        price: precoPromo,
        precoOriginal: item.desconto > 0 ? preco : null,
        desconto: item.desconto || 0,
        isLocal: true,
        rawItem: item,
      };
    });
  }, [myItems]);

  // Produtos remotos (todos tratados como "destaque")
  const ofertasRemote = useMemo(() => {
    const localDescriptions = new Set(ofertasLocais.map(i => i.description));
    return remoteProducts
      .filter(p => p.convertedPrice > 0 && !localDescriptions.has(p.description))
      .map(p => ({
        id: String(p.id),
        description: p.description,
        brand: p.brand,
        categoria: p.categoria || p.brand || 'Eletrônico',
        fotos: p.fotos || [],
        price: p.convertedPrice,
        convertedPrice: p.convertedPrice,
        precoOriginal: null,
        desconto: 0,
        isLocal: false,
      }));
  }, [remoteProducts, ofertasLocais]);

  const allOfertas = useMemo(() => [...ofertasLocais, ...ofertasRemote], [ofertasLocais, ofertasRemote]);

  function renderItem({ item }) {
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => navigation.navigate('ItemDetail', {
          product: {
            id: item.id,
            description: item.description,
            brand: item.brand || item.categoria,
            categoria: item.categoria,
            fotos: item.fotos || [],
            price: item.price,
            convertedPrice: item.price,
            precoOriginal: item.precoOriginal,
            isLocal: item.isLocal,
          },
        })}
        activeOpacity={0.85}
      >
        <View style={s.imgPlaceholder}>
          {item.fotos && item.fotos[0] ? (
            <Image
              source={{ uri: item.fotos[0] }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <Ionicons
              name="storefront-outline"
              size={32}
              color="rgba(255,255,255,0.5)"
            />
          )}
          {item.desconto > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>-{item.desconto}%</Text>
            </View>
          )}
          {!item.isLocal && (
            <View style={s.featuredBadge}>
              <Text style={s.featuredBadgeText}>Destaque</Text>
            </View>
          )}
        </View>
        <View style={s.info}>
          <Text style={s.name} numberOfLines={2}>{item.description}</Text>
          <Text style={s.cat}>{item.categoria}</Text>
          {item.precoOriginal != null && (
            <Text style={s.precoOrig}>{formatBRL(item.precoOriginal)}</Text>
          )}
          <Text style={s.precoPromo}>{formatBRL(item.price)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Melhores Ofertas</Text>
        <View style={{ width: 36 }} />
      </View>

      {loadingRemote && allOfertas.length === 0 ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : allOfertas.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="pricetag-outline" size={56} color={colors.textMuted} />
          <Text style={s.emptyTitle}>Sem ofertas disponíveis</Text>
          <Text style={s.emptyText}>
            Coloque seus produtos em promoção em{'\n'}Meus Anúncios → Promover.
          </Text>
        </View>
      ) : (
        <FlatList
          data={allOfertas}
          keyExtractor={item => String(item.id)}
          numColumns={2}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
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
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: 18, fontWeight: '800', color: colors.text },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: 12, paddingBottom: TAB_BAR_INSET + 8 },
    row: { justifyContent: 'space-between' },
    card: {
      width: '48%', marginBottom: 14,
      backgroundColor: colors.surface, borderRadius: 16,
      overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
    },
    imgPlaceholder: {
      height: 130, backgroundColor: colors.surfaceSecondary,
      alignItems: 'center', justifyContent: 'center', position: 'relative',
    },
    badge: {
      position: 'absolute', top: 8, left: 8,
      backgroundColor: '#ff4757', borderRadius: 8,
      paddingHorizontal: 7, paddingVertical: 3,
    },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
    featuredBadge: {
      position: 'absolute', top: 8, right: 8,
      backgroundColor: colors.primary, borderRadius: 8,
      paddingHorizontal: 7, paddingVertical: 3,
    },
    featuredBadgeText: { color: colors.primaryText, fontSize: 10, fontWeight: '700' },
    info: { padding: 10 },
    name: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 2 },
    cat: { fontSize: 11, color: colors.textMuted, marginBottom: 6 },
    precoOrig: {
      fontSize: 12, color: colors.textMuted,
      textDecorationLine: 'line-through', marginBottom: 2,
    },
    precoPromo: { fontSize: 16, fontWeight: '800', color: '#ff4757' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  });
}
