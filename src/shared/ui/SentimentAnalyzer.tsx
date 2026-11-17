import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { createSentimentClassifier } from '../../../ai/sentiment';
import model from '../../../ai/model-edom.json';

type SentimentResult = {
  label: string | null;
  status: string;
  scores?: number[] | null;
  scoreType?: string | null;
  experimental?: boolean | null;
};

interface SentimentAnalyzerProps {
  initialText?: string;
}

export default function SentimentAnalyzer({
  initialText,
}: SentimentAnalyzerProps) {
  const [text, setText] = useState(initialText || '');
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = () => {
    if (!text.trim()) {
      setResult({
        label: null,
        status: 'empty_input',
        scores: null,
        scoreType: 'none',
        experimental: true,
      });
      return;
    }

    setLoading(true);
    try {
      const prediksi = createSentimentClassifier(model);
      const hasil = prediksi(text);
      setResult(hasil);
    } catch {
      setResult({
        label: null,
        status: 'error',
        scores: null,
        scoreType: 'none',
        experimental: true,
      });
      Alert.alert('Error', 'Gagal menganalisis komentar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analisis Sentimen Komentar</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Tuliskan komentar praktikum..."
          value={text}
          onChangeText={setText}
          multiline
          numberOfLines={3}
          autoCapitalize="sentences"
        />
      </View>

      <View style={styles.buttonWrapper}>
        <TouchableOpacity onPress={analyze} disabled={loading}>
          <Text style={styles.buttonText}>Analisis</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultContainer}>
          {result.label !== null ? (
            <Text style={styles.resultLabel}>{result.label}</Text>
          ) : (
            <Text style={styles.resultLabel}>Tidak dapat dianalisis</Text>
          )}
          <Text style={styles.resultStatus}>{result.status}</Text>
          {result.scores && result.scores.length > 0 && (
            <View style={styles.scoresContainer}>
              <Text style={styles.scoresTitle}>Skor:</Text>
              <View style={styles.scoresBar}>
                {result.scores.map((score, i) => (
                  <View
                    key={i}
                    style={[
                      styles.scoreBar,
                      {
                        backgroundColor:
                          result.label !== null &&
                          result.label === model.labels[i]
                            ? '#22C55E'
                            : '#e0e0e0',
                      },
                    ]}
                  >
                    <Text style={styles.scoreText}>
                      {model.labels[i]}: {score.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {loading && <Text style={styles.loading}>Sedang menganalisis...</Text>}

      <Text style={styles.note}>
        Model ini membaca komentar evaluasi dosen/perkuliahan. Validasi data:
        kelas
        {result?.label === 'netral'
          ? 'netral lebih lemah dari positif/negatif'
          : '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#17141F',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 120,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  buttonWrapper: {
    marginVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#17141F',
  },
  resultContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  resultLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#17141F',
    marginBottom: 4,
  },
  resultStatus: {
    fontSize: 14,
    color: '#65394C',
    marginBottom: 8,
  },
  scoresContainer: {
    marginTop: 12,
  },
  scoresTitle: {
    fontSize: 12,
    color: '#65394C',
    marginBottom: 8,
  },
  scoresBar: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreBar: {
    flex: 1,
    height: 20,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreText: {
    fontSize: 11,
    color: '#65394C',
    marginLeft: 4,
    flex: 1,
    textAlign: 'right',
  },
  loading: {
    marginVertical: 16,
    textAlign: 'center',
    color: '#17141F',
  },
  note: {
    marginTop: 12,
    fontSize: 12,
    color: '#65394C',
    textAlign: 'center',
  },
});
