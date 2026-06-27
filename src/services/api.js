import { AUTH_BASE_URL, PRODUCT_BASE_URL, PRODUCT_IDS } from '../config';

export const PRODUCT_IMAGE_MAP = {
  // Smartphones — Apple (GSMArena, funciona)
  'iPhone 15 128GB':           'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-1.jpg',
  'iPhone 15 Pro 256GB':       'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-1.jpg',
  // Smartphones — Samsung (Unsplash, GSMArena bloqueia hotlink)
  'Galaxy S24 256GB':          'https://images.unsplash.com/photo-1581287053822-fd7bf4f4bfec?w=400&h=500&fit=crop&q=80',
  'Galaxy S24 Ultra 512GB':    'https://images.unsplash.com/photo-1523474438810-b04a2480633c?w=400&h=500&fit=crop&q=80',
  'Galaxy A55 128GB':          'https://images.unsplash.com/photo-1581287053822-fd7bf4f4bfec?w=400&h=500&fit=crop&q=80',
  // Smartphones — Motorola (Unsplash)
  'Moto G84 256GB':            'https://images.unsplash.com/photo-1688281366628-4f63eae64395?w=400&h=500&fit=crop&q=80',
  'Moto Edge 40 256GB':        'https://images.unsplash.com/photo-1688281366628-4f63eae64395?w=400&h=500&fit=crop&q=80',
  // Smartphones — outros (GSMArena)
  'Redmi Note 13 Pro 256GB':   'https://fdn2.gsmarena.com/vv/pics/xiaomi/xiaomi-redmi-note-13-pro-4g-1.jpg',
  'Redmi 13C 128GB':           'https://fdn2.gsmarena.com/vv/pics/xiaomi/xiaomi-redmi-13c-1.jpg',
  'Pixel 8 128GB':             'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-8-1.jpg',
  'Pixel 8 Pro 256GB':         'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-8-pro-1.jpg',
  'OnePlus 12 256GB':          'https://fdn2.gsmarena.com/vv/pics/oneplus/oneplus-12-1.jpg',
  // Geladeiras (Unsplash verificado)
  'Geladeira Brastemp Frost Free 375L': 'https://images.unsplash.com/photo-1585821570368-53a593a002be?w=400&h=500&fit=crop&q=80',
  'Geladeira LG Frost Free 478L':       'https://images.unsplash.com/photo-1585338667391-5b279a0c5eb8?w=400&h=500&fit=crop&q=80',
  // Fogões (Unsplash verificado)
  'Fogão Consul 5 Bocas':       'https://images.unsplash.com/photo-1608454781855-613047b52c94?w=400&h=500&fit=crop&q=80',
  'Fogão Electrolux 5 Bocas':   'https://images.unsplash.com/photo-1629157319203-df69cdcfdbb9?w=400&h=500&fit=crop&q=80',
  // Micro-ondas (Unsplash verificado)
  'Micro-ondas Electrolux 30L': 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&h=500&fit=crop&q=80',
  'Micro-ondas Samsung 32L':    'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&h=500&fit=crop&q=80',
  // Lavadoras (Unsplash verificado)
  'Lavadora LG 12kg':           'https://images.unsplash.com/photo-1628843226223-989e20810393?w=400&h=500&fit=crop&q=80',
  'Lavadora Samsung 11kg':      'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&h=500&fit=crop&q=80',
  // Televisões (Unsplash verificado)
  'Smart TV Samsung 55" QLED':  'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=400&h=500&fit=crop&q=80',
  'Smart TV LG 50" NanoCell':   'https://images.unsplash.com/photo-1646861039459-fd9e3aabf3fb?w=400&h=500&fit=crop&q=80',
  // Notebooks (Unsplash)
  'Notebook Dell Inspiron 15':  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=500&fit=crop&q=80',
  'Notebook Acer Aspire 5':     'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=500&fit=crop&q=80',
};

const PRODUCT_FRETE_MAP = {
  // Smartphones — frete grátis
  'iPhone 15 128GB': 0, 'iPhone 15 Pro 256GB': 0,
  'Galaxy S24 256GB': 0, 'Galaxy S24 Ultra 512GB': 0, 'Galaxy A55 128GB': 0,
  'Moto G84 256GB': 0, 'Moto Edge 40 256GB': 0,
  'Redmi Note 13 Pro 256GB': 0, 'Redmi 13C 128GB': 0,
  'Pixel 8 128GB': 0, 'Pixel 8 Pro 256GB': 0, 'OnePlus 12 256GB': 0,
  // Geladeiras
  'Geladeira Brastemp Frost Free 375L': 89.90,
  'Geladeira LG Frost Free 478L': 89.90,
  // Fogões
  'Fogão Consul 5 Bocas': 79.90,
  'Fogão Electrolux 5 Bocas': 79.90,
  // Micro-ondas
  'Micro-ondas Electrolux 30L': 39.90,
  'Micro-ondas Samsung 32L': 39.90,
  // Lavadoras
  'Lavadora LG 12kg': 69.90,
  'Lavadora Samsung 11kg': 69.90,
  // TVs
  'Smart TV Samsung 55" QLED': 49.90,
  'Smart TV LG 50" NanoCell': 49.90,
  // Notebooks — frete grátis
  'Notebook Dell Inspiron 15': 0,
  'Notebook Acer Aspire 5': 0,
};

export function getFallbackImage(description = '', categoria = '') {
  if (PRODUCT_IMAGE_MAP[description]) return PRODUCT_IMAGE_MAP[description];
  const d = (description || '').toLowerCase();
  const c = (categoria || '').toLowerCase();
  if (d.includes('iphone') || d.includes('apple')) return PRODUCT_IMAGE_MAP['iPhone 15 128GB'];
  if (d.includes('galaxy') || d.includes('s23') || d.includes('s24') || d.includes('s22')) return PRODUCT_IMAGE_MAP['Galaxy S24 256GB'];
  if (d.includes('motorola') || d.startsWith('moto ') || d.includes(' moto ')) return PRODUCT_IMAGE_MAP['Moto G84 256GB'];
  if (d.includes('redmi') || d.includes('xiaomi')) return PRODUCT_IMAGE_MAP['Redmi Note 13 Pro 256GB'];
  if (d.includes('pixel') || d.includes('google pixel')) return PRODUCT_IMAGE_MAP['Pixel 8 128GB'];
  if (d.includes('notebook') || d.includes('laptop') || d.includes('macbook') || c === 'notebook') return PRODUCT_IMAGE_MAP['Notebook Dell Inspiron 15'];
  if (d.includes('smart tv') || d.includes('televisão') || d.includes('televisao') || c === 'televisão' || c === 'televisao' || c === 'tv') return PRODUCT_IMAGE_MAP['Smart TV Samsung 55" QLED'];
  if (d.includes('geladeira') || d.includes('refrigerador') || c === 'geladeira') return PRODUCT_IMAGE_MAP['Geladeira Brastemp Frost Free 375L'];
  if (d.includes('lavadora') || d.includes('máquina de lavar') || c === 'lavadora') return PRODUCT_IMAGE_MAP['Lavadora LG 12kg'];
  if (d.includes('fogão') || d.includes('fogao') || c === 'fogão' || c === 'fogao') return PRODUCT_IMAGE_MAP['Fogão Consul 5 Bocas'];
  if (d.includes('micro-ondas') || d.includes('microondas') || c === 'micro-ondas') return PRODUCT_IMAGE_MAP['Micro-ondas Electrolux 30L'];
  if (c === 'smartphone' || d.includes('smartphone') || d.includes('celular')) return PRODUCT_IMAGE_MAP['Galaxy S24 256GB'];
  return null;
}

function enrichProductImages(p) {
  if (!p.fotos?.length && !p.foto) {
    const url = getFallbackImage(p.description, p.categoria);
    if (url) p.fotos = [url];
  }
  if (p.frete === undefined || p.frete === null) {
    const frete = PRODUCT_FRETE_MAP[p.description];
    if (frete !== undefined) {
      p.frete = frete;
      p.freteTipo = 'proprio';
    }
  }
  return p;
}

// ─── Auth Service (porta 8900) ───────────────────────────────────────────────

export const authAPI = {
  signup: async (name, email, password) => {
    const res = await fetch(`${AUTH_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || 'Erro ao criar conta');
    try { return JSON.parse(text); } catch { return text; }
  },

  signin: async (email, password) => {
    const res = await fetch(`${AUTH_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || 'Email ou senha inválidos');
    return JSON.parse(text); // { user: {id, name, email, type}, token }
  },
};

// ─── Product Service (porta 8000) ────────────────────────────────────────────

export const productAPI = {
  getById: async (id, token = null) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(
      `${PRODUCT_BASE_URL}/products/${id}?targetCurrency=BRL`,
      { headers }
    );
    if (!res.ok) throw new Error(`Produto ${id} não encontrado`);
    const p = await res.json();
    return enrichProductImages(p);
  },

  getAll: async (token = null) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${PRODUCT_BASE_URL}/products`, { headers });
    if (!res.ok) throw new Error('Erro ao buscar produtos');
    const list = await res.json();
    return list.map(p => {
      if (!p.convertedPrice || p.convertedPrice < 0) p.convertedPrice = p.price > 0 ? p.price : 0;
      if (p.convertedPrice < 0) p.convertedPrice = 0;
      if (p.price < 0) p.price = 0;
      if (!p.categoria) p.categoria = 'Smartphone';
      return enrichProductImages(p);
    });
  },

  search: async (query, token = null) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(
      `${PRODUCT_BASE_URL}/products?q=${encodeURIComponent(query)}`,
      { headers }
    );
    if (!res.ok) return [];
    const list = await res.json();
    return list.map(p => {
      if (!p.convertedPrice || p.convertedPrice < 0) p.convertedPrice = p.price > 0 ? p.price : 0;
      if (p.convertedPrice < 0) p.convertedPrice = 0;
      if (!p.categoria) p.categoria = 'Smartphone';
      return enrichProductImages(p);
    });
  },

  create: async (productData, token = null) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(`${PRODUCT_BASE_URL}/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify(productData),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || 'Erro ao publicar anúncio');
    }
    return res.json();
  },
};

// ─── Dados mockados (sem endpoint no backend) ─────────────────────────────────

export const mockOrders = [
  {
    id: 1,
    productName: 'iPhone 15 128GB',
    brand: 'Apple',
    value: 'R$ 4.245,00',
    variation: '128GB - Preto',
    quantity: 1,
    deliveryType: 'Frete',
    daysToArrive: 7,
    imageColor: '#1a1a1a',
  },
  {
    id: 2,
    productName: 'Galaxy S24 256GB',
    brand: 'Samsung',
    value: 'R$ 4.558,00',
    variation: '256GB - Branco',
    quantity: 1,
    deliveryType: 'Local',
    daysToArrive: 2,
    imageColor: '#333',
  },
];

export const mockNotifications = [
  { id: 1, text: 'Seu pedido foi confirmado! Entrega em 7 dias.' },
  { id: 2, text: 'Novo produto disponível: Galaxy S24 Ultra.' },
  { id: 3, text: 'Promoção: 10% de desconto em smartphones.' },
  { id: 4, text: 'Seu anúncio recebeu 5 visualizações hoje.' },
  { id: 5, text: 'Pagamento aprovado com sucesso.' },
];

export const mockMyItems = [
  { id: 101, name: 'Geladeira Brastemp 400L', sold: 3, price: 'R$ 2.800,00' },
  { id: 102, name: 'Fogão 5 Bocas Consul', sold: 1, price: 'R$ 1.200,00' },
  { id: 103, name: 'Micro-ondas 30L Electrolux', sold: 7, price: 'R$ 650,00' },
  { id: 104, name: 'Lavadora 12kg LG', sold: 2, price: 'R$ 3.100,00' },
];
