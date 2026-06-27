import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFallbackImage } from '../services/api';

const MyItemsContext = createContext(null);

export function MyItemsProvider({ children }) {
  const [myItems, setMyItems] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const stored = await AsyncStorage.getItem('@eletrohub:myitems');
      let parsed = stored ? JSON.parse(stored) : [];

      // Migração: preenche fotos vazias com fallback baseado no nome/categoria
      const migrated = await AsyncStorage.getItem('@eletrohub:myitems_fotosv1');
      if (!migrated && parsed.length > 0) {
        parsed = parsed.map(item => {
          if (!item.fotos?.length) {
            const url = getFallbackImage(item.nome || '', item.categoria || '');
            if (url) return { ...item, fotos: [url] };
          }
          return item;
        });
        await AsyncStorage.setItem('@eletrohub:myitems', JSON.stringify(parsed));
        await AsyncStorage.setItem('@eletrohub:myitems_fotosv1', '1');
      }

      if (parsed.length > 0) {
        setMyItems(parsed);
        return;
      }

      // Sem itens → sempre popula com os anúncios de exemplo
      {
        const expira7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const expira3 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        const seed = [
          {
            id: 1001, nome: 'iPhone 14 128GB', categoria: 'Smartphone',
            preco: '4500,00',
            fotos: [getFallbackImage('iPhone 14 128GB', 'Smartphone')].filter(Boolean),
            descricao: 'Seminovo, ótimo estado. Bateria 89%, sem arranhões.',
            emPromocao: true, desconto: 15, promocaoExpira: expira7,
            sold: 2, vendido: false, condicao: 'Seminovo',
          },
          {
            id: 1002, nome: 'Galaxy S23 256GB', categoria: 'Smartphone',
            preco: '3800,00',
            fotos: [getFallbackImage('Galaxy S23 256GB', 'Smartphone')].filter(Boolean),
            descricao: 'Completo com caixa e nota fiscal. Cor: Phantom Black.',
            emPromocao: true, desconto: 20, promocaoExpira: expira3,
            sold: 1, vendido: false, condicao: 'Novo',
          },
          {
            id: 1003, nome: 'Notebook Dell Inspiron 15', categoria: 'Notebook',
            preco: '2800,00',
            fotos: [getFallbackImage('Notebook Dell Inspiron 15', 'Notebook')].filter(Boolean),
            descricao: 'Intel i5, 8GB RAM, SSD 256GB. Windows 11 original.',
            emPromocao: true, desconto: 10, promocaoExpira: expira7,
            sold: 0, vendido: false, condicao: 'Usado',
          },
          {
            id: 1004, nome: 'Smart TV LG 55"', categoria: 'Televisão',
            preco: '2200,00',
            fotos: [getFallbackImage('Smart TV LG 55"', 'Televisão')].filter(Boolean),
            descricao: '4K UHD, 55 polegadas, webOS, Wi-Fi integrado.',
            emPromocao: false, desconto: 0, sold: 3, vendido: false, condicao: 'Novo',
          },
          {
            id: 1005, nome: 'Moto G84 256GB', categoria: 'Smartphone',
            preco: '1499,00',
            fotos: [getFallbackImage('Moto G84 256GB', 'Smartphone')].filter(Boolean),
            descricao: '256GB, câmera 50MP, tela 6.5" pOLED, bateria 5000mAh.',
            emPromocao: false, desconto: 0, sold: 0, vendido: false, condicao: 'Novo',
          },
          {
            id: 1006, nome: 'Geladeira Brastemp Frost Free 375L', categoria: 'Geladeira',
            preco: '2899,00',
            fotos: [getFallbackImage('Geladeira Brastemp Frost Free 375L', 'Geladeira')].filter(Boolean),
            descricao: 'Frost Free 375L, cor branca, 2 portas, compressor inverter.',
            emPromocao: true, desconto: 8, promocaoExpira: expira7,
            sold: 1, vendido: false, condicao: 'Novo',
          },
          {
            id: 1007, nome: 'Redmi Note 13 Pro 256GB', categoria: 'Smartphone',
            preco: '2006,75',
            fotos: [getFallbackImage('Redmi Note 13 Pro 256GB', 'Smartphone')].filter(Boolean),
            descricao: '256GB, câmera 200MP, tela AMOLED 120Hz, NFC.',
            emPromocao: false, desconto: 0, sold: 0, vendido: false, condicao: 'Seminovo',
          },
        ];
        await AsyncStorage.setItem('@eletrohub:myitems', JSON.stringify(seed));
        await AsyncStorage.setItem('@eletrohub:myitems_fotosv1', '1');
        setMyItems(seed);
      }
    } catch (_) {}
  }

  async function persist(items) {
    setMyItems(items);
    await AsyncStorage.setItem('@eletrohub:myitems', JSON.stringify(items));
  }

  function addItem(item) {
    const newItem = { ...item, id: Date.now(), sold: 0, vendido: false };
    persist([newItem, ...myItems]);
    return newItem;
  }

  function removeItem(id) {
    persist(myItems.filter(i => i.id !== id));
  }

  function marcarVendido(id) {
    persist(myItems.map(i => i.id === id ? { ...i, vendido: !i.vendido } : i));
  }

  // Chamado ao confirmar pagamento — sempre seta vendido: true e incrementa sold
  function registrarVenda(id) {
    persist(myItems.map(i =>
      i.id === id ? { ...i, vendido: true, sold: (i.sold || 0) + 1 } : i
    ));
  }

  function promoverItem(id, desconto, duracaoDias) {
    const expira = new Date();
    expira.setDate(expira.getDate() + duracaoDias);
    persist(myItems.map(i =>
      i.id === id
        ? { ...i, emPromocao: true, desconto: Number(desconto), promocaoExpira: expira.toISOString() }
        : i
    ));
  }

  function removerPromocao(id) {
    persist(myItems.map(i =>
      i.id === id ? { ...i, emPromocao: false, promocaoExpira: null } : i
    ));
  }

  function updateItem(id, changes) {
    persist(myItems.map(i => i.id === id ? { ...i, ...changes } : i));
  }

  return (
    <MyItemsContext.Provider value={{ myItems, addItem, updateItem, removeItem, marcarVendido, registrarVenda, promoverItem, removerPromocao }}>
      {children}
    </MyItemsContext.Provider>
  );
}

export function useMyItems() {
  return useContext(MyItemsContext);
}
