export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterOptions<T> {
  field: keyof T;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex';
  value: any;
}

export interface QueryOptions<T> {
  pagination?: PaginationOptions;
  sort?: SortOptions[];
  filters?: FilterOptions<T>[];
  populate?: string[];
  select?: (keyof T)[];
} 