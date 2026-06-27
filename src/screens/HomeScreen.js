import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatBRL } from '../utils/formatters';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  ActivityIndicator, TouchableOpacity, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productAPI, getFallbackImage } from '../services/api';
import { onTabBarScroll, TAB_BAR_INSET } from '../utils/tabBarAnim';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useMyItems } from '../context/MyItemsContext';
import { useFavorites } from '../context/FavoritesContext';
import { CATEGORIAS as CONFIG_CATEGORIAS } from '../config';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';

const CATEGORIAS_FILTRO = ['Todos', ...CONFIG_CATEGORIAS];

function localParaProduto(item) {
  const preco = Math.max(0, parseFloat(String(item.preco || 0).replace(/\./g, '').replace(',', '.')) || 0);
  const precoPromocional = item.emPromocao && item.desconto > 0
    ? Math.round(preco * (1 - item.desconto / 100) * 100) / 100
    : null;
  return {
    id: `local-${item.id}`,
    description: item.nome,
    brand: item.categoria || 'Outros',
    categoria: item.categoria || 'Outros',
    model: item.variacao || '',
    condicao: item.condicao || null,
    cidade: item.cidade || null,
    estado: item.estado || null,
    fotos: (item.fotos?.length > 0) ? item.fotos : (getFallbackImage(item.nome || '', item.categoria || '') ? [getFallbackImage(item.nome || '', item.categoria || '')] : []),
    vendido: item.vendido || false,
    emPromocao: item.emPromocao || false,
    desconto: item.desconto || 0,
    promocaoExpira: item.promocaoExpira || null,
    price: preco,
    convertedPrice: precoPromocional || preco,
    precoOriginal: precoPromocional ? preco : null,
    stock: 1,
    isLocal: true,
    descricao: item.descricao || '',
    cor: item.cor || '',
    frete: item.frete || '',
    freteTipo: item.freteTipo || 'proprio',
    freteCalculado: item.freteCalculado || 0,
    freteCodigo: item.freteCodigo || '',
  };
}

function isPromocaoAtiva(item) {
  if (!item.emPromocao) return false;
  if (!item.promocaoExpira) return true;
  return new Date(item.promocaoExpira) > new Date();
}

export default function HomeScreen({ navigation }) {
  const { token, user } = useAuth();
  const { colors, isDark } = useTheme();
  const { myItems } = useMyItems();
  const { favorites } = useFavorites();

  const [backendProdutos, setBackendProdutos] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem('@eletrohub:recentlyViewed').then(v => {
      if (v) setRecentlyViewed(JSON.parse(v));
    });
  }, []);

  const carregarProdutos = useCallback(async () => {
    try {
      const data = await productAPI.getAll(token);
      setBackendProdutos(data);
    } catch (_) {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { carregarProdutos(); }, [carregarProdutos]);

  const localIds = useMemo(() => new Set(myItems.map(i => `local-${i.id}`)), [myItems]);

  const todos = useMemo(() => {
    // Itens locais sem backendId (não publicados no backend) — evita duplicatas
    const locais = myItems.filter(i => !i.vendido && !i.backendId).map(localParaProduto);
    return [...locais, ...backendProdutos];
  }, [myItems, backendProdutos]);

  const BACKEND_DESCONTOS = {
    'iPhone 15 128GB':            12,
    'iPhone 15 Pro 256GB':        10,
    'Galaxy S24 256GB':           15,
    'Galaxy S24 Ultra 512GB':      8,
    'Galaxy A55 128GB':           20,
    'Moto G84 256GB':             18,
    'Redmi Note 13 Pro 256GB':    22,
    'Notebook Dell Inspiron 15':  10,
    'Notebook Acer Aspire 5':     12,
    'Smart TV Samsung 55" QLED':  14,
    'Smart TV LG 50" NanoCell':   16,
    'Geladeira Brastemp Frost Free 375L': 8,
    'Lavadora LG 12kg':           10,
    'Micro-ondas Electrolux 30L': 15,
    'Fogão Consul 5 Bocas':       12,
  };

  const emPromocao = useMemo(() => {
    const locais = myItems.filter(i => !i.vendido).map(localParaProduto).filter(p => isPromocaoAtiva(p));
    const remotos = backendProdutos
      .filter(p => BACKEND_DESCONTOS[p.description])
      .map(p => {
        const pct = BACKEND_DESCONTOS[p.description];
        const precoOrig = p.convertedPrice || p.price || 0;
        const precoPromo = Math.round(precoOrig * (1 - pct / 100) * 100) / 100;
        return { ...p, emPromocao: true, desconto: pct, precoOriginal: precoOrig, convertedPrice: precoPromo, price: precoPromo };
      });
    return [...locais, ...remotos];
  }, [myItems, backendProdutos]);

  const filtrados = useMemo(() => {
    if (categoriaSelecionada === 'Todos') return todos;
    return todos.filter(p =>
      p.categoria === categoriaSelecionada ||
      p.brand?.toLowerCase() === categoriaSelecionada.toLowerCase()
    );
  }, [todos, categoriaSelecionada]);

  const recomendados = useMemo(() => {
    if (favorites.length === 0) return [];
    const cats = [...new Set(favorites.map(f => f.categoria || f.brand).filter(Boolean))];
    return todos.filter(p =>
      !favorites.some(f => f.id === p.id) &&
      cats.some(c => p.categoria === c || p.brand === c)
    ).slice(0, 6);
  }, [favorites, todos]);

  const categoriasDisponiveis = useMemo(() => {
    const cats = [...new Set(todos.map(p => p.categoria).filter(Boolean))].sort();
    return ['Todos', ...cats];
  }, [todos]);

  useEffect(() => {
    if (categoriaSelecionada !== 'Todos' && !categoriasDisponiveis.includes(categoriaSelecionada)) {
      setCategoriaSelecionada('Todos');
    }
  }, [categoriasDisponiveis]);

  const primeiroNome = user?.name?.split(' ')[0] || 'usuário';
  const s = makeStyles(colors);

  function abrirProduto(product) {
    setRecentlyViewed(prev => {
      const sem = prev.filter(p => p.id !== product.id);
      const novo = [product, ...sem].slice(0, 10);
      AsyncStorage.setItem('@eletrohub:recentlyViewed', JSON.stringify(novo));
      return novo;
    });
    navigation.navigate('ItemDetail', { product });
  }

  const listHeader = (
    <>
      {/* Banner — rola junto com a lista */}
      <View style={s.banner}>
        <View style={s.bannerContent}>
          <Text style={s.bannerTag}>DESTAQUE</Text>
          <Text style={s.bannerTitle}>Melhores{'\n'}ofertas do dia</Text>
          <TouchableOpacity style={s.bannerBtn} onPress={() => navigation.navigate('Offers')}>
            <Text style={s.bannerBtnText}>Ver tudo</Text>
            <Ionicons name="arrow-forward" size={14} color="#1a1a1a" />
          </TouchableOpacity>
        </View>
        <View style={s.bannerDecor}>
          <Ionicons name="storefront-outline" size={88} color="rgba(255,255,255,0.15)" />
        </View>
      </View>

      {/* Filtros de categoria — rolam junto com a lista */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filtros}
        style={s.filtrosScroll}
        nestedScrollEnabled
      >
        {categoriasDisponiveis.map((cat) => {
          const ativo = categoriaSelecionada === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[s.filtroBtn, ativo && s.filtroBtnActive, { marginRight: 8 }]}
              onPress={() => setCategoriaSelecionada(cat)}
              activeOpacity={0.75}
            >
              <Text style={[s.filtroText, ativo && s.filtroTextActive]} numberOfLines={1}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ width: 20 }} />
      </ScrollView>

      {/* Contador */}
      {!loading && (
        <View style={s.countRow}>
          <Text style={s.countText}>{filtrados.length} produto{filtrados.length !== 1 ? 's' : ''}</Text>
        </View>
      )}

      {/* Promoções ativas */}
      {categoriaSelecionada === 'Todos' && emPromocao.length > 0 && (
                <View style={s.sectionBox}>
                  <View style={s.sectionHeaderRow}>
                    <Text style={s.sectionTitle}>🔥 Em promoção</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
                    {emPromocao.map(item => {
                      const precoPromo = item.convertedPrice ?? item.price ?? 0;
                      const precoOrig = item.precoOriginal;
                      const fotoCapa = item.fotos?.[0] || null;
                      return (
                        <TouchableOpacity key={String(item.id)} style={s.promoCard} onPress={() => abrirProduto(item)} activeOpacity={0.85}>
                          {fotoCapa ? (
                            <Image source={{ uri: fotoCapa }} style={s.promoImg} resizeMode="cover" />
                          ) : (
                            <View style={[s.promoImg, { backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' }]}>
                              <Ionicons name="storefront-outline" size={24} color="rgba(255,255,255,0.5)" />
                            </View>
                          )}
                          {item.desconto > 0 && (
                            <View style={s.descontoBadge}>
                              <Text style={s.descontoBadgeText}>-{item.desconto}%</Text>
                            </View>
                          )}
                          <View style={s.promoInfo}>
                            <Text style={s.promoNome} numberOfLines={1}>{item.description}</Text>
                            {precoOrig && <Text style={s.precoOrig}>{formatBRL(precoOrig)}</Text>}
                            <Text style={s.precoPromo}>{formatBRL(precoPromo)}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Recomendados */}
              {categoriaSelecionada === 'Todos' && recomendados.length > 0 && (
                <View style={s.sectionBox}>
                  <Text style={s.sectionTitle}>Recomendados para você</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
                    {recomendados.map(item => {
                      const p = item.convertedPrice ?? item.price ?? 0;
                      return (
                        <TouchableOpacity key={String(item.id)} style={s.miniCard} onPress={() => abrirProduto(item)} activeOpacity={0.8}>
                          <View style={[s.miniImg, { backgroundColor: '#333' }]}>
                            {item.fotos?.[0]
                              ? <Image source={{ uri: item.fotos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                              : <Ionicons name={item.isLocal ? 'storefront-outline' : 'cube-outline'} size={20} color="rgba(255,255,255,0.7)" />}
                          </View>
                          <Text style={s.miniName} numberOfLines={2}>{item.description || item.nome}</Text>
                          <Text style={s.miniPrice}>{p > 0 ? formatBRL(p) : '—'}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Vistos recentemente */}
              {categoriaSelecionada === 'Todos' && recentlyViewed.some(item => !item.isLocal || localIds.has(item.id)) && (
                <View style={s.sectionBox}>
                  <Text style={s.sectionTitle}>Vistos recentemente</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
                    {recentlyViewed.filter(item => !item.isLocal || localIds.has(item.id)).map(item => {
                      const p = item.convertedPrice ?? item.price ?? 0;
                      const fotoCapa = item.fotos?.[0] || item.foto || null;
                      return (
                        <TouchableOpacity key={String(item.id)} style={s.miniCard} onPress={() => abrirProduto(item)} activeOpacity={0.8}>
                          <View style={[s.miniImg, { backgroundColor: '#333' }]}>
                            {fotoCapa
                              ? <Image source={{ uri: fotoCapa }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                              : <Ionicons name={item.isLocal ? 'storefront-outline' : 'cube-outline'} size={20} color="rgba(255,255,255,0.7)" />}
                          </View>
                          <Text style={s.miniName} numberOfLines={2}>{item.description || item.nome}</Text>
                          <Text style={s.miniPrice}>{p > 0 ? formatBRL(p) : '—'}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

      {categoriaSelecionada === 'Todos' && (emPromocao.length > 0 || recomendados.length > 0 || recentlyViewed.length > 0) && (
        <Text style={s.allTitle}>Todos os produtos</Text>
      )}
    </>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={s.header}>
        <Text style={s.greeting}>Olá, {primeiroNome} 👋</Text>
        <Text style={s.subGreeting}>EletroHub</Text>
      </View>

      <FlatList
        data={filtrados}
        keyExtractor={item => String(item.id)}
        numColumns={2}
        columnWrapperStyle={s.row}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        onScroll={e => onTabBarScroll(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); carregarProdutos(); }}
            tintColor={colors.text}
          />
        }
        ListHeaderComponent={() => listHeader}
        ListEmptyComponent={
          loading ? (
            <View style={s.skeletonGrid}>
              {[0,1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
            </View>
          ) : (
            <View style={[s.center, { paddingVertical: 80 }]}>
              <Ionicons
                name={todos.length === 0 ? 'wifi-outline' : 'filter-outline'}
                size={48}
                color={colors.borderStrong}
              />
              <Text style={s.emptyTitle}>
                {todos.length === 0 ? 'Nenhum produto disponível' : 'Sem produtos'}
              </Text>
              <Text style={s.emptyText}>
                {todos.length === 0
                  ? 'Arraste para baixo para atualizar.'
                  : `Nenhum produto na categoria "${categoriaSelecionada}".`}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => abrirProduto(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, backgroundColor: colors.bg,
    },
    greeting: { fontSize: 20, fontWeight: '800', color: colors.text },
    subGreeting: { fontSize: 15, color: colors.text, fontWeight: '800', marginTop: 2, letterSpacing: -0.5 },
    logoMark: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    banner: {
      marginHorizontal: 16, marginBottom: 14, backgroundColor: '#1a1a1a',
      borderRadius: 20, padding: 22, flexDirection: 'row', overflow: 'hidden', height: 130,
    },
    bannerContent: { flex: 1, justifyContent: 'space-between' },
    bannerTag: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 1.5 },
    bannerTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff', lineHeight: 26 },
    bannerBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: '#ffffff', alignSelf: 'flex-start',
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    },
    bannerBtnText: { fontSize: 12, fontWeight: '700', color: '#1a1a1a' },
    bannerDecor: { position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' },
    filtrosScroll: {
      height: 56,
    },
    filtros: {
      flexDirection: 'row', alignItems: 'center',
      paddingLeft: 16, paddingRight: 0, paddingBottom: 10, paddingTop: 10,
    },
    filtroBtn: {
      height: 36,
      paddingHorizontal: 16,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filtroBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filtroText: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '600',
      includeFontPadding: false,
    },
    filtroTextActive: {
      color: colors.primaryText,
      fontWeight: '700',
    },
    countRow: { paddingHorizontal: 20, marginBottom: 4 },
    countText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
    row: { justifyContent: 'space-between', paddingHorizontal: 16 },
    list: { paddingBottom: TAB_BAR_INSET + 8 },
    sectionBox: { paddingHorizontal: 16, marginBottom: 16 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 10 },
    hScroll: { gap: 10 },
    // Promoção cards
    promoCard: {
      width: 130, backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden',
      borderWidth: 1.5, borderColor: '#ff4757' + '33',
    },
    promoImg: { width: '100%', height: 90 },
    descontoBadge: {
      position: 'absolute', top: 6, left: 6,
      backgroundColor: '#ff4757', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    },
    descontoBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
    promoInfo: { padding: 8 },
    promoNome: { fontSize: 11, fontWeight: '700', color: colors.text, marginBottom: 2 },
    precoOrig: { fontSize: 10, color: colors.textMuted, textDecorationLine: 'line-through' },
    precoPromo: { fontSize: 13, fontWeight: '800', color: '#ff4757' },
    // Mini cards
    miniCard: { width: 110, backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden' },
    miniImg: { height: 80, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    miniName: { fontSize: 11, fontWeight: '600', color: colors.text, padding: 7, paddingBottom: 3, lineHeight: 15 },
    miniPrice: { fontSize: 11, fontWeight: '800', color: colors.text, paddingHorizontal: 7, paddingBottom: 7 },
    allTitle: { fontSize: 14, fontWeight: '700', color: colors.text, paddingHorizontal: 20, marginBottom: 10 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
    loadingText: { color: colors.textMuted, fontSize: 14 },
    skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
    emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.textSecondary },
    emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  });
}
