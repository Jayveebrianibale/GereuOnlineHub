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
            Welcome to Gereu Online Hub - your comprehensive platform for property management, apartment rentals, laundry services, and automotive solutions. These Terms of Service govern your use of our mobile application and services. By using our app, you agree to be bound by these terms.
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
                Services Provided
              </ThemedText>
            </View>
            <ThemedText style={[styles.termContent, { color: textColor }]}>
              Gereu Online Hub provides a comprehensive platform for:
            </ThemedText>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <MaterialIcons name="apartment" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  <ThemedText style={[styles.bulletText, { color: textColor, fontWeight: '600' }]}>Property Management:</ThemedText> Apartment listings, rental information, availability checking, and booking management
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="local-laundry-service" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  <ThemedText style={[styles.bulletText, { color: textColor, fontWeight: '600' }]}>Laundry Services:</ThemedText> Service booking, status tracking, pickup/delivery scheduling, and notifications
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="directions-car" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  <ThemedText style={[styles.bulletText, { color: textColor, fontWeight: '600' }]}>Automotive Services:</ThemedText> Auto parts catalog, service booking, maintenance scheduling, and repair services
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="chat" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  <ThemedText style={[styles.bulletText, { color: textColor, fontWeight: '600' }]}>Customer Support:</ThemedText> Real-time messaging with admin support, booking assistance, and service inquiries
                </ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.termContent, { color: textColor }]}>
              <ThemedText style={[styles.termContent, { color: textColor, fontWeight: '600' }]}>Payment Policy:</ThemedText> All payments are processed in person at our business location. The app serves as an information and booking platform only. No online payments are processed through the application.
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
                  Create an account to book services and receive notifications
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="verified-user" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Provide accurate contact information for booking confirmations
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="lock" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Keep your login credentials secure and private
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
                App Limitations
              </ThemedText>
            </View>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <MaterialIcons name="payment" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  No online payments - all payments are made in person
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="wifi" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Internet connection required to use the app
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="info" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Service prices and availability may change without notice
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
                User Responsibilities
              </ThemedText>
            </View>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <MaterialIcons name="gavel" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Use the app responsibly and follow booking policies
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="warning" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Provide accurate information when making bookings
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
                Privacy & Data
              </ThemedText>
            </View>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <MaterialIcons name="data-usage" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  We collect only necessary information for bookings and notifications
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="security" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Your data is stored securely and not shared with third parties
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
                App Disclaimer
              </ThemedText>
            </View>
            <ThemedText style={[styles.termContent, { color: textColor }]}>
              The app is provided "as is". We do not guarantee uninterrupted access or error-free operation. Gereu Online Hub is not liable for any issues with services or payments between users and business owners.
            </ThemedText>
          </View>

          {/* Section 8 */}
          <View style={[styles.termCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.termHeader}>
              <View style={[styles.termNumber, { backgroundColor: colorPalette.primary }]}>
                <ThemedText style={styles.termNumberText}>8</ThemedText>
              </View>
              <ThemedText type="subtitle" style={[styles.termTitle, { color: textColor }]}>
                Booking & Cancellation Policies
              </ThemedText>
            </View>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <MaterialIcons name="schedule" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  <ThemedText style={[styles.bulletText, { color: textColor, fontWeight: '600' }]}>Apartment Rentals:</ThemedText> Bookings are subject to availability and require confirmation. Cancellation must be made 24 hours in advance.
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="local-laundry-service" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  <ThemedText style={[styles.bulletText, { color: textColor, fontWeight: '600' }]}>Laundry Services:</ThemedText> Service slots are limited. Same-day cancellations may incur charges. Pickup times are estimates.
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="directions-car" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  <ThemedText style={[styles.bulletText, { color: textColor, fontWeight: '600' }]}>Auto Services:</ThemedText> Appointments are required for major services. Parts availability may affect service timelines.
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
                Prohibited Activities
              </ThemedText>
            </View>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <MaterialIcons name="block" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Misuse of the app for fraudulent or illegal activities
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="block" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Attempting to reverse engineer or modify the application
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="block" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Harassment or inappropriate communication with staff or other users
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <MaterialIcons name="block" size={16} color={colorPalette.primary} style={styles.bulletIcon} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Creating multiple accounts to circumvent booking restrictions
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
                Intellectual Property
              </ThemedText>
            </View>
            <ThemedText style={[styles.termContent, { color: textColor }]}>
              All content, features, and functionality of the Gereu Online Hub app, including but not limited to text, graphics, logos, images, and software, are owned by Gereu Online Hub and are protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without written permission.
            </ThemedText>
          </View>

          {/* Section 11 */}
          <View style={[styles.termCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.termHeader}>
              <View style={[styles.termNumber, { backgroundColor: colorPalette.primary }]}>
                <ThemedText style={styles.termNumberText}>11</ThemedText>
              </View>
              <ThemedText type="subtitle" style={[styles.termTitle, { color: textColor }]}>
                Limitation of Liability
              </ThemedText>
            </View>
            <ThemedText style={[styles.termContent, { color: textColor }]}>
              To the maximum extent permitted by law, Gereu Online Hub shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use, arising out of or relating to your use of the app or services. Our total liability shall not exceed the amount you paid for the app (if any).
            </ThemedText>
          </View>

          {/* Section 12 */}
          <View style={[styles.termCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.termHeader}>
              <View style={[styles.termNumber, { backgroundColor: colorPalette.primary }]}>
                <ThemedText style={styles.termNumberText}>12</ThemedText>
              </View>
              <ThemedText type="subtitle" style={[styles.termTitle, { color: textColor }]}>
                Changes to Terms
              </ThemedText>
            </View>
            <ThemedText style={[styles.termContent, { color: textColor }]}>
              We reserve the right to modify these Terms of Service at any time. We will notify users of significant changes through the app or via email. Your continued use of the app after such modifications constitutes acceptance of the updated terms. If you do not agree to the changes, you must stop using the app.
            </ThemedText>
          </View>

          {/* Section 13 */}
          <View style={[styles.termCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.termHeader}>
              <View style={[styles.termNumber, { backgroundColor: colorPalette.primary }]}>
                <ThemedText style={styles.termNumberText}>13</ThemedText>
              </View>
              <ThemedText type="subtitle" style={[styles.termTitle, { color: textColor }]}>
                Governing Law & Dispute Resolution
              </ThemedText>
            </View>
            <ThemedText style={[styles.termContent, { color: textColor }]}>
              These Terms of Service shall be governed by and construed in accordance with the laws of the Philippines. Any disputes arising from these terms or your use of the app shall be resolved through binding arbitration in accordance with the rules of the Philippine Dispute Resolution Center, Inc.
            </ThemedText>
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.footerCard, { backgroundColor: isDark ? '#1E1E1E' : '#F8F9FA' }]}>
          <MaterialIcons name="contact-support" size={24} color={colorPalette.primary} />
          <ThemedText style={[styles.footerText, { color: textColor }]}>
            Questions about these terms? Contact our support team through the in-app messaging system or visit our business location for assistance.
          </ThemedText>
        </View>

        {/* Contact Information */}
        <View style={[styles.contactCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
          <View style={styles.contactHeader}>
            <MaterialIcons name="business" size={20} color={colorPalette.primary} />
            <ThemedText type="subtitle" style={[styles.contactTitle, { color: textColor }]}>
              Gereu Online Hub
            </ThemedText>
          </View>
          <ThemedText style={[styles.contactText, { color: textColor }]}>
            Property Management & Services Platform
          </ThemedText>
          <ThemedText style={[styles.contactText, { color: subtitleColor }]}>
            Last Updated: September 2025
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
  // Contact Card Styles
  contactCard: {
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  contactText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
});
