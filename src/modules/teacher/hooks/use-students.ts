/**
 * useStudents hook
 * Paginated student list with debounced search (300ms)
 * Infinite scroll
 * Validates: Requirements 4.1, 4.3, 6.2, 7.1, 7.4, 7.6, 7.7, 8.1, 8.2, 8.3, 8.5, 8.6, 9.1, 9.5, 9.6, 11.2, 11.5, 11.6, 11.8, 11.9, 12.1, 12.2, 12.3, 12.4, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.9, 14.2, 14.5, 14.6, 14.7, 14.8, 15.2, 15.3
 */

import type { PaginatedStudents, Student } from '../types';
import { useCallback, useEffect, useState } from 'react';
import { getStudents } from '../services';

const DEBOUNCE_MS = 300;
const DEFAULT_PAGE_SIZE = 20;

type UseStudentsResult = {
  students: Student[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  isLoading: boolean;
  error: string | null;
  search: string;
  setSearch: (search: string) => void;
  loadMore: () => void;
  refetch: () => void;
};

/**
 * Hook to manage paginated student list with search
 */
export function useStudents(): UseStudentsResult {
  const [students, setStudents] = useState<Student[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearchState] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    hasMore: true,
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  // Fetch students when page or search changes
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await getStudents({
          page: 1,
          limit: DEFAULT_PAGE_SIZE,
          search: debouncedSearch || undefined,
        });

        setStudents(result.students);
        setPagination(result.pagination);
        setPage(1);
      }
      catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch students';
        setError(errorMessage);
      }
      finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [debouncedSearch]);

  const loadMore = useCallback(async () => {
    if (isLoading || !pagination.hasMore) {
      return;
    }

    try {
      setIsLoading(true);
      const nextPage = page + 1;

      const result = await getStudents({
        page: nextPage,
        limit: DEFAULT_PAGE_SIZE,
        search: debouncedSearch || undefined,
      });

      setStudents(prev => [...prev, ...result.students]);
      setPagination(result.pagination);
      setPage(nextPage);
    }
    catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more students';
      setError(errorMessage);
    }
    finally {
      setIsLoading(false);
    }
  }, [isLoading, page, pagination.hasMore, debouncedSearch]);

  const setSearch = useCallback((newSearch: string) => {
    setSearchState(newSearch);
  }, []);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getStudents({
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        search: debouncedSearch || undefined,
      });

      setStudents(result.students);
      setPagination(result.pagination);
      setPage(1);
    }
    catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch students';
      setError(errorMessage);
    }
    finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  return {
    students,
    pagination,
    isLoading,
    error,
    search,
    setSearch,
    loadMore,
    refetch,
  };
}
