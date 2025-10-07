// ========================================
// PRIVACY POLICY SCREEN - STANDALONE PAGE
// ========================================
// Comprehensive data privacy policy page for Gereu Online Hub
// Accessible via direct navigation and from signin screen

import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

export default function PrivacyPolicyScreen() {
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
        <LinearGradient
          colors={['#00B2FF', '#007BE5', '#002F87']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <View style={styles.headerIcon}>
                <Ionicons name="shield-checkmark" size={24} color="white" />
              </View>
              <View style={styles.headerText}>
                <ThemedText style={styles.headerTitle}>Data Privacy Policy</ThemedText>
                <ThemedText style={styles.headerSubtitle}>Your privacy matters to us</ThemedText>
              </View>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          {/* Last Updated */}
          <View style={[styles.lastUpdatedCard, { backgroundColor: isDark ? '#1E1E1E' : '#F8F9FA' }]}>
            <View style={styles.lastUpdatedContent}>
              <Ionicons name="time" size={16} color="#6B7280" />
              <ThemedText style={[styles.lastUpdatedText, { color: subtitleColor }]}>
                Last updated: December 2024
              </ThemedText>
            </View>
          </View>

          {/* Introduction */}
          <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1E1E1E' : '#F8F9FA' }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colorPalette.primary }]}>
                <Ionicons name="information-circle" size={20} color="white" />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Introduction</ThemedText>
            </View>
            <ThemedText style={[styles.sectionContent, { color: textColor }]}>
              At Gereu Online Hub, we are committed to protecting your privacy and personal information. 
              This Data Privacy Policy explains how we collect, use, store, and protect your information 
              when you use our mobile application and services.
            </ThemedText>
          </View>

          {/* Information We Collect */}
          <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colorPalette.primary }]}>
                <Ionicons name="folder" size={20} color="white" />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Information We Collect</ThemedText>
            </View>
            
            <View style={styles.subsection}>
              <ThemedText style={[styles.subsectionTitle, { color: textColor }]}>Personal Information</ThemedText>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Ionicons name="person" size={16} color={colorPalette.primary} />
                  <ThemedText style={[styles.bulletText, { color: textColor }]}>
                    Name and contact information (email, phone number)
                  </ThemedText>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="home" size={16} color={colorPalette.primary} />
                  <ThemedText style={[styles.bulletText, { color: textColor }]}>
                    Apartment/room number within Gereu Building
                  </ThemedText>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="card" size={16} color={colorPalette.primary} />
                  <ThemedText style={[styles.bulletText, { color: textColor }]}>
                    Payment information (processed securely through GCash)
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.subsection}>
              <ThemedText style={[styles.subsectionTitle, { color: textColor }]}>Usage Information</ThemedText>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Ionicons name="analytics" size={16} color={colorPalette.primary} />
                  <ThemedText style={[styles.bulletText, { color: textColor }]}>
                    App usage patterns and preferences
                  </ThemedText>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="calendar" size={16} color={colorPalette.primary} />
                  <ThemedText style={[styles.bulletText, { color: textColor }]}>
                    Booking history and service requests
                  </ThemedText>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="chatbubbles" size={16} color={colorPalette.primary} />
                  <ThemedText style={[styles.bulletText, { color: textColor }]}>
                    Communication logs with support staff
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.subsection}>
              <ThemedText style={[styles.subsectionTitle, { color: textColor }]}>Device Information</ThemedText>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Ionicons name="phone-portrait" size={16} color={colorPalette.primary} />
                  <ThemedText style={[styles.bulletText, { color: textColor }]}>
                    Device type and operating system
                  </ThemedText>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="location" size={16} color={colorPalette.primary} />
                  <ThemedText style={[styles.bulletText, { color: textColor }]}>
                    General location (for service delivery within Gereu Building)
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* How We Use Your Information */}
          <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colorPalette.primary }]}>
                <Ionicons name="settings" size={20} color="white" />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>How We Use Your Information</ThemedText>
            </View>
            
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle" size={16} color={colorPalette.primary} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Process and manage your service bookings (apartments, laundry, auto services)
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="notifications" size={16} color={colorPalette.primary} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Send booking confirmations, reminders, and service updates
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="card" size={16} color={colorPalette.primary} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Process payments and provide payment tracking
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="chatbubbles" size={16} color={colorPalette.primary} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Provide customer support and respond to inquiries
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="trending-up" size={16} color={colorPalette.primary} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Improve our services and app functionality
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="shield" size={16} color={colorPalette.primary} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Ensure security and prevent fraud
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Data Security */}
          <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colorPalette.primary }]}>
                <Ionicons name="lock-closed" size={20} color="white" />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Data Security</ThemedText>
            </View>
            <ThemedText style={[styles.sectionContent, { color: textColor }]}>
              We implement industry-standard security measures to protect your personal information:
            </ThemedText>
            
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Ionicons name="lock-closed" size={16} color={colorPalette.primary} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  End-to-end encryption for all data transmission
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="server" size={16} color={colorPalette.primary} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Secure cloud storage with Firebase security
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="key" size={16} color={colorPalette.primary} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Regular security audits and updates
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="people" size={16} color={colorPalette.primary} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Limited access to authorized personnel only
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Your Rights */}
          <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colorPalette.primary }]}>
                <Ionicons name="hand-right" size={20} color="white" />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Your Rights</ThemedText>
            </View>
            <ThemedText style={[styles.sectionContent, { color: textColor }]}>
              You have the following rights regarding your personal information:
            </ThemedText>
            
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Ionicons name="eye" size={16} color={colorPalette.primary} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Access your personal data
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="create" size={16} color={colorPalette.primary} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Correct inaccurate information
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="trash" size={16} color={colorPalette.primary} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Request deletion of your data
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="download" size={16} color={colorPalette.primary} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Export your data in a portable format
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="stop" size={16} color={colorPalette.primary} />
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Withdraw consent for data processing
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Contact Information */}
          <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colorPalette.primary }]}>
                <Ionicons name="mail" size={20} color="white" />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Contact Us</ThemedText>
            </View>
            <ThemedText style={[styles.sectionContent, { color: textColor }]}>
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </ThemedText>
            
            <View style={styles.contactInfo}>
              <View style={styles.contactItem}>
                <Ionicons name="mail" size={16} color={colorPalette.primary} />
                <ThemedText style={[styles.contactText, { color: textColor }]}>
                  privacy@gereuonlinehub.com
                </ThemedText>
              </View>
              <View style={styles.contactItem}>
                <Ionicons name="location" size={16} color={colorPalette.primary} />
                <ThemedText style={[styles.contactText, { color: textColor }]}>
                  Gereu Building, Philippines
                </ThemedText>
              </View>
              <View style={styles.contactItem}>
                <Ionicons name="chatbubbles" size={16} color={colorPalette.primary} />
                <ThemedText style={[styles.contactText, { color: textColor }]}>
                  In-app messaging support
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Changes to Policy */}
          <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colorPalette.primary }]}>
                <Ionicons name="refresh" size={20} color="white" />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Changes to This Policy</ThemedText>
            </View>
            <ThemedText style={[styles.sectionContent, { color: textColor }]}>
              We may update this Privacy Policy from time to time. We will notify you of any 
              significant changes through the app or via email. Your continued use of our services 
              after such changes constitutes acceptance of the updated policy.
            </ThemedText>
          </View>

          {/* Footer */}
          <View style={[styles.footerCard, { backgroundColor: isDark ? '#1E1E1E' : '#F8F9FA' }]}>
            <Ionicons name="shield-checkmark" size={24} color={colorPalette.primary} />
            <ThemedText style={[styles.footerText, { color: textColor }]}>
              Your privacy and data security are our top priorities. We are committed to 
              protecting your information and being transparent about our practices.
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  lastUpdatedCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  lastUpdatedContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastUpdatedText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  sectionCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  subsection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  bulletList: {
    marginVertical: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  contactInfo: {
    marginTop: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    marginLeft: 8,
  },
  footerCard: {
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    textAlign: 'center',
  },
});
