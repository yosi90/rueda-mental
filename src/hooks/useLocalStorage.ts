import { useEffect, useState } from 'react';

// Hook genérico para manejar localStorage
export function useLocalStorage<T>(
    key: string,
    initialValue: T,
    serializer: (value: T) => string = JSON.stringify,
    deserializer: (value: string) => T = JSON.parse
): [T, (value: T | ((prev: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? deserializer(item) : initialValue;
        } catch (error) {
            console.error(`Error loading ${key} from localStorage:`, error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, serializer(storedValue));
        } catch (error) {
            console.error(`Error saving ${key} to localStorage:`, error);
        }
    }, [key, storedValue, serializer]);

    return [storedValue, setStoredValue];
}