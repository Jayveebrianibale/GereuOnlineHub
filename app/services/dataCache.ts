import { Apartment } from './apartmentService';
import { AutoService } from './autoService';
import { LaundryService } from './laundryService';
import { MotorPart } from './motorPartsService';

// Cache interface
interface CacheData<T> {
  data: T[];
  timestamp: number;
  expiresIn: number; // milliseconds
}

// Cache storage
class DataCache {
  private cache = new Map<string, CacheData<any>>();
  private readonly DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes

  // Set cache data
  set<T>(key: string, data: T[], expiresIn?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: expiresIn || this.DEFAULT_EXPIRY
    });
    console.log(`📦 Cached ${key} with ${data.length} items`);
  }

  // Get cache data
  get<T>(key: string): T[] | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      console.log(`❌ No cache found for ${key}`);
      return null;
    }

    const now = Date.now();
    const isExpired = (now - cached.timestamp) > cached.expiresIn;

    if (isExpired) {
      console.log(`⏰ Cache expired for ${key}, removing...`);
      this.cache.delete(key);
      return null;
    }

    console.log(`✅ Cache hit for ${key} with ${cached.data.length} items`);
    return cached.data as T[];
  }

  // Check if cache exists and is valid
  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const now = Date.now();
    const isExpired = (now - cached.timestamp) > cached.expiresIn;

    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Clear specific cache
  clear(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️ Cleared cache for ${key}`);
  }

  // Clear all cache
  clearAll(): void {
    this.cache.clear();
    console.log(`🗑️ Cleared all cache`);
  }

  // Get cache info
  getInfo(): { [key: string]: { count: number; age: number; expiresIn: number } } {
    const info: { [key: string]: { count: number; age: number; expiresIn: number } } = {};
    const now = Date.now();

    this.cache.forEach((value, key) => {
      info[key] = {
        count: value.data.length,
        age: now - value.timestamp,
        expiresIn: value.expiresIn
      };
    });

    return info;
  }
}

// Create singleton instance
export const dataCache = new DataCache();

// Cache keys
export const CACHE_KEYS = {
  APARTMENTS: 'apartments',
  AUTO_SERVICES: 'auto_services',
  LAUNDRY_SERVICES: 'laundry_services',
  MOTOR_PARTS: 'motor_parts'
} as const;

// Helper functions for specific data types
export const cacheApartments = (apartments: Apartment[]): void => {
  dataCache.set(CACHE_KEYS.APARTMENTS, apartments);
};

export const getCachedApartments = (): Apartment[] | null => {
  return dataCache.get<Apartment>(CACHE_KEYS.APARTMENTS);
};

export const cacheAutoServices = (services: AutoService[]): void => {
  dataCache.set(CACHE_KEYS.AUTO_SERVICES, services);
};

export const getCachedAutoServices = (): AutoService[] | null => {
  return dataCache.get<AutoService>(CACHE_KEYS.AUTO_SERVICES);
};

export const cacheLaundryServices = (services: LaundryService[]): void => {
  dataCache.set(CACHE_KEYS.LAUNDRY_SERVICES, services);
};

export const getCachedLaundryServices = (): LaundryService[] | null => {
  return dataCache.get<LaundryService>(CACHE_KEYS.LAUNDRY_SERVICES);
};

export const cacheMotorParts = (parts: MotorPart[]): void => {
  dataCache.set(CACHE_KEYS.MOTOR_PARTS, parts);
};

export const getCachedMotorParts = (): MotorPart[] | null => {
  return dataCache.get<MotorPart>(CACHE_KEYS.MOTOR_PARTS);
};

// Check if we have cached data
export const hasCachedData = (): boolean => {
  return dataCache.has(CACHE_KEYS.APARTMENTS) || 
         dataCache.has(CACHE_KEYS.AUTO_SERVICES) || 
         dataCache.has(CACHE_KEYS.LAUNDRY_SERVICES) ||
         dataCache.has(CACHE_KEYS.MOTOR_PARTS);
};

// Clear all cached data
export const clearAllCache = (): void => {
  dataCache.clearAll();
};
