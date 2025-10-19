// ========================================
// RESERVATION UTILITIES - PAMAMAHALA NG RESERVATION DATA
// ========================================
// Ang file na ito ay naghahandle ng reservation utility functions
// May functions para sa pag-convert, map, at process ng reservation data
// Ginagamit sa buong app para sa reservation management

// ========================================
// PRICE UTILITY FUNCTIONS
// ========================================
// Functions para sa price processing

// Utility function para sa pag-convert ng price string to number
export const parsePrice = (price: string | number): number => {
  if (typeof price === 'number') {
    return price;
  }
  
  // I-remove ang lahat ng non-numeric characters except decimal point at minus sign
  const cleanPrice = price.replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleanPrice);
  
  // I-return ang 0 kung nag-fail ang parsing
  return isNaN(parsed) ? 0 : parsed;
};

// ========================================
// RESERVATION MAPPING FUNCTIONS
// ========================================
// Functions para sa pag-map ng service data to reservation format

// Utility function para sa pag-map ng service data to reservation format
export const mapServiceToReservation = (service: any, serviceType: 'apartment' | 'laundry' | 'auto') => {
  console.log('Mapping service to reservation:', { service, serviceType });
  
  const baseReservation = {
    serviceType,
    serviceId: service.id,
    serviceTitle: service.title,
    servicePrice: parsePrice(service.price),
    serviceImage: service.image,
    status: service.status || 'pending' as const,
    paymentStatus: 'unpaid' as const,
    reservationDate: new Date().toISOString(),
  };

  // I-add ang service-specific properties
  if (serviceType === 'apartment') {
    const result = {
      ...baseReservation,
      serviceLocation: service.location,
      // Add bed information if present
      ...(service.bedId && { bedId: service.bedId }),
      ...(service.bedNumber && { bedNumber: service.bedNumber }),
    };
    console.log('Mapped apartment reservation:', result);
    return result;
  }

  console.log('Mapped service reservation:', baseReservation);
  return baseReservation;
};

// Utility function para sa pag-map ng service data for admin reservations
export const mapServiceToAdminReservation = (
  service: any, 
  serviceType: 'apartment' | 'laundry' | 'auto',
  userId: string,
  userName: string,
  userEmail: string,
  additionalData?: any
) => {
  console.log('Mapping service to admin reservation:', { service, serviceType, userId, userName, userEmail, additionalData });
  
  const baseReservation = {
    userId,
    userName,
    userEmail,
    serviceType,
    serviceId: service.id,
    serviceTitle: service.title,
    servicePrice: parsePrice(service.price),
    serviceImage: service.image,
    status: 'pending' as const,
    paymentStatus: 'unpaid' as const,
    reservationDate: new Date().toISOString(),
  };

  // Add service-specific properties
  if (serviceType === 'apartment') {
    const result = {
      ...baseReservation,
      serviceLocation: service.location,
      // Add bed information if present
      ...(service.bedId && { bedId: service.bedId }),
      ...(service.bedNumber && { bedNumber: service.bedNumber }),
    };
    console.log('Mapped admin apartment reservation:', result);
    return result;
  }

  // Add home service details if provided
  if (additionalData) {
    const result = {
      ...baseReservation,
      ...additionalData,
    };
    console.log('Mapped admin service reservation with additional data:', result);
    return result;
  }

  console.log('Mapped admin service reservation:', baseReservation);
  return baseReservation;
};
