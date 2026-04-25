/**
 * useStudents hook
 * Paginated student list with debounced search (300ms)
 * Infinite scroll with proper loading state separation.
 */

import type { Student } from '../types';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  isRefreshing: boolean;
  isPaginating: boolean;
  error: string | null;
  search: string;
  setSearch: (search: string) => void;
  loadMore: () => void;
  refetch: () => void;
};

async function fetchStudentPage(params: {
  page: number;
  limit: number;
  search?: string;
}) {
  return getStudents({
    page: params.page,
    limit: params.limit,
    search: params.search || undefined,
  });
}

export function useStudents(): UseStudentsResult {
  const [students, setStudents] = useState<Student[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPaginating, setIsPaginating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearchState] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    hasMore: true,
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const hasFetchedOnce = useRef(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch students when search changes
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        if (!hasFetchedOnce.current) {
          setIsLoading(true);
        }
        setError(null);
        const result = await fetchStudentPage({
          page: 1,
          limit: DEFAULT_PAGE_SIZE,
          search: debouncedSearch,
        });
        setStudents(result.students);
        setPagination(result.pagination);
        setPage(1);
        hasFetchedOnce.current = true;
      }
      catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch students',
        );
      }
      finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [debouncedSearch]);

  const loadMore = useCallback(async () => {
    if (isPaginating || isLoading || !pagination.hasMore)
      return;
    try {
      setIsPaginating(true);
      const nextPage = page + 1;
      const result = await fetchStudentPage({
        page: nextPage,
        limit: DEFAULT_PAGE_SIZE,
        search: debouncedSearch,
      });
      setStudents(prev => [...prev, ...result.students]);
      setPagination(result.pagination);
      setPage(nextPage);
    }
    catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load more students',
      );
    }
    finally {
      setIsPaginating(false);
    }
  }, [isPaginating, isLoading, page, pagination.hasMore, debouncedSearch]);

  const setSearch = useCallback((newSearch: string) => {
    setSearchState(newSearch);
  }, []);

  const refetch = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const result = await fetchStudentPage({
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        search: debouncedSearch,
      });
      setStudents(result.students);
      setPagination(result.pagination);
      setPage(1);
    }
    catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch students',
      );
    }
    finally {
      setIsRefreshing(false);
    }
  }, [debouncedSearch]);

  return {
    students,
    pagination,
    isLoading,
    isRefreshing,
    isPaginating,
    error,
    search,
    setSearch,
    loadMore,
    refetch,
  };
}
