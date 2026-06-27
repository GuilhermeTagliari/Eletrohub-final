import React, { useEffect, useState } from 'react';
import { formatBRL } from '../utils/formatters';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useRatings } from '../context/RatingsContext';
import { useMyItems } from '../context/MyItemsContext';
import { productAPI, getFallbackImage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Stars from '../components/Stars';
import { getVerifiedLabel } from '../utils/verified';

function getSellerBadge(n) {
  if (n >= 30) return { label: 'Vendedor Elite', icon: 'shield-checkmark', color: '#f59e0b' };
  if (n >= 10) return { label: 'Top Vendedor', icon: 'trophy', color: '#ef4444' };
  if (n >= 3)  return { label: 'Experiente', icon: 'ribbon', color: '#2c7be5' };
  if (n >= 1)  return { label: 'Vendedor Ativo', icon: 'checkmark-circle', color: '#22c55e' };
  return null;
}

function localParaProduto(item) {
  const preco = Math.max(0, parseFloat(String(item.preco || 0).replace(/\./g, '').replace(',', '.')) || 0);
  return {
    id: `local-${item.id}`,
    description: item.nome,
    brand: item.categoria || 'Outros',
    fotos: item.fotos?.length > 0 ? item.fotos : [getFallbackImage(item.nome || '', item.categoria || '')].filter(Boolean),
    vendido: item.vendido || false,
    price: preco,
    convertedPrice: preco,
    isLocal: true,
    descricao: item.descricao || '',
    condicao: item.condicao || null,
  };
}

export default function SellerProfileScreen({ route, navigation }) {
  const { sellerKey, sellerName, isLocal, product } = route.params;
  const { colors } = useTheme();
  const { token } = useAuth();
  const { getSellerRatings, getSellerAverage } = useRatings();
  const { myItems } = useMyItems();
  const s = makeStyles(colors);

  const [activeItems, setActiveItems] = useState([]);
  const [soldItems, setSoldItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const sellerRatings = getSellerRatings(sellerKey);
  const avg = getSellerAverage(sellerKey);

  useEffect(() => {
    if (isLocal) {
      // Local seller = current user's items
      const all = myItems.map(localParaProduto);
      setActiveItems(all.filter(i => !i.vendido));
      setSoldItems(all.filter(i => i.vendido).slice(0, 5));
      setLoading(false);
    } else {
      productAPI.getAll(token).then(all => {
        const matched = all.filter(p => (p.brand || '') === sellerKey);
        setActiveItems(matched.slice(0, 8));
        setSoldItems([]);
        setLoading(false);
      }).catch(() => {
        setActiveItems([]);
        setLoading(false);
      });
    }
  }, [sellerKey, isLocal]);

  const badgeCount = isLocal
    ? myItems.filter(i => i.vendido).length
    : sellerRatings.length;
  const badge = getSellerBadge(badgeCount);
  const verified = getVerifiedLabel(sellerKey);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Perfil do vendedor</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Card de identidade */}
        <View style={s.identCard}>
          <View style={s.avatar}>
            <Ionicons name="person" size={32} color="#fff" />
          </View>
          <View style={s.identInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.sellerName}>{sellerName || 'Vendedor'}</Text>
              {verified && <Ionicons name="checkmark-circle" size={18} color={verified.color} />}
            </View>
            {verified && (
              <View style={[s.badge, { backgroundColor: verified.color + '18' }]}>
                <Ionicons name="shield-checkmark" size={11} color={verified.color} />
                <Text style={[s.badgeText, { color: verified.color }]}>{verified.label}</Text>
              </View>
            )}
            {badge && (
              <View style={[s.badge, { backgroundColor: badge.color + '22' }]}>
                <Ionicons name={badge.icon} size={12} color={badge.color} />
                <Text style={[s.badgeText, { color: badge.color }]}>{badge.label}</Text>
              </View>
            )}
            {avg > 0 ? (
              <View style={s.ratingRow}>
                <Stars rating={avg} size={13} color={colors.star} />
                <Text style={s.ratingText}>{avg.toFixed(1)} ({sellerRatings.length} avaliação{sellerRatings.length !== 1 ? 'ões' : ''})</Text>
              </View>
            ) : (
              <Text style={s.noRating}>Sem avaliações ainda</Text>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statNum}>{activeItems.length}</Text>
            <Text style={s.statLabel}>Anunciando</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statNum}>{soldItems.length}</Text>
            <Text style={s.statLabel}>Vendas</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statNum}>{sellerRatings.length}</Text>
            <Text style={s.statLabel}>Avaliações</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        ) : (
          <>
            {/* Anúncios ativos */}
            {activeItems.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Anunciando agora</Text>
                {activeItems.map(item => {
                  const price = item.convertedPrice ?? item.price ?? 0;
                  const foto = item.fotos?.[0] || null;
                  return (
                    <TouchableOpacity
                      key={String(item.id)}
                      style={s.itemRow}
                      onPress={() => navigation.navigate('ItemDetail', { product: item })}
                      activeOpacity={0.8}
                    >
                      <View style={[s.itemThumb, !foto && { backgroundColor: colors.primary }]}>
                        {foto
                          ? <Image source={{ uri: foto }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                          : <Ionicons name="storefront-outline" size={20} color="#fff" />}
                      </View>
                      <View style={s.itemInfo}>
                        <Text style={s.itemName} numberOfLines={1}>{item.description || item.nome}</Text>
                        {item.condicao && <Text style={s.itemCond}>{item.condicao}</Text>}
                        <Text style={s.itemPrice}>{price > 0 ? formatBRL(price) : 'A combinar'}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Últimas vendas */}
            {soldItems.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Últimas vendas</Text>
                {soldItems.map(item => {
                  const price = item.convertedPrice ?? item.price ?? 0;
                  return (
                    <View key={String(item.id)} style={[s.itemRow, { opacity: 0.6 }]}>
                      <View style={[s.itemThumb, { backgroundColor: colors.borderStrong }]}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      </View>
                      <View style={s.itemInfo}>
                        <Text style={s.itemName} numberOfLines={1}>{item.description || item.nome}</Text>
                        <Text style={[s.itemCond, { color: colors.success }]}>Vendido</Text>
                        <Text style={s.itemPrice}>{price > 0 ? formatBRL(price) : '—'}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {activeItems.length === 0 && soldItems.length === 0 && (
              <View style={s.empty}>
                <Ionicons name="storefront-outline" size={48} color={colors.borderStrong} />
                <Text style={s.emptyText}>Nenhum anúncio encontrado</Text>
              </View>
            )}

            {/* Avaliações */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Avaliações do vendedor</Text>
              {sellerRatings.length === 0 ? (
                <View style={s.noReviews}>
                  <Ionicons name="star-outline" size={28} color={colors.borderStrong} />
                  <Text style={s.noReviewsText}>Sem avaliações ainda</Text>
                </View>
              ) : (
                sellerRatings.slice(0, 5).map(r => (
                  <View key={r.id} style={s.reviewCard}>
                    <View style={s.reviewTop}>
                      <Text style={s.reviewUser}>{r.userName}</Text>
                      <Stars rating={r.stars} size={12} color={colors.star} />
                    </View>
                    {r.comment ? <Text style={s.reviewComment}>{r.comment}</Text> : null}
                    <Text style={s.reviewDate}>{r.date}</Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12,
      backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    identCard: {
      flexDirection: 'row', alignItems: 'center', gap: 16,
      margin: 16, backgroundColor: colors.surface,
      borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border,
    },
    avatar: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: colors.info, alignItems: 'center', justifyContent: 'center',
    },
    identInfo: { flex: 1, gap: 4 },
    sellerName: { fontSize: 18, fontWeight: '800', color: colors.text },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ratingText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
    noRating: { fontSize: 12, color: colors.textMuted },
    statsRow: {
      flexDirection: 'row', backgroundColor: colors.surface,
      marginHorizontal: 16, marginBottom: 8, borderRadius: 16,
      paddingVertical: 16, borderWidth: 1, borderColor: colors.border,
    },
    stat: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: 20, fontWeight: '800', color: colors.text },
    statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
    statDivider: { width: 1, backgroundColor: colors.border },
    section: { marginHorizontal: 16, marginTop: 16 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
    itemRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.surface, borderRadius: 12, padding: 12,
      marginBottom: 8, borderWidth: 1, borderColor: colors.border,
    },
    itemThumb: {
      width: 52, height: 52, borderRadius: 10,
      overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surfaceSecondary,
    },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: '600', color: colors.text },
    itemCond: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    itemPrice: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 3 },
    empty: { alignItems: 'center', gap: 10, paddingVertical: 40 },
    emptyText: { fontSize: 14, color: colors.textMuted },
    noReviews: {
      backgroundColor: colors.surface, borderRadius: 12, padding: 24,
      alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border,
    },
    noReviewsText: { fontSize: 14, color: colors.textMuted },
    reviewCard: {
      backgroundColor: colors.surface, borderRadius: 12, padding: 14,
      marginBottom: 8, borderWidth: 1, borderColor: colors.border,
    },
    reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    reviewUser: { fontSize: 13, fontWeight: '700', color: colors.text },
    reviewComment: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 6 },
    reviewDate: { fontSize: 11, color: colors.textMuted },
  });
}
