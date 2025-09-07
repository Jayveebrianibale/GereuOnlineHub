// Utility function to convert price string to number
export const parsePrice = (price: string | number): number => {
  if (typeof price === 'number') {
    return price;
  }
  
  // Remove all non-numeric characters except decimal point and minus sign
  const cleanPrice = price.replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleanPrice);
  
  // Return 0 if parsing fails
  return isNaN(parsed) ? 0 : parsed;
};

// Utility function to map service data to reservation format
export const mapServiceToReservation = (service: any, serviceType: 'apartment' | 'laundry' | 'auto') => {
  console.log('Mapping service to reservation:', { service, serviceType });
  
  const baseReservation = {
    serviceType,
    serviceId: service.id,
    serviceTitle: service.title,
    servicePrice: parsePrice(service.price),
    serviceImage: service.image,
    status: service.status || 'pending' as const,
    reservationDate: new Date().toISOString(),
  };

  // Add service-specific properties
  if (serviceType === 'apartment') {
    const result = {
      ...baseReservation,
      serviceLocation: service.location,
    };
    console.log('Mapped apartment reservation:', result);
    return result;
  }

  console.log('Mapped service reservation:', baseReservation);
  return baseReservation;
};

// Utility function to map service data for admin reservations
export const mapServiceToAdminReservation = (
  service: any, 
  serviceType: 'apartment' | 'laundry' | 'auto',
  userId: string,
  userName: string,
  userEmail: string
) => {
  console.log('Mapping service to admin reservation:', { service, serviceType, userId, userName, userEmail });
  
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
    reservationDate: new Date().toISOString(),
  };

  // Add service-specific properties
  if (serviceType === 'apartment') {
    const result = {
      ...baseReservation,
      serviceLocation: service.location,
    };
    console.log('Mapped admin apartment reservation:', result);
    return result;
  }

  console.log('Mapped admin service reservation:', baseReservation);
  return baseReservation;
};
