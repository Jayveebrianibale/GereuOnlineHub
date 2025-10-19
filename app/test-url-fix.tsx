// ========================================
// URL FIX TEST - PAMAMAHALA NG URL FIX TESTING
// ========================================
// Test ng URL transformation para sa PayMongo checkout URLs
// I-verify kung working ang URL fix

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function URLFixTest() {
  const [result, setResult] = useState<string>('');

  const testURLTransformation = () => {
    setResult('🔄 Testing URL transformation...\n\n');
    
    // I-test ang different URL formats
    const testUrls = [
      'https://secure-authentication.paymongo.com/sources?id=src_AX2jJbfKojvQFvxh1xCxhPtV',
      'https://paymongo.com/sources/src_AX2jJbfKojvQFvxh1xCxhPtV',
      'https://secure-authentication.paymongo.com/sources?id=src_123456789',
      'https://paymongo.com/sources/src_123456789'
    ];
    
    testUrls.forEach((url, index) => {
      setResult(prev => prev + `Test ${index + 1}:\n`);
      setResult(prev => prev + `Original: ${url}\n`);
      
      // I-apply ang same transformation logic
      let transformedUrl = url;
      if (url.includes('secure-authentication.paymongo.com')) {
        const sourceIdMatch = url.match(/[?&]id=([^&]+)/);
        if (sourceIdMatch && sourceIdMatch[1]) {
          transformedUrl = `https://paymongo.com/sources/${sourceIdMatch[1]}`;
        } else {
          transformedUrl = url.replace('secure-authentication.paymongo.com', 'paymongo.com');
        }
      }
      
      setResult(prev => prev + `Transformed: ${transformedUrl}\n`);
      setResult(prev => prev + `Valid: ${transformedUrl.includes('paymongo.com/sources/') ? '✅' : '❌'}\n\n`);
    });
    
    setResult(prev => prev + `🎯 URL transformation test completed!\n`);
  };

  const clearResults = () => {
    setResult('');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="link" size={32} color="#00B2FF" />
        <ThemedText type="title" style={styles.title}>
          URL Fix Test
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Test PayMongo URL transformation
        </ThemedText>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#00B2FF' }]}
          onPress={testURLTransformation}
        >
          <MaterialIcons name="play-arrow" size={20} color="#fff" />
          <ThemedText style={styles.buttonText}>
            Test URL Transformation
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#6B7280' }]}
          onPress={clearResults}
        >
          <MaterialIcons name="clear" size={20} color="#fff" />
          <ThemedText style={styles.buttonText}>
            Clear Results
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultContainer}>
        <ThemedText style={styles.resultTitle}>Test Results:</ThemedText>
        <ThemedText style={styles.resultText}>
          {result || 'Click "Test URL Transformation" to start...'}
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
});
