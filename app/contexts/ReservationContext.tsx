import React, { createContext, ReactNode, useContext, useState } from 'react';

export type Apartment = {
  id: string;
  // Add other apartment properties as needed
  [key: string]: any;
};

export type LaundryService = {
  id: string;
  // Add other laundry properties as needed
  [key: string]: any;
};

export type AutoService = {
  id: string;
  // Add other auto properties as needed
  [key: string]: any;
};

interface ReservationContextType {
  reservedApartments: Apartment[];
  reserveApartment: (apartment: Apartment) => void;
  removeReservation: (apartmentId: string) => void;

  reservedLaundryServices: LaundryService[];
  reserveLaundryService: (service: LaundryService) => void;
  removeLaundryReservation: (serviceId: string) => void;

  reservedAutoServices: AutoService[];
  reserveAutoService: (service: AutoService) => void;
  removeAutoReservation: (serviceId: string) => void;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export const useReservation = () => {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
};

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [reservedApartments, setReservedApartments] = useState<Apartment[]>([]);
  const [reservedLaundryServices, setReservedLaundryServices] = useState<LaundryService[]>([]);
  const [reservedAutoServices, setReservedAutoServices] = useState<AutoService[]>([]);

  const reserveApartment = (apartment: Apartment) => {
    setReservedApartments(prev => {
      if (prev.find(a => a.id === apartment.id)) return prev;
      return [...prev, apartment];
    });
  };

  const removeReservation = (apartmentId: string) => {
    setReservedApartments(prev => prev.filter(a => a.id !== apartmentId));
  };

  const reserveLaundryService = (service: LaundryService) => {
    setReservedLaundryServices(prev => {
      if (prev.find(s => s.id === service.id)) return prev;
      return [...prev, service];
    });
  };

  const removeLaundryReservation = (serviceId: string) => {
    setReservedLaundryServices(prev => prev.filter(s => s.id !== serviceId));
  };

  const reserveAutoService = (service: AutoService) => {
    setReservedAutoServices(prev => {
      if (prev.find(s => s.id === service.id)) return prev;
      return [...prev, service];
    });
  };

  const removeAutoReservation = (serviceId: string) => {
    setReservedAutoServices(prev => prev.filter(s => s.id !== serviceId));
  };

  return (
    <ReservationContext.Provider
      value={{
        reservedApartments,
        reserveApartment,
        removeReservation,
        reservedLaundryServices,
        reserveLaundryService,
        removeLaundryReservation,
        reservedAutoServices,
        reserveAutoService,
        removeAutoReservation,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
};
