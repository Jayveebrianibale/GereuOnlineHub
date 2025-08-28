import React, { createContext, ReactNode, useContext, useState } from 'react';

export type Apartment = {
  id: string;
  // Add other apartment properties as needed
  [key: string]: any;
};

interface ReservationContextType {
  reservedApartments: Apartment[];
  reserveApartment: (apartment: Apartment) => void;
  removeReservation: (apartmentId: string) => void;
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

  const reserveApartment = (apartment: Apartment) => {
    setReservedApartments(prev => {
      if (prev.find(a => a.id === apartment.id)) return prev;
      return [...prev, apartment];
    });
  };

  const removeReservation = (apartmentId: string) => {
    setReservedApartments(prev => prev.filter(a => a.id !== apartmentId));
  };

  return (
    <ReservationContext.Provider value={{ reservedApartments, reserveApartment, removeReservation }}>
      {children}
    </ReservationContext.Provider>
  );
};
