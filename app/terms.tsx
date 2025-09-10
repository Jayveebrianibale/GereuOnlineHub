import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const colorPalette = {
  lightest: '#C3F5FF',
  light: '#7FE6FF',
  primaryLight: '#4AD0FF',
  primary: '#00B2FF',
  primaryDark: '#007BE5',
  dark: '#0051C1',
  darker: '#002F87',
  darkest: '#001A5C',
};

export default function TermsScreen() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#121212' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false 
        }} 
      />
      <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Custom Header with Back Button */}
        <View style={[styles.customHeader, { backgroundColor: isDark ? '#1E1E1E' : '#F8F9FA' }]}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: isDark ? '#2A2A2A' : '#fff' }]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colorPalette.primary} />
          </TouchableOpacity>
          <ThemedText type="subtitle" style={[styles.headerTitle, { color: textColor }]}>
            Terms of Service
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {/* Header Section */}
        <View style={[styles.headerCard, { backgroundColor: isDark ? '#1E1E1E' : '#F8F9FA' }]}>
          <View style={styles.headerIcon}>
            <MaterialIcons name="gavel" size={32} color={colorPalette.primary} />
          </View>
          <ThemedText style={[styles.updated, { color: subtitleColor }]}>
            Last updated: September 2025
          </ThemedText>
        </View>

        {/* Introduction */}
        <View style={[styles.introCard, { backgroundColor: isDark ? '#1E1E1E' : '#F8F9FA' }]}>
          <ThemedText style={[styles.introText, { color: textColor }]}>
            Welcome to Gereu Online Hub. These terms govern your use of our mobile application and services. Please read them carefully.
          </ThemedText>
        </View>

        {/* Terms Sections */}
        <View style={styles.termsContainer}>
          {/* Section 1 */}
          <View style={[styles.termCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.termHeader}>
              <View style={[styles.termNumber, { backgroundColor: colorPalette.primary }]}>
                <ThemedText style={styles.termNumberText}>1</ThemedText>
              </View>
              <ThemedText type="subtitle" style={[styles.termTitle, { color: textColor }]}>
                Acceptance of Terms
              </ThemedText>
            </View>
            <ThemedText style={[styles.termContent, { color: textColor }]}>
              By downloading, installing, or using the Gereu Online Hub mobile application ("App"), you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use the App.
            </ThemedText>
          </View>

          {/* Section 2 */}
          <View style={[styles.termCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.termHeader}>
              <View style={[styles.termNumber, { backgroundColor: colorPalette.primary }]}>
                <ThemedText style={styles.termNumberText}>2</ThemedText>
              </View>
              <ThemedText type="subtitle" style={[styles.termTitle, { color: textColor }]}>
                Description of Service
              </ThemedText>
            </View>
            <ThemedText style={[styles.termContent, { color: textColor }]}>
              Gereu Online Hub is a centralized mobile platform designed for tenants, business owners, and customers of the Gereu Building. The App provides access to:
            </ThemedText>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <MaterialIcons name="apartment" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Apartment Rentals and Lodging information
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="local-laundry-service" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Laundry Services (with booking and notifications)
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="directions-car" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Car and Motor Parts services
                </ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.termContent, { color: textColor }]}>
              The App serves only as an information and booking platform. All payments and service transactions are completed in person at the respective business locations.
            </ThemedText>
          </View>

          {/* Section 3 */}
          <View style={[styles.termCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.termHeader}>
              <View style={[styles.termNumber, { backgroundColor: colorPalette.primary }]}>
                <ThemedText style={styles.termNumberText}>3</ThemedText>
              </View>
              <ThemedText type="subtitle" style={[styles.termTitle, { color: textColor }]}>
                User Accounts
              </ThemedText>
            </View>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <MaterialIcons name="person-add" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Users must create an account to access certain features
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="verified-user" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  You agree to provide accurate, complete, and updated information
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="lock" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  You are responsible for maintaining the confidentiality of your account and password
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Section 4 */}
          <View style={[styles.termCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.termHeader}>
              <View style={[styles.termNumber, { backgroundColor: colorPalette.primary }]}>
                <ThemedText style={styles.termNumberText}>4</ThemedText>
              </View>
              <ThemedText type="subtitle" style={[styles.termTitle, { color: textColor }]}>
                Limitations of Use
              </ThemedText>
            </View>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <MaterialIcons name="location-on" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  The App is available only for services inside the Gereu Building
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="payment" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  The App does not support online or digital payments
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="wifi" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  The App requires a stable internet connection; offline use is not supported
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="info" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Service availability, prices, and details are managed by individual business owners and may change without prior notice
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Section 5 */}
          <View style={[styles.termCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.termHeader}>
              <View style={[styles.termNumber, { backgroundColor: colorPalette.primary }]}>
                <ThemedText style={styles.termNumberText}>5</ThemedText>
              </View>
              <ThemedText type="subtitle" style={[styles.termTitle, { color: textColor }]}>
                Responsibilities of Users
              </ThemedText>
            </View>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <MaterialIcons name="gavel" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Users must use the App in a lawful and respectful manner
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="warning" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Any misuse of the App, such as providing false information, attempting unauthorized access, or disrupting operations, may result in account suspension or termination
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Section 6 */}
          <View style={[styles.termCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.termHeader}>
              <View style={[styles.termNumber, { backgroundColor: colorPalette.primary }]}>
                <ThemedText style={styles.termNumberText}>6</ThemedText>
              </View>
              <ThemedText type="subtitle" style={[styles.termTitle, { color: textColor }]}>
                Responsibilities of Business Owners
              </ThemedText>
            </View>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <MaterialIcons name="business" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Business owners are responsible for keeping their service listings, pricing, and availability updated
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="shield" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Gereu Online Hub is not liable for inaccurate or outdated information provided by business owners
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Section 7 */}
          <View style={[styles.termCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.termHeader}>
              <View style={[styles.termNumber, { backgroundColor: colorPalette.primary }]}>
                <ThemedText style={styles.termNumberText}>7</ThemedText>
              </View>
              <ThemedText type="subtitle" style={[styles.termTitle, { color: textColor }]}>
                Privacy and Data
              </ThemedText>
            </View>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <MaterialIcons name="data-usage" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  The App collects only necessary information such as name, contact details, and booking records
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="security" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  User data is stored securely in Firebase and will not be shared with third parties without consent, unless required by law
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Section 8 */}
          <View style={[styles.termCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.termHeader}>
              <View style={[styles.termNumber, { backgroundColor: colorPalette.primary }]}>
                <ThemedText style={styles.termNumberText}>8</ThemedText>
              </View>
              <ThemedText type="subtitle" style={[styles.termTitle, { color: textColor }]}>
                Disclaimer of Warranties
              </ThemedText>
            </View>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <MaterialIcons name="info-outline" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  The App is provided "as is" and "as available"
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="warning" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  We do not guarantee uninterrupted access, error-free operation, or absolute accuracy of information
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Section 9 */}
          <View style={[styles.termCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.termHeader}>
              <View style={[styles.termNumber, { backgroundColor: colorPalette.primary }]}>
                <ThemedText style={styles.termNumberText}>9</ThemedText>
              </View>
              <ThemedText type="subtitle" style={[styles.termTitle, { color: textColor }]}>
                Limitation of Liability
              </ThemedText>
            </View>
            <ThemedText style={[styles.termContent, { color: textColor }]}>
              Gereu Online Hub and its developers shall not be held liable for:
            </ThemedText>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <MaterialIcons name="money-off" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Any damages, delays, or losses resulting from the use of the App
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="people" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Disputes between customers and business owners regarding services, payments, or quality
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Section 10 */}
          <View style={[styles.termCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.termHeader}>
              <View style={[styles.termNumber, { backgroundColor: colorPalette.primary }]}>
                <ThemedText style={styles.termNumberText}>10</ThemedText>
              </View>
              <ThemedText type="subtitle" style={[styles.termTitle, { color: textColor }]}>
                Modification of Terms
              </ThemedText>
            </View>
            <ThemedText style={[styles.termContent, { color: textColor }]}>
              We may update or modify these Terms of Service at any time. Users will be notified of significant changes within the App. Continued use of the App means acceptance of the updated terms.
            </ThemedText>
          </View>

          {/* Section 11 */}
          <View style={[styles.termCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.termHeader}>
              <View style={[styles.termNumber, { backgroundColor: colorPalette.primary }]}>
                <ThemedText style={styles.termNumberText}>11</ThemedText>
              </View>
              <ThemedText type="subtitle" style={[styles.termTitle, { color: textColor }]}>
                Governing Law
              </ThemedText>
            </View>
            <ThemedText style={[styles.termContent, { color: textColor }]}>
              These Terms shall be governed by and construed in accordance with the laws of the Philippines.
            </ThemedText>
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.footerCard, { backgroundColor: isDark ? '#1E1E1E' : '#F8F9FA' }]}>
          <MaterialIcons name="contact-support" size={24} color={colorPalette.primary} />
          <ThemedText style={[styles.footerText, { color: textColor }]}>
            Questions about these terms? Contact our support team.
          </ThemedText>
        </View>
      </ScrollView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Custom Header Styles
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50, // Account for status bar
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  // Header Styles
  headerCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 178, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  updated: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
  // Introduction Styles
  introCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Terms Container
  termsContainer: {
    gap: 16,
  },
  // Term Card Styles
  termCard: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  termNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  termNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  termTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  termContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  // Bullet List Styles
  bulletList: {
    marginVertical: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  // Footer Styles
  footerCard: {
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  footerText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    textAlign: 'center',
  },
});
