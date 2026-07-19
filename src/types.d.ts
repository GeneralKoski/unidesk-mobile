// Tipi globali dell'applicazione

/** Record generico chiave-valore */
type Values = Record<string, any>;

/** Risposta standard dell'API */
interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  errors?: Record<string, string>;
  success?: boolean;
  statusCode?: number;
}

/** Metadati paginazione (Laravel-style) */
interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
