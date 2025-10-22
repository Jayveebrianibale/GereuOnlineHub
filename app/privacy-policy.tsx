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
  const bgColor = '#fff';
  const textColor = colorPalette.darkest;
  const subtitleColor = colorPalette.dark;

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
          {/* Hero Section */}
          <View style={[styles.heroSection, { backgroundColor: '#F8FAFC' }]}>
            <View style={styles.heroContent}>
              <View style={styles.heroIcon}>
                <Ionicons name="shield-checkmark" size={32} color="#00B2FF" />
              </View>
              <ThemedText style={[styles.heroTitle, { color: textColor }]}>
                Privacy Policy
              </ThemedText>
              <ThemedText style={[styles.heroSubtitle, { color: subtitleColor }]}>
                Your privacy and data security are our top priorities
              </ThemedText>
              <View style={styles.lastUpdatedBadge}>
                <Ionicons name="time" size={14} color="#6B7280" />
                <ThemedText style={styles.lastUpdatedText}>
                  Last updated: October 2025
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Introduction */}
          <View style={[styles.sectionCard, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#00B2FF' }]}>
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
          <View style={[styles.sectionCard, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#10B981' }]}>
                <Ionicons name="folder" size={20} color="white" />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Information We Collect</ThemedText>
            </View>
            
            <View style={styles.subsection}>
              <ThemedText style={[styles.subsectionTitle, { color: textColor }]}>Personal Information</ThemedText>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletIcon}>
                    <Ionicons name="person" size={14} color="#10B981" />
                  </View>
                  <ThemedText style={[styles.bulletText, { color: textColor }]}>
                    Name and contact information (email, phone number)
                  </ThemedText>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletIcon}>
                    <Ionicons name="home" size={14} color="#10B981" />
                  </View>
                  <ThemedText style={[styles.bulletText, { color: textColor }]}>
                    Apartment/room number within Gereu Building
                  </ThemedText>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletIcon}>
                    <Ionicons name="card" size={14} color="#10B981" />
                  </View>
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
                  <View style={styles.bulletIcon}>
                    <Ionicons name="analytics" size={14} color="#10B981" />
                  </View>
                  <ThemedText style={[styles.bulletText, { color: textColor }]}>
                    App usage patterns and preferences
                  </ThemedText>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletIcon}>
                    <Ionicons name="calendar" size={14} color="#10B981" />
                  </View>
                  <ThemedText style={[styles.bulletText, { color: textColor }]}>
                    Booking history and service requests
                  </ThemedText>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletIcon}>
                    <Ionicons name="chatbubbles" size={14} color="#10B981" />
                  </View>
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
                  <View style={styles.bulletIcon}>
                    <Ionicons name="phone-portrait" size={14} color="#10B981" />
                  </View>
                  <ThemedText style={[styles.bulletText, { color: textColor }]}>
                    Device type and operating system
                  </ThemedText>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletIcon}>
                    <Ionicons name="location" size={14} color="#10B981" />
                  </View>
                  <ThemedText style={[styles.bulletText, { color: textColor }]}>
                    General location (for service delivery within Gereu Building)
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* How We Use Your Information */}
          <View style={[styles.sectionCard, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#8B5CF6' }]}>
                <Ionicons name="settings" size={20} color="white" />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>How We Use Your Information</ThemedText>
            </View>
            
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.bulletIcon}>
                  <Ionicons name="checkmark-circle" size={14} color="#8B5CF6" />
                </View>
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Process and manage your service bookings (apartments, laundry, auto services)
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bulletIcon}>
                  <Ionicons name="notifications" size={14} color="#8B5CF6" />
                </View>
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Send booking confirmations, reminders, and service updates
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bulletIcon}>
                  <Ionicons name="card" size={14} color="#8B5CF6" />
                </View>
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Process payments and provide payment tracking
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bulletIcon}>
                  <Ionicons name="chatbubbles" size={14} color="#8B5CF6" />
                </View>
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Provide customer support and respond to inquiries
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bulletIcon}>
                  <Ionicons name="trending-up" size={14} color="#8B5CF6" />
                </View>
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Improve our services and app functionality
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bulletIcon}>
                  <Ionicons name="shield" size={14} color="#8B5CF6" />
                </View>
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Ensure security and prevent fraud
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Data Security */}
          <View style={[styles.sectionCard, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="lock-closed" size={20} color="white" />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Data Security</ThemedText>
            </View>
            <ThemedText style={[styles.sectionContent, { color: textColor }]}>
              We implement industry-standard security measures to protect your personal information:
            </ThemedText>
            
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={[styles.bulletIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                  <Ionicons name="lock-closed" size={14} color="#F59E0B" />
                </View>
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  End-to-end encryption for all data transmission
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <View style={[styles.bulletIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                  <Ionicons name="server" size={14} color="#F59E0B" />
                </View>
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Secure cloud storage with Firebase security
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <View style={[styles.bulletIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                  <Ionicons name="key" size={14} color="#F59E0B" />
                </View>
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Regular security audits and updates
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <View style={[styles.bulletIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                  <Ionicons name="people" size={14} color="#F59E0B" />
                </View>
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Limited access to authorized personnel only
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Your Rights */}
          <View style={[styles.sectionCard, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#8B5CF6' }]}>
                <Ionicons name="hand-right" size={20} color="white" />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Your Rights</ThemedText>
            </View>
            <ThemedText style={[styles.sectionContent, { color: textColor }]}>
              You have the following rights regarding your personal information:
            </ThemedText>
            
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={[styles.bulletIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                  <Ionicons name="eye" size={14} color="#8B5CF6" />
                </View>
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Access your personal data
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <View style={[styles.bulletIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                  <Ionicons name="create" size={14} color="#8B5CF6" />
                </View>
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Correct inaccurate information
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <View style={[styles.bulletIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                  <Ionicons name="trash" size={14} color="#8B5CF6" />
                </View>
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Request deletion of your data
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <View style={[styles.bulletIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                  <Ionicons name="download" size={14} color="#8B5CF6" />
                </View>
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Export your data in a portable format
                </ThemedText>
              </View>
              <View style={styles.bulletItem}>
                <View style={[styles.bulletIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                  <Ionicons name="stop" size={14} color="#8B5CF6" />
                </View>
                <ThemedText style={[styles.bulletText, { color: textColor }]}>
                  Withdraw consent for data processing
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Contact Information */}
          <View style={[styles.sectionCard, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#00B2FF' }]}>
                <Ionicons name="mail" size={20} color="white" />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Contact Us</ThemedText>
            </View>
            <ThemedText style={[styles.sectionContent, { color: textColor }]}>
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </ThemedText>
            
            <View style={styles.contactInfo}>
              <View style={styles.contactItem}>
                <View style={[styles.bulletIcon, { backgroundColor: 'rgba(0, 178, 255, 0.1)' }]}>
                  <Ionicons name="mail" size={14} color="#00B2FF" />
                </View>
                <ThemedText style={[styles.contactText, { color: textColor }]}>
                  privacy@gereuonlinehub.com
                </ThemedText>
              </View>
              <View style={styles.contactItem}>
                <View style={[styles.bulletIcon, { backgroundColor: 'rgba(0, 178, 255, 0.1)' }]}>
                  <Ionicons name="location" size={14} color="#00B2FF" />
                </View>
                <ThemedText style={[styles.contactText, { color: textColor }]}>
                  Gereu Building, Philippines
                </ThemedText>
              </View>
              <View style={styles.contactItem}>
                <View style={[styles.bulletIcon, { backgroundColor: 'rgba(0, 178, 255, 0.1)' }]}>
                  <Ionicons name="chatbubbles" size={14} color="#00B2FF" />
                </View>
                <ThemedText style={[styles.contactText, { color: textColor }]}>
                  In-app messaging support
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Changes to Policy */}
          <View style={[styles.sectionCard, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#6B7280' }]}>
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
          <View style={[styles.footerCard, { backgroundColor: '#F8FAFC' }]}>
            <Ionicons name="shield-checkmark" size={24} color="#00B2FF" />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    padding: 20,
    paddingBottom: 40,
  },
  // Hero Section
  heroSection: {
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 178, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  lastUpdatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  lastUpdatedText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
    color: '#6B7280',
  },
  // Section Cards
  sectionCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 16,
  },
  // Subsections
  subsection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  // Bullet Lists
  bulletList: {
    marginVertical: 4,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingVertical: 4,
  },
  bulletIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bulletText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
    fontWeight: '400',
  },
  // Contact Info
  contactInfo: {
    marginTop: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 15,
    marginLeft: 12,
    fontWeight: '500',
  },
  // Footer
  footerCard: {
    borderRadius: 16,
    padding: 24,
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 178, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 178, 255, 0.1)',
  },
  footerText: {
    fontSize: 15,
    marginLeft: 16,
    flex: 1,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
});
