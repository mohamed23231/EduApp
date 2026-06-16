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

type Pagination = {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

type UseStudentsResult = {
  students: Student[];
  pagination: Pagination;
  isLoading: boolean;
  isRefreshing: boolean;
  isPaginating: boolean;
  error: string | null;
  search: string;
  setSearch: (search: string) => void;
  loadMore: () => void;
  refetch: () => void;
  silentRefetch: () => void;
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

function useStudentsState() {
  const [students, setStudents] = useState<Student[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPaginating, setIsPaginating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearchState] = useState<string>('');
  const [pagination, setPagination] = useState<Pagination>({
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

  return {
    students,
    setStudents,
    page,
    setPage,
    isLoading,
    setIsLoading,
    isRefreshing,
    setIsRefreshing,
    isPaginating,
    setIsPaginating,
    error,
    setError,
    search,
    setSearchState,
    pagination,
    setPagination,
    debouncedSearch,
    hasFetchedOnce,
  };
}

type StudentsState = ReturnType<typeof useStudentsState>;

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function useStudentsLoaders(state: StudentsState) {
  const {
    debouncedSearch,
    isLoading,
    isPaginating,
    page,
    pagination,
    hasFetchedOnce,
    setStudents,
    setPagination,
    setPage,
    setError,
    setIsLoading,
    setIsRefreshing,
    setIsPaginating,
  } = state;

  // Fetch students when search changes
  useEffect(() => {
    let cancelled = false;
    const fetchStudents = async () => {
      try {
        if (!hasFetchedOnce.current)
          setIsLoading(true);
        setError(null);
        const result = await fetchStudentPage({ page: 1, limit: DEFAULT_PAGE_SIZE, search: debouncedSearch });
        if (cancelled)
          return;
        setStudents(result.students);
        setPagination(result.pagination);
        setPage(1);
        hasFetchedOnce.current = true;
      }
      catch (err) {
        if (cancelled)
          return;
        setError(toErrorMessage(err, 'Failed to fetch students'));
      }
      finally {
        if (!cancelled)
          setIsLoading(false);
      }
    };
    fetchStudents();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, hasFetchedOnce, setError, setIsLoading, setPage, setPagination, setStudents]);

  const loadMore = useCallback(async () => {
    if (isPaginating || isLoading || !pagination.hasMore)
      return;
    try {
      setIsPaginating(true);
      const nextPage = page + 1;
      const result = await fetchStudentPage({ page: nextPage, limit: DEFAULT_PAGE_SIZE, search: debouncedSearch });
      setStudents(prev => [...prev, ...result.students]);
      setPagination(result.pagination);
      setPage(nextPage);
    }
    catch (err) {
      setError(toErrorMessage(err, 'Failed to load more students'));
    }
    finally {
      setIsPaginating(false);
    }
  }, [isPaginating, isLoading, page, pagination.hasMore, debouncedSearch, setError, setIsPaginating, setPage, setPagination, setStudents]);

  const refetch = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const result = await fetchStudentPage({ page: 1, limit: DEFAULT_PAGE_SIZE, search: debouncedSearch });
      setStudents(result.students);
      setPagination(result.pagination);
      setPage(1);
    }
    catch (err) {
      setError(toErrorMessage(err, 'Failed to fetch students'));
    }
    finally {
      setIsRefreshing(false);
    }
  }, [debouncedSearch, setError, setIsRefreshing, setPage, setPagination, setStudents]);

  // Silent reload for focus/auto refetch — identical to refetch() but never toggles
  // isRefreshing, so it cannot trigger the iOS RefreshControl spinner.
  const silentRefetch = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchStudentPage({ page: 1, limit: DEFAULT_PAGE_SIZE, search: debouncedSearch });
      setStudents(result.students);
      setPagination(result.pagination);
      setPage(1);
    }
    catch (err) {
      setError(toErrorMessage(err, 'Failed to fetch students'));
    }
  }, [debouncedSearch, setError, setPage, setPagination, setStudents]);

  return { loadMore, refetch, silentRefetch };
}

export function useStudents(): UseStudentsResult {
  const state = useStudentsState();
  const { loadMore, refetch, silentRefetch } = useStudentsLoaders(state);
  const { setSearchState } = state;

  const setSearch = useCallback((newSearch: string) => {
    setSearchState(newSearch);
  }, [setSearchState]);

  return {
    students: state.students,
    pagination: state.pagination,
    isLoading: state.isLoading,
    isRefreshing: state.isRefreshing,
    isPaginating: state.isPaginating,
    error: state.error,
    search: state.search,
    setSearch,
    loadMore,
    refetch,
    silentRefetch,
  };
}
