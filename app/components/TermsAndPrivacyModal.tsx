// ========================================
// TERMS AND PRIVACY MODAL - PROFESSIONAL DESIGN
// ========================================
// A professional modal component for displaying Terms and Conditions
// and Data Privacy Policy with modern UI design and smooth animations

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Responsive values for different screen sizes
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 414;
const isLargeScreen = width >= 414;
const isTablet = width >= 768;

// Responsive font sizes
const responsiveFontSizes = {
  headerTitle: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
  headerSubtitle: isSmallScreen ? 12 : isMediumScreen ? 14 : 16,
  sectionTitle: isSmallScreen ? 16 : isMediumScreen ? 18 : 20,
  sectionDescription: isSmallScreen ? 13 : isMediumScreen ? 14 : 15,
  termText: isSmallScreen ? 12 : isMediumScreen ? 13 : 14,
  subsectionTitle: isSmallScreen ? 14 : isMediumScreen ? 15 : 16,
  infoText: isSmallScreen ? 11 : isMediumScreen ? 12 : 13,
  buttonText: isSmallScreen ? 14 : isMediumScreen ? 15 : 16,
  contactTitle: isSmallScreen ? 14 : isMediumScreen ? 15 : 16,
  contactText: isSmallScreen ? 12 : isMediumScreen ? 13 : 14,
};

// Responsive spacing
const responsiveSpacing = {
  padding: isSmallScreen ? 16 : isMediumScreen ? 18 : 20,
  margin: isSmallScreen ? 12 : isMediumScreen ? 14 : 16,
  cardPadding: isSmallScreen ? 16 : isMediumScreen ? 18 : 20,
  buttonPadding: isSmallScreen ? 12 : isMediumScreen ? 13 : 14,
};

interface TermsAndPrivacyModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export default function TermsAndPrivacyModal({ 
  visible, 
  onClose, 
  onAccept 
}: TermsAndPrivacyModalProps) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleViewFullPrivacy = () => {
    onClose();
    router.push('/privacy-policy');
  };

  const handleAccept = () => {
    onAccept();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      presentationStyle="fullScreen"
      hardwareAccelerated
    >
      <Animated.View 
        style={[
          styles.container,
          { opacity: fadeAnim }
        ]}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          {/* Header */}
           <LinearGradient
             colors={['#00B2FF', '#007BE5', '#002F87']}
             start={{ x: 0, y: 0 }}
             end={{ x: 1, y: 1 }}
             style={styles.header}
           >
             <View style={styles.headerContent}>
               <TouchableOpacity 
                 style={styles.backButton}
                 onPress={onClose}
                 activeOpacity={0.7}
               >
                 <Ionicons name="arrow-back" size={24} color="white" />
               </TouchableOpacity>
               <View style={styles.headerIcon}>
                 <Ionicons name="shield-checkmark" size={24} color="white" />
               </View>
               <View style={styles.headerText}>
                 <Text style={[styles.headerTitle, { fontSize: responsiveFontSizes.headerTitle }]}>Terms & Privacy Policy</Text>
                 <Text style={[styles.headerSubtitle, { fontSize: responsiveFontSizes.headerSubtitle }]}>Please review before proceeding</Text>
               </View>
             </View>
           </LinearGradient>

          {/* Content */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Last Updated */}
            <View style={styles.lastUpdatedCard}>
              <View style={styles.lastUpdatedContent}>
                <Ionicons name="time" size={16} color="#6B7280" />
                <Text style={styles.lastUpdatedText}>
                  Last updated: October 2025
                </Text>
              </View>
            </View>

            {/* Terms of Service Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: '#00B2FF' }]}>
                  <Ionicons name="document-text" size={20} color="white" />
                </View>
                <Text style={[styles.sectionTitle, { fontSize: responsiveFontSizes.sectionTitle }]}>Terms of Service</Text>
              </View>
              <Text style={[styles.sectionDescription, { fontSize: responsiveFontSizes.sectionDescription }]}>
                By using Gereu Online Hub, you agree to the following terms:
              </Text>
              
              <View style={styles.termsList}>
                <View style={styles.termItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00B2FF" />
                  <Text style={[styles.termText, { fontSize: responsiveFontSizes.termText }]}>Provide accurate and complete information</Text>
                </View>
                <View style={styles.termItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00B2FF" />
                  <Text style={[styles.termText, { fontSize: responsiveFontSizes.termText }]}>Maintain the security of your account</Text>
                </View>
                <View style={styles.termItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00B2FF" />
                  <Text style={[styles.termText, { fontSize: responsiveFontSizes.termText }]}>Use the service for lawful purposes only</Text>
                </View>
                <View style={styles.termItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00B2FF" />
                  <Text style={[styles.termText, { fontSize: responsiveFontSizes.termText }]}>Respect other users and their privacy</Text>
                </View>
                <View style={styles.termItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00B2FF" />
                  <Text style={[styles.termText, { fontSize: responsiveFontSizes.termText }]}>Not share your account credentials</Text>
                </View>
                <View style={styles.termItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00B2FF" />
                  <Text style={[styles.termText, { fontSize: responsiveFontSizes.termText }]}>Use services only within Gereu Building premises</Text>
                </View>
              </View>
            </View>

            {/* Data Privacy Policy Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: '#10B981' }]}>
                  <Ionicons name="shield" size={20} color="white" />
                </View>
                <Text style={[styles.sectionTitle, { fontSize: responsiveFontSizes.sectionTitle }]}>Data Privacy Policy</Text>
              </View>
              <Text style={[styles.sectionDescription, { fontSize: responsiveFontSizes.sectionDescription }]}>
                We are committed to protecting your privacy and personal information.
              </Text>

              {/* Information We Collect */}
              <View style={styles.subsection}>
                <Text style={[styles.subsectionTitle, { fontSize: responsiveFontSizes.subsectionTitle }]}>Information We Collect</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Ionicons name="person" size={16} color="#00B2FF" />
                    <Text style={[styles.infoText, { fontSize: responsiveFontSizes.infoText }]}>Personal details (name, email, apartment/room number)</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="card" size={16} color="#00B2FF" />
                    <Text style={[styles.infoText, { fontSize: responsiveFontSizes.infoText }]}>Payment information (processed securely via GCash)</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="calendar" size={16} color="#00B2FF" />
                    <Text style={[styles.infoText, { fontSize: responsiveFontSizes.infoText }]}>Booking history and service preferences</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="phone-portrait" size={16} color="#00B2FF" />
                    <Text style={[styles.infoText, { fontSize: responsiveFontSizes.infoText }]}>Device information and app usage patterns</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="chatbubbles" size={16} color="#00B2FF" />
                    <Text style={[styles.infoText, { fontSize: responsiveFontSizes.infoText }]}>Communication logs with support staff</Text>
                  </View>
                </View>
              </View>

              {/* How We Use Your Data */}
              <View style={styles.subsection}>
                <Text style={[styles.subsectionTitle, { fontSize: responsiveFontSizes.subsectionTitle }]}>How We Use Your Data</Text>
                <View style={styles.usageGrid}>
                  <View style={styles.usageItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.usageText}>Process and manage your service bookings</Text>
                  </View>
                  <View style={styles.usageItem}>
                    <Ionicons name="notifications" size={16} color="#10B981" />
                    <Text style={styles.usageText}>Send booking confirmations and updates</Text>
                  </View>
                  <View style={styles.usageItem}>
                    <Ionicons name="card" size={16} color="#10B981" />
                    <Text style={styles.usageText}>Process payments and provide tracking</Text>
                  </View>
                  <View style={styles.usageItem}>
                    <Ionicons name="trending-up" size={16} color="#10B981" />
                    <Text style={styles.usageText}>Improve our services and app functionality</Text>
                  </View>
                  <View style={styles.usageItem}>
                    <Ionicons name="chatbubbles" size={16} color="#10B981" />
                    <Text style={styles.usageText}>Provide customer support</Text>
                  </View>
                  <View style={styles.usageItem}>
                    <Ionicons name="shield" size={16} color="#10B981" />
                    <Text style={styles.usageText}>Ensure security and prevent fraud</Text>
                  </View>
                </View>
              </View>

              {/* Data Security */}
              <View style={styles.subsection}>
                <Text style={[styles.subsectionTitle, { fontSize: responsiveFontSizes.subsectionTitle }]}>Data Security</Text>
                <View style={styles.securityGrid}>
                  <View style={styles.securityItem}>
                    <Ionicons name="lock-closed" size={16} color="#F59E0B" />
                    <Text style={styles.securityText}>End-to-end encryption for all data transmission</Text>
                  </View>
                  <View style={styles.securityItem}>
                    <Ionicons name="server" size={16} color="#F59E0B" />
                    <Text style={styles.securityText}>Secure cloud storage with Firebase security</Text>
                  </View>
                  <View style={styles.securityItem}>
                    <Ionicons name="key" size={16} color="#F59E0B" />
                    <Text style={styles.securityText}>Regular security audits and updates</Text>
                  </View>
                  <View style={styles.securityItem}>
                    <Ionicons name="people" size={16} color="#F59E0B" />
                    <Text style={styles.securityText}>Limited access to authorized personnel only</Text>
                  </View>
                </View>
              </View>

              {/* Your Rights */}
              <View style={styles.subsection}>
                <Text style={[styles.subsectionTitle, { fontSize: responsiveFontSizes.subsectionTitle }]}>Your Rights</Text>
                <View style={styles.rightsGrid}>
                  <View style={styles.rightItem}>
                    <Ionicons name="eye" size={16} color="#8B5CF6" />
                    <Text style={styles.rightText}>Access your personal data</Text>
                  </View>
                  <View style={styles.rightItem}>
                    <Ionicons name="create" size={16} color="#8B5CF6" />
                    <Text style={styles.rightText}>Correct inaccurate information</Text>
                  </View>
                  <View style={styles.rightItem}>
                    <Ionicons name="trash" size={16} color="#8B5CF6" />
                    <Text style={styles.rightText}>Request deletion of your data</Text>
                  </View>
                  <View style={styles.rightItem}>
                    <Ionicons name="download" size={16} color="#8B5CF6" />
                    <Text style={styles.rightText}>Export your data in a portable format</Text>
                  </View>
                  <View style={styles.rightItem}>
                    <Ionicons name="stop" size={16} color="#8B5CF6" />
                    <Text style={styles.rightText}>Withdraw consent for data processing</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Contact Information */}
            <View style={styles.contactCard}>
              <View style={styles.contactHeader}>
                <Ionicons name="mail" size={20} color="#00B2FF" />
                <Text style={[styles.contactTitle, { fontSize: responsiveFontSizes.contactTitle }]}>Contact Us</Text>
              </View>
              <Text style={[styles.contactText, { fontSize: responsiveFontSizes.contactText }]}>
                For questions about this policy or our data practices:
              </Text>
              <Text style={styles.contactEmail}>privacy@gereuonlinehub.com</Text>
            </View>

            {/* Policy Updates */}
            <View style={styles.updateCard}>
              <Ionicons name="refresh" size={20} color="#6B7280" />
              <Text style={styles.updateText}>
                We may update this policy and will notify you of significant changes. 
                Your continued use constitutes acceptance.
              </Text>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleViewFullPrivacy}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text" size={16} color="#00B2FF" />
              <Text style={[styles.secondaryButtonText, { fontSize: responsiveFontSizes.buttonText }]}>View Full Policy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00B2FF', '#007BE5', '#002F87']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Ionicons name="checkmark" size={16} color="white" />
                <Text style={[styles.primaryButtonText, { fontSize: responsiveFontSizes.buttonText }]}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingHorizontal: responsiveSpacing.padding,
    paddingVertical: responsiveSpacing.margin,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
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
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: responsiveSpacing.padding,
    paddingBottom: 120,
  },
  lastUpdatedCard: {
    backgroundColor: '#F8F9FA',
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
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: responsiveSpacing.cardPadding,
    marginBottom: responsiveSpacing.margin,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    color: '#1F2937',
    flex: 1,
  },
  sectionDescription: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  termsList: {
    marginTop: 8,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  termText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  subsection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoGrid: {
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingVertical: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  usageGrid: {
    marginTop: 8,
  },
  usageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingVertical: 4,
  },
  usageText: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  securityGrid: {
    marginTop: 8,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingVertical: 4,
  },
  securityText: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  rightsGrid: {
    marginTop: 8,
  },
  rightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingVertical: 4,
  },
  rightText: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  contactCard: {
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  contactEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00B2FF',
  },
  updateCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  updateText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: responsiveSpacing.padding,
    paddingTop: responsiveSpacing.margin,
    paddingBottom: Platform.OS === 'ios' ? 34 : responsiveSpacing.padding,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveSpacing.buttonPadding,
    paddingHorizontal: responsiveSpacing.padding,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00B2FF',
    backgroundColor: 'white',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00B2FF',
    marginLeft: 8,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveSpacing.buttonPadding,
    paddingHorizontal: responsiveSpacing.padding,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginLeft: 8,
  },
});
