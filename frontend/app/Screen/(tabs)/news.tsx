import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  Image,
  Animated,
} from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../../../Styles/newsStyles';
import api from '../../../constants/api';

type Rates = {
  base: 'CLP';
  usd: number;
  eur: number;
  uf: number;
  updatedAt: string;
};

type Article = {
  id: string;
  title: string;
  url: string;
  source?: string;
  published_at?: string | null;
  image?: string | null;
  score?: number | null;
};

const fmtCLP = (n: number) =>
  n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

const formatDate = (iso?: string | null) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [rates, setRates] = useState<Rates | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normaliza y ordena por relevancia (score) y fecha desc
  const normalizeArticles = (arr: any[]): Article[] => {
    const list: Article[] = (arr || []).map((a: any) => ({
      id: String(a?.id ?? a?.url ?? Math.random()),
      title: String(a?.title ?? ''),
      url: String(a?.url ?? ''),
      source: a?.source ?? a?.provider ?? undefined,
      published_at: a?.published_at ?? a?.publishedAt ?? a?.date ?? null,
      image: a?.image ?? a?.thumbnail ?? null,
      score: typeof a?.score === 'number' ? a.score : null,
    }));
    list.sort((a, b) => {
      const sa = a.score ?? -Infinity;
      const sb = b.score ?? -Infinity;
      if (sa !== sb) return sb - sa;
      const ta = a.published_at ? new Date(a.published_at).getTime() : 0;
      const tb = b.published_at ? new Date(b.published_at).getTime() : 0;
      return tb - ta;
    });
    return list;
  };

  const load = useCallback(async (first = false) => {
    try {
      setError(null);
      if (first) setLoading(true);
      else setRefreshing(true);

      const [r, feed] = await Promise.all([api.newsRates(), api.newsFeed()]);
      setRates(r as Rates);
      setArticles(normalizeArticles((feed as any[]) ?? []));
    } catch (e: any) {
      console.error('news fetch error', e?.message || e);
      setError('No se pudo cargar información. Reintenta.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(true);
  }, [load]);

  const Header = () => (
    <View>
      <Text style={styles.headerTitle}>Mercados & Noticias</Text>
      <Text style={styles.headerSubtitle}>Actualizaciones del mercado y noticias destacadas.</Text>
      <Text style={styles.sectionTitle}>Valor actual de divisas</Text>
      <View style={styles.rateRow}>
        <View style={styles.rateCard}>
          <Text style={styles.rateLabel}>Dólar (USD)</Text>
          <Text style={styles.rateValue}>
            {rates ? fmtCLP(rates.usd) : '—'}
          </Text>
          <Text style={styles.rateSub}>
            1000 CLP ≈ {rates ? (1000 / rates.usd).toFixed(2) : '—'} USD
          </Text>
        </View>
        <View style={styles.rateCard}>
          <Text style={styles.rateLabel}>Euro (EUR)</Text>
          <Text style={styles.rateValue}>
            {rates ? fmtCLP(rates.eur) : '—'}
          </Text>
          <Text style={styles.rateSub}>
            1000 CLP ≈ {rates ? (1000 / rates.eur).toFixed(2) : '—'} EUR
          </Text>
        </View>
        <View style={styles.rateCard}>
          <Text style={styles.rateLabel}>UF</Text>
          <Text style={styles.rateValue}>
            {rates ? fmtCLP(rates.uf) : '—'}
          </Text>
          <Text style={styles.rateSub}>
            {rates?.updatedAt ? `Fecha: ${new Date(rates.updatedAt).toLocaleDateString('es-CL')}` : ''}
          </Text>
        </View>
      </View>

      {error ? (
        <View style={styles.retryCard}>
          <Text style={styles.retryText}>{error}</Text>
          <TouchableOpacity onPress={() => load(false)} style={styles.retryBtn} accessibilityRole="button">
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Últimas noticias</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Article }) => (
    <TouchableOpacity
      onPress={() => Linking.openURL(item.url)}
      style={styles.newsCard}
      activeOpacity={0.85}
    >
      <View style={styles.newsRow}>
        <Image source={{ uri: String(item.image || getAIImage(item.title)) }} style={styles.newsThumb} />
        <View style={styles.newsContent}>
          <Text style={styles.newsTitle}>{item.title}</Text>
          <View style={styles.newsMetaRow}>
            {item.source ? <Text style={styles.newsMeta}>{item.source}</Text> : null}
            {item.published_at ? (
              <Text style={styles.newsMeta}> • {formatDate(item.published_at)}</Text>
            ) : null}
          </View>
          <Text style={styles.newsLink}>Leer más</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Skeleton loaders sencillos (bloques grises con animación de opacidad)
  const SkeletonList = () => {
    const anim = new Animated.Value(0.5);
    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 0.9, duration: 800, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }, []);

    const items = Array.from({ length: 6 });
    return (
      <View style={styles.listContent}>
        {items.map((_, i) => (
          <View key={i} style={styles.skeletonCard}>
            <View style={styles.skeletonRow}>
              <Animated.View style={[styles.skeletonThumb, { opacity: anim }]} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Animated.View style={[styles.skeletonLine, { width: '80%', opacity: anim }]} />
                <Animated.View style={[styles.skeletonLine, { width: '60%', opacity: anim, marginTop: 8 }]} />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SkeletonList />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={articles}
        keyExtractor={(a) => a.id}
        renderItem={renderItem}
        ListHeaderComponent={Header}
        numColumns={Platform.OS === 'web' && width > 800 ? 2 : 1}
        columnWrapperStyle={Platform.OS === 'web' && width > 800 ? styles.columnWrapper : undefined}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(false)}
            tintColor="#fff"
          />
        }
        ListEmptyComponent={
          <View style={styles.retryCard}>
            <Text style={styles.retryText}>No hay noticias por ahora.</Text>
            <TouchableOpacity onPress={() => load(false)} style={styles.retryBtn} accessibilityRole="button">
              <Text style={styles.retryBtnText}>Actualizar</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: Platform.OS === 'ios' 
              ? insets.bottom + 70 
              : 60
          }
        ]}
        initialNumToRender={Platform.OS === 'web' ? 10 : 6}
        maxToRenderPerBatch={Platform.OS === 'web' ? 20 : 8}
        removeClippedSubviews
        windowSize={Platform.OS === 'web' ? 8 : 5}
      />
    </View>
  );
}

// Fallback de imagen "generada" relevante por título usando tags y seed estable
function getAIImage(title: string): string {
  const tags = pickTagsFromTitle(title);
  const lock = Math.abs(hashStringToInt(title)) % 5000; // resultado estable por artículo
  const size = Platform.OS === 'web' ? '128/128' : '64/64';
  const tagStr = tags.join(',') || 'finance,money';
  return `https://loremflickr.com/${size}/${encodeURIComponent(tagStr)}?lock=${lock}`;
}

function pickTagsFromTitle(title: string): string[] {
  const t = (title || '').toLowerCase();
  const tags: string[] = [];
  const push = (k: string) => { if (!tags.includes(k)) tags.push(k); };
  if (/(usd|dólar|dolar)/.test(t)) { push('usd'); push('dollar'); push('currency'); }
  if (/(eur|euro)/.test(t)) { push('euro'); push('currency'); }
  if (/(uf|unidad de fomento)/.test(t)) { push('finance'); push('currency'); }
  if (/(inflación|inflacion|ipc)/.test(t)) { push('inflation'); push('economy'); }
  if (/(bolsa|acciones|stocks|mercado)/.test(t)) { push('stocks'); push('market'); push('trading'); }
  if (/(banco|bank|crédito|credito|deuda|loan|interest)/.test(t)) { push('bank'); push('loan'); push('interest'); }
  if (/(ahorro|savings|inversión|inversion)/.test(t)) { push('savings'); push('investment'); push('finance'); }
  if (tags.length === 0) { push('finance'); push('money'); }
  return tags.slice(0, 3);
}

function hashStringToInt(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0; // 32-bit
  }
  return h;
}
