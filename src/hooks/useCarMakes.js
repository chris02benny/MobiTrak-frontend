import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Custom hook for fetching and managing car makes from NHTSA API
 * Provides autocomplete functionality and caching
 */
export const useCarMakes = () => {
  const [carMakes, setCarMakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  // Cache duration: 1 hour
  const CACHE_DURATION = 60 * 60 * 1000;

  // Check if cache is valid
  const isCacheValid = useMemo(() => {
    if (!lastFetched) return false;
    return Date.now() - lastFetched < CACHE_DURATION;
  }, [lastFetched]);

  // Fetch car makes from NHTSA API
  const fetchCarMakes = useCallback(async (forceRefresh = false) => {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && carMakes.length > 0 && isCacheValid) {
      return carMakes;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.Results && Array.isArray(data.Results)) {
        const makes = data.Results
          .map(make => make.Make_Name)
          .filter(make => make && make.trim()) // Filter out empty/null values
          .sort((a, b) => a.localeCompare(b)); // Sort alphabetically
        
        setCarMakes(makes);
        setLastFetched(Date.now());
        
        // Cache in localStorage for persistence
        try {
          localStorage.setItem('carMakes', JSON.stringify({
            data: makes,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('Failed to cache car makes in localStorage:', e);
        }
        
        return makes;
      } else {
        throw new Error('Invalid response format from NHTSA API');
      }
    } catch (err) {
      console.error('Error fetching car makes:', err);
      setError(err.message);
      
      // Try to load from localStorage as fallback
      try {
        const cached = localStorage.getItem('carMakes');
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION * 24) { // Use 24-hour cache for fallback
            setCarMakes(data);
            setLastFetched(timestamp);
            return data;
          }
        }
      } catch (e) {
        console.warn('Failed to load cached car makes:', e);
      }
      
      return [];
    } finally {
      setLoading(false);
    }
  }, [carMakes.length, isCacheValid]);

  // Load cached data on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem('carMakes');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setCarMakes(data);
          setLastFetched(timestamp);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load cached car makes on mount:', e);
    }

    // If no valid cache, fetch fresh data
    fetchCarMakes();
  }, []);

  // Filter makes based on search query
  const filterMakes = useCallback((query, maxResults = 10) => {
    if (!query || !query.trim()) return [];
    
    const searchTerm = query.toLowerCase().trim();
    
    return carMakes
      .filter(make => make.toLowerCase().includes(searchTerm))
      .slice(0, maxResults);
  }, [carMakes]);

  // Get exact match for validation
  const findExactMatch = useCallback((query) => {
    if (!query || !query.trim()) return null;
    
    return carMakes.find(make => 
      make.toLowerCase() === query.toLowerCase().trim()
    ) || null;
  }, [carMakes]);

  // Check if a make is valid
  const isValidMake = useCallback((make) => {
    return findExactMatch(make) !== null;
  }, [findExactMatch]);

  // Get popular makes (top 20 most common)
  const getPopularMakes = useCallback(() => {
    const popularMakes = [
      'TOYOTA', 'HONDA', 'FORD', 'CHEVROLET', 'NISSAN', 'BMW', 'MERCEDES-BENZ',
      'AUDI', 'VOLKSWAGEN', 'HYUNDAI', 'KIA', 'MAZDA', 'SUBARU', 'LEXUS',
      'ACURA', 'INFINITI', 'CADILLAC', 'LINCOLN', 'BUICK', 'GMC'
    ];
    
    return carMakes.filter(make => 
      popularMakes.some(popular => 
        make.toLowerCase().includes(popular.toLowerCase())
      )
    ).slice(0, 20);
  }, [carMakes]);

  // Refresh cache
  const refreshCache = useCallback(() => {
    return fetchCarMakes(true);
  }, [fetchCarMakes]);

  // Clear cache
  const clearCache = useCallback(() => {
    setCarMakes([]);
    setLastFetched(null);
    setError(null);
    try {
      localStorage.removeItem('carMakes');
    } catch (e) {
      console.warn('Failed to clear car makes cache:', e);
    }
  }, []);

  return {
    carMakes,
    loading,
    error,
    lastFetched,
    isCacheValid,
    fetchCarMakes,
    filterMakes,
    findExactMatch,
    isValidMake,
    getPopularMakes,
    refreshCache,
    clearCache
  };
};

export default useCarMakes;
