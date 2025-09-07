import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { RobustImage } from "../components/RobustImage";
import { useReservation } from "../contexts/ReservationContext";
import { formatPHP } from "../utils/currency";

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

export default function ReservationDetails() {
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams();
  const router = useRouter();
  const { reservedApartments, reservedLaundryServices, reservedAutoServices, removeReservation, removeLaundryReservation, removeAutoReservation } = useReservation();
  
  const reservationId = params.id as string;
  const type = (params.type as string) || 'apartment';
  const isLaundry = type === 'laundry';
  const isAuto = type === 'auto';
  const isApartment = !isLaundry && !isAuto;
  const reservation = isLaundry
    ? reservedLaundryServices.find(svc => svc.id === reservationId)
    : isAuto
      ? reservedAutoServices.find(svc => svc.id === reservationId)
      : reservedApartments.find(apt => apt.id === reservationId);

  const handleCancel = () => {
    Alert.alert(
      'Cancel reservation?',
      'This will remove the reservation from your bookings.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: () => {
            try {
              if (isLaundry) {
                removeLaundryReservation(reservationId);
              } else if (isAuto) {
                removeAutoReservation(reservationId);
              } else {
                removeReservation(reservationId);
              }
              router.replace('/(user-tabs)/bookings');
            } catch (e) {
              // Fallback navigation even if something goes wrong
              router.replace('/(user-tabs)/bookings');
            }
          },
        },
      ]
    );
  };

  const isDark = colorScheme === "dark";
  const bgColor = isDark ? "#121212" : "#fff";
  const cardBgColor = isDark ? "#1E1E1E" : "#fff";
  const textColor = isDark ? "#fff" : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? "#333" : "#eee";

  if (!reservation) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={48} color={colorPalette.primary} />
          <ThemedText type="title" style={[styles.errorText, { color: textColor }]}>
            Reservation Not Found
          </ThemedText>
          <TouchableOpacity 
            style={[styles.backButton, { borderColor }]}
            onPress={() => router.back()}
          >
            <ThemedText style={[styles.backButtonText, { color: colorPalette.primary }]}>
              Go Back
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Hero Header */}
        <View style={styles.heroContainer}>
          <RobustImage
            source={(reservation as any).image}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroTopRow}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.priceChip}>
              <MaterialIcons name="attach-money" size={16} color="#fff" />
              <ThemedText style={[styles.priceChipText]}>
                {formatPHP((reservation as any).price)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.heroBottom}>
            <View style={styles.heroTitleRow}>
              <MaterialIcons
                name={isLaundry ? "local-laundry-service" : (isAuto ? "directions-car" : "apartment")}
                size={24}
                color="#fff"
              />
              <ThemedText type="title" style={[styles.heroTitle, { color: '#fff' }]}>
                {(reservation as any).title}
              </ThemedText>
            </View>
            <ThemedText style={[styles.heroSubtitle]}>
              {isLaundry ? 'Laundry Service' : (isAuto ? 'Car & Motor Parts' : 'Apartment Rental')}
            </ThemedText>
          </View>
        </View>

        {/* Reservation Card */}
        <View style={[styles.reservationCard, { backgroundColor: cardBgColor, borderColor }]}>
          {/* Status */}
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: colorPalette.primary }]}>
              <ThemedText style={styles.statusText}>Confirmed</ThemedText>
            </View>
          </View>
          {/* Service Info (compact, under hero) */}
          <View style={styles.serviceInfoCompact}>
            <ThemedText type="subtitle" style={[styles.serviceName, { color: textColor }]}>
              Details
            </ThemedText>
          </View>

          {/* Detailed Information */}
          <View style={styles.detailsSection}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              {isLaundry || isAuto ? 'Service Information' : 'Property Information'}
            </ThemedText>

            {isApartment && (
              <>
                <View style={styles.detailRow}>
                  <MaterialIcons name="location-on" size={20} color={subtitleColor} />
                  <View style={styles.detailContent}>
                    <ThemedText style={[styles.detailLabel, { color: subtitleColor }]}>Location</ThemedText>
                    <ThemedText style={[styles.detailValue, { color: textColor }]}>{reservation.location}</ThemedText>
                  </View>
                </View>
              </>
            )}

            <View style={styles.detailRow}>
              <MaterialIcons name="attach-money" size={20} color={subtitleColor} />
              <View style={styles.detailContent}>
                <ThemedText style={[styles.detailLabel, { color: subtitleColor }]}>Price</ThemedText>
                <ThemedText style={[styles.detailValue, { color: textColor }]}>{formatPHP((reservation as any).price)}</ThemedText>
              </View>
            </View>

            {isLaundry ? (
              <>
                {(reservation as any).turnaround && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="schedule" size={20} color={subtitleColor} />
                    <View style={styles.detailContent}>
                      <ThemedText style={[styles.detailLabel, { color: subtitleColor }]}>Turnaround</ThemedText>
                      <ThemedText style={[styles.detailValue, { color: textColor }]}>{(reservation as any).turnaround}</ThemedText>
                    </View>
                  </View>
                )}
                {(reservation as any).pickup && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="local-shipping" size={20} color={subtitleColor} />
                    <View style={styles.detailContent}>
                      <ThemedText style={[styles.detailLabel, { color: subtitleColor }]}>Pickup</ThemedText>
                      <ThemedText style={[styles.detailValue, { color: textColor }]}>{(reservation as any).pickup}</ThemedText>
                    </View>
                  </View>
                )}
                {(reservation as any).delivery && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="delivery-dining" size={20} color={subtitleColor} />
                    <View style={styles.detailContent}>
                      <ThemedText style={[styles.detailLabel, { color: subtitleColor }]}>Delivery</ThemedText>
                      <ThemedText style={[styles.detailValue, { color: textColor }]}>{(reservation as any).delivery}</ThemedText>
                    </View>
                  </View>
                )}
                {(reservation as any).minOrder && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="scale" size={20} color={subtitleColor} />
                    <View style={styles.detailContent}>
                      <ThemedText style={[styles.detailLabel, { color: subtitleColor }]}>Minimum Order</ThemedText>
                      <ThemedText style={[styles.detailValue, { color: textColor }]}>{(reservation as any).minOrder}</ThemedText>
                    </View>
                  </View>
                )}
              </>
            ) : isAuto ? (
              <>
                {(reservation as any).description && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="description" size={20} color={subtitleColor} />
                    <View style={styles.detailContent}>
                      <ThemedText style={[styles.detailLabel, { color: subtitleColor }]}>Description</ThemedText>
                      <ThemedText style={[styles.detailValue, { color: textColor }]}>{(reservation as any).description}</ThemedText>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <>
                {(reservation as any).description && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="description" size={20} color={subtitleColor} />
                    <View style={styles.detailContent}>
                      <ThemedText style={[styles.detailLabel, { color: subtitleColor }]}>Description</ThemedText>
                      <ThemedText style={[styles.detailValue, { color: textColor }]}>{(reservation as any).description}</ThemedText>
                    </View>
                  </View>
                )}
                {(reservation as any).bedrooms && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="bed" size={20} color={subtitleColor} />
                    <View style={styles.detailContent}>
                      <ThemedText style={[styles.detailLabel, { color: subtitleColor }]}>Bedrooms</ThemedText>
                      <ThemedText style={[styles.detailValue, { color: textColor }]}>{(reservation as any).bedrooms}</ThemedText>
                    </View>
                  </View>
                )}
                {(reservation as any).bathrooms && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="bathroom" size={20} color={subtitleColor} />
                    <View style={styles.detailContent}>
                      <ThemedText style={[styles.detailLabel, { color: subtitleColor }]}>Bathrooms</ThemedText>
                      <ThemedText style={[styles.detailValue, { color: textColor }]}>{(reservation as any).bathrooms}</ThemedText>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Services / Amenities Chips */}
          {isLaundry && Array.isArray((reservation as any).services) && (reservation as any).services.length > 0 && (
            <View style={styles.chipsSection}>
              <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>Services Included</ThemedText>
              <View style={styles.chipsWrap}>
                {(reservation as any).services.map((svc: string, idx: number) => (
                  <View key={idx} style={styles.chip}>
                    <MaterialIcons name="check-circle" size={14} color={colorPalette.primary} />
                    <ThemedText style={[styles.chipText, { color: subtitleColor }]}>{svc}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {isApartment && Array.isArray((reservation as any).amenities) && (reservation as any).amenities.length > 0 && (
            <View style={styles.chipsSection}>
              <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>Amenities</ThemedText>
              <View style={styles.chipsWrap}>
                {(reservation as any).amenities.map((amenity: string, idx: number) => (
                  <View key={idx} style={styles.chip}>
                    <MaterialIcons name="check-circle" size={14} color={colorPalette.primary} />
                    <ThemedText style={[styles.chipText, { color: subtitleColor }]}>{amenity}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Reservation Status */}
          <View style={styles.statusSection}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>Reservation Status</ThemedText>
            <ThemedText style={[styles.statusHelp, { color: subtitleColor }]}>You can contact the provider or cancel below.</ThemedText>
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colorPalette.primary }]}>
              <MaterialIcons name="phone" size={20} color="#fff" />
              <ThemedText style={[styles.actionButtonText, { color: "#fff" }]}>
                Contact Owner
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, { borderColor }]} onPress={handleCancel}>
              <MaterialIcons name="cancel" size={20} color={colorPalette.primary} />
              <ThemedText style={[styles.actionButtonText, { color: colorPalette.primary }]}>
                Cancel Reservation
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  heroContainer: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  priceChipText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 4,
  },
  heroBottom: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 12,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#fff',
    opacity: 0.9,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  reservationCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  serviceInfoCompact: {
    marginBottom: 12,
  },
  serviceDetails: {
    marginLeft: 16,
    flex: 1,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 16,
    opacity: 0.8,
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailContent: {
    marginLeft: 16,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusSection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusHelp: {
    marginTop: 6,
    fontSize: 12,
  },
  chipsSection: {
    marginBottom: 16,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  chipText: {
    marginLeft: 6,
    fontSize: 12,
  },
  actionsSection: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
