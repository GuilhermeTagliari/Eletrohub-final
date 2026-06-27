import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { getFallbackImage } from '../services/api';
import SwipeableModal from '../components/SwipeableModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useOrders } from '../context/OrdersContext';
import { useAuth } from '../context/AuthContext';
import { TAB_BAR_INSET } from '../utils/tabBarAnim';

// If user manually set a status, use that. Otherwise auto-advance by time.
function computeStatusIndex(order) {
  if (order.manualStatus) return order.statusIndex ?? 0;
  if (!order.createdAt) return order.statusIndex || 0;
  const mins = (Date.now() - order.createdAt) / 60000;
  if (mins < 5)   return 0;
  if (mins < 30)  return 1;
  if (mins < 240) return 2;
  return 3;
}

const STATUSES = [
  { key: 'confirmado', label: 'Compra confirmada', desc: 'Processamos sua compra.',                        icon: 'checkmark-circle', color: '#2ed573' },
  { key: 'separando',  label: 'Em preparação',      desc: 'O vendedor está preparando sua compra.',        icon: 'cube',             color: '#ffa502' },
  { key: 'enviado',    label: 'A caminho',           desc: 'O vendedor despachou sua compra.',              icon: 'car',              color: '#2c7be5' },
  { key: 'entregue',   label: 'Entregue',            desc: 'Produto entregue ao destinatário.',             icon: 'home',             color: '#7bed9f' },
];

const BRAND_COLORS = {
  Apple: '#1c1c1e', Samsung: '#1428A0', Motorola: '#003087',
  Xiaomi: '#FF6900', Google: '#4285F4', OnePlus: '#F5010C',
};

const METODO_LABELS = { pix: 'PIX', cartao: 'Cartão de crédito', boleto: 'Boleto' };

const HUBS = ['Curitiba/PR', 'São Paulo/SP', 'Campinas/SP', 'Porto Alegre/RS', 'Rio de Janeiro/RJ', 'Belo Horizonte/MG'];

function gerarEventosRastreio(createdAt, codigo) {
  if (!createdAt || !codigo) return [];
  const base = new Date(createdAt);
  const fmt = (d) => d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const hub1 = HUBS[Math.abs(codigo.charCodeAt(2) - 48) % HUBS.length];
  const hub2 = HUBS[(Math.abs(codigo.charCodeAt(3) - 48) + 1) % HUBS.length];
  const add = (h) => new Date(base.getTime() + h * 3600000);

  const eventos = [
    { status: 'Objeto postado', local: 'Agência dos Correios', dt: fmt(add(0)), done: true },
    { status: 'Em triagem',     local: `Centro de Distribuição — ${hub1}`, dt: fmt(add(6)),  done: Date.now() > add(6) },
    { status: 'Em trânsito',    local: `Unidade de Tratamento — ${hub2}`,  dt: fmt(add(30)), done: Date.now() > add(30) },
    { status: 'Saiu para entrega', local: 'Unidade de Distribuição', dt: fmt(add(72)), done: Date.now() > add(72) },
    { status: 'Entregue ao destinatário', local: 'Endereço de entrega', dt: fmt(add(120)), done: Date.now() > add(120) },
  ];
  return eventos;
}

export default function MyOrdersScreen({ navigation }) {
  const { colors } = useTheme();
  const { orders, setOrderStatus } = useOrders();
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState(null);
  const [tick, setTick] = useState(0);
  const [rastreioOrder, setRastreioOrder] = useState(null);
  const [comprovanteOrder, setComprovanteOrder] = useState(null);
  const s = makeStyles(colors);

  // Re-render every 60s so status auto-advances visually
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  function renderItem({ item }) {
    const isExpanded = expandedId === item.id;
    const statusIdx = computeStatusIndex(item);
    const currentStatus = STATUSES[statusIdx] || STATUSES[0];
    const bgColor = BRAND_COLORS[item.brand] || (item.isLocal ? '#2c7be5' : '#555');
    const thumbFoto = item.fotos?.[0] || getFallbackImage(item.productName || '', item.categoria || '') || null;
    const nomeExibido = item.quantity > 1
      ? `${item.productName} +${item.quantity - 1} item${item.quantity - 1 > 1 ? 's' : ''}`
      : item.productName;

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        activeOpacity={0.85}
      >
        <View style={s.cardHeader}>
          <View style={[s.thumb, { backgroundColor: thumbFoto ? '#f0f0f0' : bgColor }]}>
            {thumbFoto
              ? <Image source={{ uri: thumbFoto }} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode="contain" />
              : <Ionicons name="storefront-outline" size={22} color="#fff" />}
          </View>
          <View style={s.cardInfo}>
            <Text style={s.productName} numberOfLines={1}>{nomeExibido}</Text>
            {item.variation ? <Text style={s.cardSub}>{item.variation}</Text> : null}
            <Text style={s.cardSub}>{item.data} · {METODO_LABELS[item.metodo] || item.metodo}</Text>
            <Text style={s.cardValue}>{item.value}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: currentStatus.color + '18' }]}>
            <Ionicons name={currentStatus.icon} size={12} color={currentStatus.color} />
            <Text style={[s.statusText, { color: currentStatus.color }]}>{currentStatus.label}</Text>
          </View>
        </View>

        {/* Timeline expandida — estilo Mercado Livre */}
        {isExpanded && (
          <View style={s.timeline}>
            {STATUSES.map((st, idx) => {
              const done = idx <= statusIdx;
              const isActive = idx === statusIdx;
              const isLast = idx === STATUSES.length - 1;
              const base = new Date(item.createdAt || Date.now());
              const offsets = [0, 48, 72, 120];
              const stDate = new Date(base.getTime() + offsets[idx] * 3600000);
              const fmtDt = (d) => d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace('.', '');

              // Sub-eventos para "A caminho"
              const hub1 = HUBS[item.id % HUBS.length];
              const hub2 = HUBS[(item.id + 1) % HUBS.length];
              const subEvents = (idx === 2 && done) ? [
                { text: `Saiu do centro de distribuição de ${hub1} e está em trânsito.`, dt: new Date(base.getTime() + 78 * 3600000) },
                { text: `Entrou no centro de distribuição de ${hub2}`, dt: new Date(base.getTime() + 95 * 3600000) },
              ] : [];

              return (
                <TouchableOpacity
                  key={st.key}
                  style={s.timelineItem}
                  onPress={() => setOrderStatus(item.id, idx)}
                  activeOpacity={0.7}
                >
                  <View style={s.timelineLeft}>
                    <View style={[s.timelineDot, done && { borderColor: st.color, backgroundColor: st.color + '22' }]}>
                      {done && <Ionicons name={isActive && idx === 2 ? 'car' : 'checkmark'} size={12} color={st.color} />}
                    </View>
                    {!isLast && <View style={[s.timelineLine, done && { backgroundColor: st.color }]} />}
                  </View>
                  <View style={s.timelineContent}>
                    <Text style={[s.timelineLabel, done && { color: colors.text, fontWeight: '700' }, !done && { color: colors.textMuted }]}>
                      {st.label}
                    </Text>
                    {done && <Text style={s.timelineDesc}>{st.desc}</Text>}
                    {done && <Text style={s.timelineDt}>{fmtDt(stDate)}</Text>}
                    {subEvents.map((ev, i) => (
                      <View key={i} style={{ marginTop: 10 }}>
                        <Text style={s.timelineSubText}>{ev.text}</Text>
                        <Text style={s.timelineDt}>{fmtDt(ev.dt)}</Text>
                      </View>
                    ))}
                    {!done && <Text style={s.timelineHint}>Toque para avançar</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}

            <View style={s.deliveryRow}>
              <Ionicons
                name={item.deliveryType === 'Frete' ? 'car-outline' : 'location-outline'}
                size={16}
                color={colors.textSecondary}
              />
              <Text style={s.deliveryText}>
                {item.deliveryType === 'Frete'
                  ? `Frete · previsão de ${item.daysToArrive} dias úteis`
                  : 'Retirada local · já disponível'}
              </Text>
            </View>

            {/* Itens do pedido */}
            {item.items?.length > 1 && (
              <View style={s.itensList}>
                <Text style={s.itensTitle}>Itens do pedido</Text>
                {item.items.map((p, i) => (
                  <View key={i} style={s.itemRow}>
                    <Text style={s.itemRowName} numberOfLines={1}>{p.description || p.nome}</Text>
                    <Text style={s.itemRowQty}>x{p.quantity}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Rastreio EletroHub + Comprovante */}
            <View style={s.extraBtnsRow}>
              {item.freteCodigo ? (
                <TouchableOpacity style={s.extraBtn} onPress={() => setRastreioOrder(item)}>
                  <Ionicons name="locate-outline" size={14} color={colors.info} />
                  <Text style={[s.extraBtnText, { color: colors.info }]}>Rastrear envio</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={s.extraBtn} onPress={() => setComprovanteOrder(item)}>
                <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
                <Text style={s.extraBtnText}>Comprovante</Text>
              </TouchableOpacity>
            </View>

            {/* Avaliar vendedor */}
            <View style={s.actionsRow}>
              <TouchableOpacity
                style={s.rateBtn}
                onPress={() => navigation.navigate('RateSeller', {
                  sellerKey: item.brand || item.productName,
                  sellerName: item.brand || item.productName,
                })}
              >
                <Ionicons name="star-outline" size={15} color={colors.warning} />
                <Text style={s.rateBtnText}>Avaliar vendedor</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.rateBtn}
                onPress={() => navigation.navigate('RateProduct', {
                  productId: item.id,
                  productName: item.productName,
                })}
              >
                <Ionicons name="cube-outline" size={15} color={colors.info} />
                <Text style={[s.rateBtnText, { color: colors.info }]}>Avaliar produto</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={s.expandRow}>
          <Text style={s.expandText}>{isExpanded ? 'Ocultar' : 'Ver detalhes'}</Text>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Meus Pedidos</Text>
        <View style={{ width: 36 }} />
      </View>

      {orders.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="receipt-outline" size={56} color={colors.borderStrong} />
          <Text style={s.emptyTitle}>Nenhum pedido ainda</Text>
          <Text style={s.emptyText}>Seus pedidos aparecerão aqui após finalizar uma compra.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
        />
      )}

      {/* Modal Rastreio */}
      <SwipeableModal visible={!!rastreioOrder} onClose={() => setRastreioOrder(null)} style={{ backgroundColor: colors.surface, padding: 20, maxHeight: '85%' }}>
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>Rastreamento</Text>
          <TouchableOpacity onPress={() => setRastreioOrder(null)}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        {rastreioOrder && (
          <>
            <View style={s.codigoBox}>
              <Ionicons name="barcode-outline" size={18} color={colors.textSecondary} />
              <Text style={s.codigoText}>{rastreioOrder.freteCodigo}</Text>
              <Text style={s.codigoSub}>Correios PAC · EletroHub</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {gerarEventosRastreio(rastreioOrder.createdAt, rastreioOrder.freteCodigo).map((ev, i, arr) => (
                <View key={i} style={s.trackItem}>
                  <View style={s.trackLeft}>
                    <View style={[s.trackDot, ev.done && { backgroundColor: colors.success, borderColor: colors.success }]}>
                      {ev.done && <Ionicons name="checkmark" size={10} color="#fff" />}
                    </View>
                    {i < arr.length - 1 && <View style={[s.trackLine, ev.done && { backgroundColor: colors.success }]} />}
                  </View>
                  <View style={s.trackContent}>
                    <Text style={[s.trackStatus, !ev.done && { color: colors.textMuted }]}>{ev.status}</Text>
                    <Text style={s.trackLocal}>{ev.local}</Text>
                    {ev.done && <Text style={s.trackDt}>{ev.dt}</Text>}
                  </View>
                </View>
              ))}
            </ScrollView>
          </>
        )}
      </SwipeableModal>

      {/* Modal Comprovante */}
      <SwipeableModal visible={!!comprovanteOrder} onClose={() => setComprovanteOrder(null)} style={{ backgroundColor: colors.surface, padding: 20, maxHeight: '85%' }}>
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>Comprovante de Transação</Text>
          <TouchableOpacity onPress={() => setComprovanteOrder(null)}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        {comprovanteOrder && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={s.comprovanteHeader}>
              <Ionicons name="shield-checkmark" size={32} color={colors.success} />
              <Text style={s.comprovanteTitle}>EletroHub</Text>
              <Text style={s.comprovanteSub}>Comprovante de Transação</Text>
              <Text style={s.comprovanteSub2}>Este documento não substitui Nota Fiscal</Text>
            </View>
            {[
              ['Produto', comprovanteOrder.productName],
              ['Pedido nº', String(comprovanteOrder.id)],
              ['Data', comprovanteOrder.data],
              ['Valor', comprovanteOrder.value],
              ['Pagamento', METODO_LABELS[comprovanteOrder.metodo] || comprovanteOrder.metodo],
              ['Comprador', user?.name || user?.nome || '—'],
              comprovanteOrder.freteCodigo ? ['Código de postagem', comprovanteOrder.freteCodigo] : null,
            ].filter(Boolean).map(([label, val]) => (
              <View key={label} style={s.comprovanteRow}>
                <Text style={s.comprovanteLabel}>{label}</Text>
                <Text style={s.comprovanteVal}>{val}</Text>
              </View>
            ))}
            <View style={s.nfBox}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
              <Text style={s.nfText}>
                A Nota Fiscal é de responsabilidade do vendedor. Caso seja MEI ou empresa, solicite diretamente ao anunciante.
              </Text>
            </View>
          </ScrollView>
        )}
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
    backBtn: { width: 36 },
    title: { fontSize: 20, fontWeight: '800', color: colors.text },
    list: { padding: 16, gap: 12, paddingBottom: TAB_BAR_INSET + 8 },
    card: {
      backgroundColor: colors.surface, borderRadius: 16, padding: 16,
      shadowColor: colors.shadow, shadowOpacity: 0.06, shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    thumb: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cardInfo: { flex: 1 },
    productName: { fontSize: 14, fontWeight: '700', color: colors.text },
    cardSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    cardValue: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 4 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 11, fontWeight: '700' },
    timeline: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
    timelineItem: { flexDirection: 'row', gap: 14, marginBottom: 4 },
    timelineLeft: { alignItems: 'center', width: 24 },
    timelineDot: {
      width: 24, height: 24, borderRadius: 12, borderWidth: 2,
      borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surfaceSecondary,
    },
    timelineLine: { width: 2, flex: 1, backgroundColor: colors.borderStrong, marginVertical: 2, minHeight: 20 },
    timelineLineDone: { backgroundColor: colors.success },
    timelineContent: { flex: 1, paddingBottom: 16 },
    timelineLabel: { fontSize: 14, color: colors.textMuted },
    timelineDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 3, lineHeight: 18 },
    timelineDt: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    timelineSubText: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
    timelineSub: { fontSize: 12, color: colors.info, marginTop: 2 },
    timelineHint: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
    deliveryRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.surfaceSecondary, borderRadius: 10, padding: 12, marginTop: 4,
    },
    deliveryText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
    itensList: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
    itensTitle: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    itemRowName: { fontSize: 13, color: colors.textSecondary, flex: 1 },
    itemRowQty: { fontSize: 13, fontWeight: '700', color: colors.text, marginLeft: 8 },
    actionsRow: {
      flexDirection: 'row', gap: 10, marginTop: 12,
      paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border,
    },
    rateBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 9, borderRadius: 10, borderWidth: 1.5,
      borderColor: colors.warning + '55', backgroundColor: colors.warning + '0d',
    },
    rateBtnText: { fontSize: 12, fontWeight: '700', color: colors.warning },
    expandRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
      paddingTop: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border,
    },
    expandText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textSecondary },
    emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
    extraBtnsRow: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 4 },
    extraBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 9, borderRadius: 10, borderWidth: 1.5,
      borderColor: colors.borderStrong, backgroundColor: colors.surfaceSecondary,
    },
    extraBtnText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
    codigoBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      backgroundColor: colors.surfaceSecondary, borderRadius: 10, padding: 12, marginBottom: 16,
    },
    codigoText: { fontSize: 15, fontWeight: '800', color: colors.text, letterSpacing: 1 },
    codigoSub: { fontSize: 11, color: colors.textMuted, width: '100%', marginTop: 2 },
    trackItem: { flexDirection: 'row', gap: 14, marginBottom: 4 },
    trackLeft: { alignItems: 'center', width: 22 },
    trackDot: {
      width: 22, height: 22, borderRadius: 11, borderWidth: 2,
      borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surfaceSecondary,
    },
    trackLine: { width: 2, flex: 1, backgroundColor: colors.borderStrong, minHeight: 24, marginVertical: 2 },
    trackContent: { flex: 1, paddingBottom: 18 },
    trackStatus: { fontSize: 14, fontWeight: '700', color: colors.text },
    trackLocal: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    trackDt: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    comprovanteHeader: { alignItems: 'center', paddingVertical: 16, gap: 4, marginBottom: 8 },
    comprovanteTitle: { fontSize: 22, fontWeight: '900', color: colors.text },
    comprovanteSub: { fontSize: 13, color: colors.textSecondary },
    comprovanteSub2: { fontSize: 11, color: colors.textMuted, fontStyle: 'italic' },
    comprovanteRow: {
      flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    comprovanteLabel: { fontSize: 13, color: colors.textMuted, flex: 1 },
    comprovanteVal: { fontSize: 13, fontWeight: '700', color: colors.text, flex: 1, textAlign: 'right' },
    nfBox: {
      flexDirection: 'row', gap: 8, alignItems: 'flex-start',
      marginTop: 16, backgroundColor: colors.surfaceSecondary,
      borderRadius: 10, padding: 12,
    },
    nfText: { fontSize: 12, color: colors.textMuted, flex: 1, lineHeight: 18 },
  });
}
