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
} from 'react-native';
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
  const [rates, setRates] = useState<Rates | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (first = false) => {
    try {
      setError(null);
      if (first) setLoading(true);
      else setRefreshing(true);

      const [r, feed] = await Promise.all([api.newsRates(), api.newsFeed()]);
      setRates(r as Rates);
      setArticles((feed as Article[]) ?? []);
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
            {rates?.updatedAt ? `Act: ${new Date(rates.updatedAt).toLocaleDateString('es-CL')}` : ''}
          </Text>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.sectionTitle}>Últimas noticias</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Article }) => (
    <TouchableOpacity
      onPress={() => Linking.openURL(item.url)}
      style={styles.newsCard}
      activeOpacity={0.85}
    >
      <Text style={styles.newsTitle}>{item.title}</Text>
      <View style={styles.newsMetaRow}>
        {item.source ? <Text style={styles.newsMeta}>{item.source}</Text> : null}
        {item.published_at ? (
          <Text style={styles.newsMeta}> • {formatDate(item.published_at)}</Text>
        ) : null}
      </View>
      <Text style={styles.newsLink}>Abrir</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerFill]}>
        <ActivityIndicator />
        <Text style={styles.hint}>Cargando…</Text>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(false)}
            tintColor="#fff"
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No hay noticias por ahora.
          </Text>
        }
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: Platform.OS === 'ios' 
              ? insets.bottom + 70 
              : 60
          }
        ]}
      />
    </View>
  );
}
