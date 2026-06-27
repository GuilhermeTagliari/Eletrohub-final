import React, { useState } from 'react';
import { formatBRL } from '../utils/formatters';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Dimensions, Alert, Image,
} from 'react-native';
import SwipeableModal from '../components/SwipeableModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useMyItems } from '../context/MyItemsContext';
import { getFallbackImage } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { enviarNotificacao, agendarNotificacaoPromocao } from '../utils/notifications';

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;
const CONDICAO_COLORS = { Novo: '#22c55e', Seminovo: '#f59e0b', Usado: '#94a3b8' };
const DESCONTOS = [10, 15, 20, 30, 40, 50];
const DURACOES = [
  { label: '1 dia', dias: 1, icon: 'time-outline' },
  { label: '3 dias', dias: 3, icon: 'calendar-outline' },
  { label: '7 dias', dias: 7, icon: 'star-outline' },
];

function isPromocaoAtiva(item) {
  if (!item.emPromocao) return false;
  if (!item.promocaoExpira) return true;
  return new Date(item.promocaoExpira) > new Date();
}

function diasRestantes(expira) {
  if (!expira) return null;
  const diff = new Date(expira) - new Date();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function MyItemsScreen({ navigation }) {
  const { myItems, removeItem, marcarVendido, promoverItem, removerPromocao } = useMyItems();
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors);
  const [promoItem, setPromoItem] = useState(null);
  const [promoDesconto, setPromoDesconto] = useState(10);

  function handleRemover(id, name) {
    Alert.alert('Remover anúncio', `Deseja remover "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removeItem(id) },
    ]);
  }

  function handleToggleVendido(item) {
    if (item.vendido) {
      Alert.alert('Reativar anúncio', `Reativar "${item.nome}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reativar', onPress: () => marcarVendido(item.id) },
      ]);
    } else {
      Alert.alert('Marcar como vendido', `Marcar "${item.nome}" como vendido?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Vendido', onPress: () => marcarVendido(item.id) },
      ]);
    }
  }

  function handlePromover(dias) {
    if (!promoItem) return;
    const item = promoItem;
    promoverItem(item.id, promoDesconto, dias);
    setPromoItem(null);
    enviarNotificacao(
      '📣 Anúncio ativado!',
      `"${item.nome}" está em destaque por ${dias} dia${dias > 1 ? 's' : ''}.`,
    );
    agendarNotificacaoPromocao(item.nome, dias);
    Alert.alert('Anúncio ativado!', `"${item.nome}" aparecerá como destaque na tela inicial por ${dias} dia${dias > 1 ? 's' : ''}.`);
  }

  function handleCancelarPromocao(item) {
    Alert.alert('Cancelar promoção', `Remover "${item.nome}" dos anúncios em destaque?`, [
      { text: 'Manter', style: 'cancel' },
      { text: 'Cancelar promoção', style: 'destructive', onPress: () => removerPromocao(item.id) },
    ]);
  }

  function renderItem({ item }) {
    const fotoCapa = item.fotos?.[0] || item.foto || getFallbackImage(item.nome || '', item.categoria || '') || null;
    const condicaoCor = CONDICAO_COLORS[item.condicao] || '#94a3b8';
    const emPromo = isPromocaoAtiva(item);
    const dias = emPromo ? diasRestantes(item.promocaoExpira) : null;

    return (
      <TouchableOpacity
        style={[styles.card, item.vendido && styles.cardVendido]}
        onPress={() => navigation.navigate('AddItem', { item })}
        activeOpacity={0.85}
      >
        <View style={styles.cardImage}>
          {fotoCapa ? (
            <Image source={{ uri: fotoCapa }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Ionicons name="storefront-outline" size={32} color="rgba(255,255,255,0.6)" />
          )}
          {item.vendido && (
            <View style={styles.vendidoOverlay}>
              <Text style={styles.vendidoText}>VENDIDO</Text>
            </View>
          )}
          {emPromo && (
            <View style={styles.promoBanner}>
              <Ionicons name="megaphone" size={9} color="#fff" />
              <Text style={styles.promoBannerText}>
                ANÚNCIO{dias !== null ? ` · ${dias}d` : ''}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.tagRow}>
            <Text style={styles.catTag}>{item.categoria || 'Produto'}</Text>
            {item.condicao && (
              <View style={[styles.condicaoBadge, { backgroundColor: condicaoCor + '22' }]}>
                <Text style={[styles.condicaoText, { color: condicaoCor }]}>{item.condicao}</Text>
              </View>
            )}
          </View>
          <Text style={styles.itemName} numberOfLines={2}>{item.nome}</Text>
          <Text style={styles.itemPrice}>
            {formatBRL(parseFloat(String(item.preco || 0).replace(',', '.')) || 0)}
          </Text>
          {(item.cidade || item.estado) && (
            <View style={styles.locRow}>
              <Ionicons name="location-outline" size={11} color={colors.textMuted} />
              <Text style={styles.locText}>{[item.cidade, item.estado].filter(Boolean).join(' - ')}</Text>
            </View>
          )}
          <View style={styles.soldRow}>
            <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
            <Text style={styles.soldText}>{item.sold || 0} vendidos</Text>
          </View>
        </View>

        {/* Ações */}
        <View style={styles.cardActions}>
          {emPromo ? (
            <TouchableOpacity style={styles.promoActiveBtn} onPress={() => handleCancelarPromocao(item)}>
              <Ionicons name="megaphone" size={12} color="#fff" />
              <Text style={styles.promoActiveBtnText}>Anunciando</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.promoBtn]}
              onPress={() => setPromoItem(item)}
            >
              <Ionicons name="megaphone-outline" size={13} color="#f59e0b" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, item.vendido && styles.actionBtnActive]}
            onPress={() => handleToggleVendido(item)}
          >
            <Ionicons
              name={item.vendido ? 'refresh-outline' : 'checkmark-done-outline'}
              size={14}
              color={item.vendido ? '#fff' : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleRemover(item.id, item.nome)}
          >
            <Ionicons name="trash-outline" size={14} color="#ff4757" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Seus Itens</Text>
          <Text style={styles.subtitle}>{myItems.length} anúncio{myItems.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddItem')}>
          <Ionicons name="add" size={22} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      {myItems.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="storefront-outline" size={52} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Nenhum anúncio ainda</Text>
          <Text style={styles.emptyText}>Toque em + para cadastrar seu primeiro produto.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddItem')}>
            <Text style={styles.emptyBtnText}>Criar anúncio</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={myItems}
          keyExtractor={item => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
        />
      )}

      {/* Modal de promoção */}
      <SwipeableModal
        visible={!!promoItem}
        onClose={() => { setPromoItem(null); setPromoDesconto(10); }}
        style={{ backgroundColor: colors.surface }}
      >
        <View style={styles.promoContent}>
          <View style={styles.promoIconWrap}>
            <Ionicons name="megaphone-outline" size={32} color="#f59e0b" />
          </View>
          <Text style={styles.promoTitle}>Promover Anúncio</Text>
          <Text style={styles.promoSub}>
            "{promoItem?.nome}" aparecerá em destaque na tela inicial com o badge ANÚNCIO.
          </Text>

          <Text style={styles.promoDuraLabel}>Desconto (%)</Text>
          <View style={styles.descontosRow}>
            {DESCONTOS.map(d => {
              const preco = parseFloat(String(promoItem?.preco || 0).replace(/\./g, '').replace(',', '.')) || 0;
              const precoDesc = preco * (1 - d / 100);
              const ativo = promoDesconto === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.descontoChip, ativo && styles.descontoChipActive]}
                  onPress={() => setPromoDesconto(d)}
                >
                  <Text style={[styles.descontoChipPct, ativo && styles.descontoChipTextActive]}>-{d}%</Text>
                  <Text style={[styles.descontoChipPreco, ativo && styles.descontoChipTextActive]}>{formatBRL(precoDesc)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.promoDuraLabel, { marginTop: 16 }]}>Duração:</Text>
          <View style={styles.duracaoRow}>
            {DURACOES.map(d => (
              <TouchableOpacity
                key={d.dias}
                style={styles.duracaoBtn}
                onPress={() => handlePromover(d.dias)}
                activeOpacity={0.8}
              >
                <Ionicons name={d.icon} size={22} color="#f59e0b" />
                <Text style={styles.duracaoLabel}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.promoCancelBtn} onPress={() => { setPromoItem(null); setPromoDesconto(10); }}>
            <Text style={styles.promoCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </SwipeableModal>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 14,
      backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    title: { fontSize: 22, fontWeight: '800', color: colors.text },
    subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    addBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    list: { padding: 16, paddingBottom: 24 },
    row: { justifyContent: 'space-between', marginBottom: 16 },
    card: {
      width: CARD_WIDTH, backgroundColor: colors.surface, borderRadius: 14,
      shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 }, elevation: 3, overflow: 'hidden',
    },
    cardVendido: { opacity: 0.75 },
    cardImage: {
      width: '100%', height: 110, backgroundColor: colors.surfaceSecondary,
      alignItems: 'center', justifyContent: 'center',
    },
    vendidoOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center', justifyContent: 'center',
    },
    vendidoText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
    promoBanner: {
      position: 'absolute', top: 8, left: 8,
      flexDirection: 'row', alignItems: 'center', gap: 3,
      backgroundColor: '#f59e0b', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
    },
    promoBannerText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
    cardInfo: { padding: 10, paddingBottom: 6 },
    tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' },
    catTag: { fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600' },
    condicaoBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
    condicaoText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
    itemName: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4, lineHeight: 17 },
    itemPrice: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 4 },
    locRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
    locText: { fontSize: 10, color: colors.textMuted },
    soldRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    soldText: { fontSize: 11, color: colors.textSecondary },
    cardActions: {
      flexDirection: 'row', justifyContent: 'flex-end', gap: 6,
      paddingHorizontal: 8, paddingBottom: 8,
    },
    actionBtn: { backgroundColor: colors.surfaceSecondary, borderRadius: 8, padding: 6 },
    actionBtnActive: { backgroundColor: '#22c55e' },
    promoBtn: { backgroundColor: '#fef3c722' },
    promoActiveBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: '#f59e0b', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, flex: 1,
    },
    promoActiveBtnText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    deleteBtn: { backgroundColor: '#ff475722', borderRadius: 8, padding: 6 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10 },
    emptyIcon: {
      width: 88, height: 88, borderRadius: 44,
      backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
    emptyBtn: {
      marginTop: 8, backgroundColor: colors.primary, paddingHorizontal: 28,
      paddingVertical: 13, borderRadius: 10,
    },
    emptyBtnText: { color: colors.primaryText, fontSize: 15, fontWeight: '700' },
    promoContent: { paddingHorizontal: 24, paddingBottom: 10, alignItems: 'center' },
    promoIconWrap: {
      width: 60, height: 60, borderRadius: 30,
      backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    promoTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
    promoSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
    promoDuraLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },
    descontosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4, alignSelf: 'stretch' },
    descontoChip: {
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14,
      borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surfaceSecondary,
      alignItems: 'center', minWidth: 80,
    },
    descontoChipActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
    descontoChipPct: { fontSize: 14, fontWeight: '800', color: colors.textSecondary },
    descontoChipPreco: { fontSize: 10, fontWeight: '600', color: colors.textMuted, marginTop: 2 },
    descontoChipTextActive: { color: '#fff' },
    duracaoRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    duracaoBtn: {
      flex: 1, backgroundColor: colors.surfaceSecondary, borderRadius: 14, paddingVertical: 16,
      alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#f59e0b22',
    },
    duracaoLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
    promoCancelBtn: {
      paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12,
      borderWidth: 1.5, borderColor: colors.border, alignSelf: 'stretch', alignItems: 'center',
    },
    promoCancelText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
  });
}
