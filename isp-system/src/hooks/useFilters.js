import { useState, useMemo, useEffect } from 'react';

/**
 * Hook personalizado para filtrar arrays de datos.
 * Maneja búsqueda (debounce), filtros personalizados y paginación.
 * 
 * @param {Array} data - Array de datos a filtrar.
 * @param {Object} config - Configuración inicial (searchFields, initialFilters, pageSize).
 */
export function useFilters(data = [], config = {}) {
    const {
        searchFields = [], // Campos donde buscar (ej: ['nombre', 'id'])
        initialFilters = {}, // Estado inicial de filtros (ej: { estado: 'all' })
        pageSize = 20, // Tamaño de página por defecto
    } = config;

    // Estados de Búsqueda
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); // Valor con debounce

    // Estados de Filtros
    const [filters, setFilters] = useState(initialFilters);

    // Estados de Paginación
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: pageSize,
    });

    // Debounce para la búsqueda
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput);
            setPagination(prev => ({ ...prev, pageIndex: 0 })); // Resetear página al buscar
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Actualizar página al cambiar filtros
    useEffect(() => {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, [filters]);

    // Lógica de Filtrado
    const filteredData = useMemo(() => {
        let result = data;

        // 1. Filtrar por búsqueda de texto
        if (searchQuery && searchFields.length > 0) {
            const q = searchQuery.toLowerCase();
            result = result.filter(item => {
                return searchFields.some(field => {
                    const val = item[field];
                    return String(val || '').toLowerCase().includes(q);
                });
            });
        }

        // 2. Filtrar por filtros personalizados
        Object.keys(filters).forEach(key => {
            const filterValue = filters[key];
            if (filterValue && filterValue !== 'all') {
                result = result.filter(item => {
                    // Si el filtro es una función, la ejecutamos
                    if (typeof filterValue === 'function') {
                        return filterValue(item);
                    }
                    // Comparación directa
                    return String(item[key]) === String(filterValue);
                });
            }
        });

        return result;
    }, [data, searchQuery, filters, searchFields]);

    // Helpers
    const resetFilters = () => {
        setSearchInput('');
        setSearchQuery('');
        setFilters(initialFilters);
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    };

    const updateFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return {
        // Data
        filteredData,
        totalItems: data.length,
        filteredCount: filteredData.length,

        // Search
        searchInput,
        setSearchInput,
        hasActiveSearch: !!searchInput,

        // Filters
        filters,
        updateFilter,
        setFilters,
        resetFilters,

        // Pagination
        pagination,
        setPagination,
    };
}
