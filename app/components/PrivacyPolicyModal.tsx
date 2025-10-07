// ========================================
// PRIVACY POLICY MODAL COMPONENT
// ========================================
// Comprehensive data privacy policy modal for Gereu Online Hub
// Includes detailed privacy terms, data collection, usage, and user rights

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { height, width } = Dimensions.get('window');

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export default function PrivacyPolicyModal({ visible, onClose, onAccept }: PrivacyPolicyModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
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
          toValue: height,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View 
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
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
              <View style={styles.headerIcon}>
                <Ionicons name="shield-checkmark" size={24} color="white" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Data Privacy Policy</Text>
                <Text style={styles.headerSubtitle}>Your privacy matters to us</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.lastUpdated}>
              <Ionicons name="time" size={16} color="#6B7280" />
              <Text style={styles.lastUpdatedText}>Last updated: December 2024</Text>
            </View>

            {/* Introduction */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Introduction</Text>
              <Text style={styles.sectionContent}>
                At Gereu Online Hub, we are committed to protecting your privacy and personal information. 
                This Data Privacy Policy explains how we collect, use, store, and protect your information 
                when you use our mobile application and services.
              </Text>
            </View>

            {/* Information We Collect */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Information We Collect</Text>
              
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>Personal Information</Text>
                <View style={styles.bulletList}>
                  <View style={styles.bulletItem}>
                    <Ionicons name="person" size={16} color="#00B2FF" />
                    <Text style={styles.bulletText}>Name and contact information (email, phone number)</Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <Ionicons name="home" size={16} color="#00B2FF" />
                    <Text style={styles.bulletText}>Apartment/room number within Gereu Building</Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <Ionicons name="card" size={16} color="#00B2FF" />
                    <Text style={styles.bulletText}>Payment information (processed securely through GCash)</Text>
                  </View>
                </View>
              </View>

              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>Usage Information</Text>
                <View style={styles.bulletList}>
                  <View style={styles.bulletItem}>
                    <Ionicons name="analytics" size={16} color="#00B2FF" />
                    <Text style={styles.bulletText}>App usage patterns and preferences</Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <Ionicons name="calendar" size={16} color="#00B2FF" />
                    <Text style={styles.bulletText}>Booking history and service requests</Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <Ionicons name="chatbubbles" size={16} color="#00B2FF" />
                    <Text style={styles.bulletText}>Communication logs with support staff</Text>
                  </View>
                </View>
              </View>

              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>Device Information</Text>
                <View style={styles.bulletList}>
                  <View style={styles.bulletItem}>
                    <Ionicons name="phone-portrait" size={16} color="#00B2FF" />
                    <Text style={styles.bulletText}>Device type and operating system</Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <Ionicons name="location" size={16} color="#00B2FF" />
                    <Text style={styles.bulletText}>General location (for service delivery within Gereu Building)</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* How We Use Your Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How We Use Your Information</Text>
              
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>Process and manage your service bookings (apartments, laundry, auto services)</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="notifications" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>Send booking confirmations, reminders, and service updates</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="card" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>Process payments and provide payment tracking</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="chatbubbles" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>Provide customer support and respond to inquiries</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="trending-up" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>Improve our services and app functionality</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="shield" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>Ensure security and prevent fraud</Text>
                </View>
              </View>
            </View>

            {/* Data Security */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Data Security</Text>
              <Text style={styles.sectionContent}>
                We implement industry-standard security measures to protect your personal information:
              </Text>
              
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Ionicons name="lock-closed" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>End-to-end encryption for all data transmission</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="server" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>Secure cloud storage with Firebase security</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="key" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>Regular security audits and updates</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="people" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>Limited access to authorized personnel only</Text>
                </View>
              </View>
            </View>

            {/* Data Sharing */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Data Sharing</Text>
              <Text style={styles.sectionContent}>
                We do not sell, trade, or rent your personal information to third parties. We may share 
                your information only in the following limited circumstances:
              </Text>
              
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Ionicons name="business" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>With service providers within Gereu Building (laundry, auto services) for booking fulfillment</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="card" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>With payment processors (GCash) for transaction processing</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="gavel" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>When required by law or legal process</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="shield" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>To protect our rights, property, or safety</Text>
                </View>
              </View>
            </View>

            {/* Your Rights */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Rights</Text>
              <Text style={styles.sectionContent}>
                You have the following rights regarding your personal information:
              </Text>
              
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Ionicons name="eye" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>Access your personal data</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="create" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>Correct inaccurate information</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="trash" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>Request deletion of your data</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="download" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>Export your data in a portable format</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="stop" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>Withdraw consent for data processing</Text>
                </View>
              </View>
            </View>

            {/* Data Retention */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Data Retention</Text>
              <Text style={styles.sectionContent}>
                We retain your personal information only as long as necessary to provide our services 
                and comply with legal obligations:
              </Text>
              
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <Ionicons name="calendar" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>Account information: Until account deletion</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="receipt" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>Booking records: 3 years for business records</Text>
                </View>
                <View style={styles.bulletItem}>
                  <Ionicons name="card" size={16} color="#00B2FF" />
                  <Text style={styles.bulletText}>Payment data: As required by financial regulations</Text>
                </View>
              </View>
            </View>

            {/* Children's Privacy */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Children's Privacy</Text>
              <Text style={styles.sectionContent}>
                Our services are not intended for children under 13 years of age. We do not knowingly 
                collect personal information from children under 13. If you are a parent or guardian 
                and believe your child has provided us with personal information, please contact us.
              </Text>
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Us</Text>
              <Text style={styles.sectionContent}>
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </Text>
              
              <View style={styles.contactInfo}>
                <View style={styles.contactItem}>
                  <Ionicons name="mail" size={16} color="#00B2FF" />
                  <Text style={styles.contactText}>privacy@gereuonlinehub.com</Text>
                </View>
                <View style={styles.contactItem}>
                  <Ionicons name="location" size={16} color="#00B2FF" />
                  <Text style={styles.contactText}>Gereu Building, Philippines</Text>
                </View>
                <View style={styles.contactItem}>
                  <Ionicons name="chatbubbles" size={16} color="#00B2FF" />
                  <Text style={styles.contactText}>In-app messaging support</Text>
                </View>
              </View>
            </View>

            {/* Changes to Policy */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Changes to This Policy</Text>
              <Text style={styles.sectionContent}>
                We may update this Privacy Policy from time to time. We will notify you of any 
                significant changes through the app or via email. Your continued use of our services 
                after such changes constitutes acceptance of the updated policy.
              </Text>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.declineButton} onPress={onClose}>
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
              <LinearGradient
                colors={['#00B2FF', '#007BE5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.acceptButtonGradient}
              >
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.acceptButtonText}>Accept & Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: height * 0.9,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
  },
  headerContent: {
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
    marginBottom: 12,
  },
  subsection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
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
    color: '#4B5563',
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
    color: '#4B5563',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  declineButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    marginRight: 8,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  acceptButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 8,
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginLeft: 8,
  },
});
