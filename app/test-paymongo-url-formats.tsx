// ========================================
// PAYMONGO URL FORMATS TEST
// ========================================
// Test different PayMongo URL formats to find the working one
// I-test ang different URL patterns

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function PayMongoURLFormatsTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const addResult = (message: string) => {
    setResult(prev => prev + message + '\n');
  };

  const clearResults = () => {
    setResult('');
  };

  // ========================================
  // TEST DIFFERENT URL FORMATS
  // ========================================
  const testURLFormats = async () => {
    try {
      setLoading(true);
      addResult('🔄 Testing Different PayMongo URL Formats');
      addResult('=====================================');
      addResult('Testing various URL patterns to find the working one...');
      addResult('');
      
      const sourceId = 'src_qHXDVnPKenvgcjba6MkPTGN6'; // From your logs
      
      const urlFormats = [
        {
          name: 'Current Format (Not Working)',
          url: `https://paymongo.com/sources/${sourceId}`,
          description: 'This is what you\'re currently using'
        },
        {
          name: 'Checkout Format 1',
          url: `https://checkout.paymongo.com/sources/${sourceId}`,
          description: 'Standard checkout format'
        },
        {
          name: 'Checkout Format 2',
          url: `https://checkout.paymongo.com/${sourceId}`,
          description: 'Alternative checkout format'
        },
        {
          name: 'PayMongo Checkout',
          url: `https://paymongo.com/checkout/${sourceId}`,
          description: 'PayMongo checkout format'
        },
        {
          name: 'Secure Authentication',
          url: `https://secure-authentication.paymongo.com/sources/${sourceId}`,
          description: 'Secure authentication format'
        },
        {
          name: 'PayMongo Web',
          url: `https://web.paymongo.com/sources/${sourceId}`,
          description: 'PayMongo web format'
        }
      ];
      
      addResult('📋 Testing URL Formats:');
      addResult('');
      
      for (const format of urlFormats) {
        addResult(`🔍 ${format.name}:`);
        addResult(`   URL: ${format.url}`);
        addResult(`   Description: ${format.description}`);
        addResult('');
      }
      
      addResult('💡 Instructions:');
      addResult('1. Click "Test URLs" to open each URL');
      addResult('2. Check which ones work in your browser');
      addResult('3. Report back which format works');
      addResult('4. We\'ll update the code with the working format');
      
    } catch (error) {
      addResult(`❌ Test error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // TEST SPECIFIC URL
  // ========================================
  const testSpecificURL = async (url: string, name: string) => {
    try {
      addResult(`🔄 Testing ${name}...`);
      addResult(`URL: ${url}`);
      
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        addResult(`✅ ${name} opened successfully`);
      } else {
        addResult(`❌ ${name} cannot be opened`);
      }
    } catch (error) {
      addResult(`❌ Error testing ${name}: ${error}`);
    }
  };

  // ========================================
  // TEST ALL URLS
  // ========================================
  const testAllURLs = async () => {
    const sourceId = 'src_qHXDVnPKenvgcjba6MkPTGN6';
    
    const urls = [
      { url: `https://paymongo.com/sources/${sourceId}`, name: 'Current Format' },
      { url: `https://checkout.paymongo.com/sources/${sourceId}`, name: 'Checkout Format 1' },
      { url: `https://checkout.paymongo.com/${sourceId}`, name: 'Checkout Format 2' },
      { url: `https://paymongo.com/checkout/${sourceId}`, name: 'PayMongo Checkout' },
      { url: `https://secure-authentication.paymongo.com/sources/${sourceId}`, name: 'Secure Auth' },
      { url: `https://web.paymongo.com/sources/${sourceId}`, name: 'PayMongo Web' }
    ];
    
    for (const urlInfo of urls) {
      await testSpecificURL(urlInfo.url, urlInfo.name);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
    }
  };

  // ========================================
  // SHOW SOLUTION
  // ========================================
  const showSolution = () => {
    Alert.alert(
      'URL Format Solution',
      'The issue is that PayMongo sources need the correct URL format.\n\n' +
      'Common working formats:\n' +
      '• https://checkout.paymongo.com/sources/{id}\n' +
      '• https://secure-authentication.paymongo.com/sources/{id}\n\n' +
      'Test the URLs above to find which one works, then we\'ll update the code!',
      [
        { text: 'Got it!', style: 'default' }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedText style={styles.title}>PayMongo URL Formats Test</ThemedText>
        <ThemedText style={styles.subtitle}>
          Test different URL formats to find the working one
        </ThemedText>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={testURLFormats}
            disabled={loading}
          >
            <MaterialIcons name="list" size={24} color="white" />
            <ThemedText style={styles.buttonText}>
              {loading ? 'Testing...' : 'Show URL Formats'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={testAllURLs}
          >
            <MaterialIcons name="open-in-browser" size={24} color="white" />
            <ThemedText style={styles.buttonText}>Test All URLs</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={showSolution}
          >
            <MaterialIcons name="info" size={24} color="white" />
            <ThemedText style={styles.buttonText}>Show Solution</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearResults}
          >
            <MaterialIcons name="clear" size={24} color="white" />
            <ThemedText style={styles.buttonText}>Clear Results</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.resultContainer}>
          <ThemedText style={styles.resultTitle}>Test Results:</ThemedText>
          <ScrollView style={styles.resultScrollView}>
            <ThemedText style={styles.resultText}>{result || 'No results yet. Click "Show URL Formats" to start.'}</ThemedText>
          </ScrollView>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.7,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  infoButton: {
    backgroundColor: '#FF9500',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 15,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultScrollView: {
    flex: 1,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});
