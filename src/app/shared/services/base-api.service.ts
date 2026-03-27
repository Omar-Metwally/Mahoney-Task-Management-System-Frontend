import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

// ─── Mirrors ──────────────────────────────────────────────────────────────────

export interface PaginationParameters {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
  searchTerm?: string;
  startDate?: string; // ISO 8601
  endDate?: string; // ISO 8601
}

export interface PagedResult<T> {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  data: T[];
}

export interface Result<T = void> {
  isSuccess: boolean;
  isFailed: boolean;
  statusCode: number; // HttpStatusCode int value
  message: string;
  value: T | null;
  result: T | null;
  errors: { message: string }[];
}

// ─── Base Service ─────────────────────────────────────────────────────────────

export abstract class BaseApiService<
  TDto, // read model (what the API returns)
  TCreateDto = TDto, // write model for create
  TUpdateDto = TCreateDto, // write model for update (defaults to create)
  TId = number, // id type (number | string | guid etc.)
> {
  /**
   * Each concrete service must supply its own segment, e.g. 'tasks' or 'users'.
   * The full URL becomes: `${apiBase}/${endpoint}`.
   */
  protected abstract readonly endpoint: string;

  constructor(
    protected readonly http: HttpClient,
    protected readonly apiBase = environment.baseUrl
  ) {}

  // ── helpers ──────────────────────────────────────────────────────────────

  protected get baseUrl(): string {
    return `${this.apiBase}/${this.endpoint}`;
  }

  // /**
  //  * Converts a PaginationParameters object into Angular HttpParams,
  //  * omitting any undefined / null fields so the query string stays clean.
  //  */
  // protected buildPaginationParams(params: PaginationParameters): HttpParams {
  //   let httpParams = new HttpParams();

  //   const add = (key: string, value: unknown): void => {
  //     if (value !== undefined && value !== null && value !== '') {
  //       httpParams = httpParams.set(key, String(value));
  //     }
  //   };

  //   add('pageNumber', params.pageNumber ?? 1);
  //   add('pageSize', params.pageSize ?? 10);
  //   add('sortBy', params.sortBy);
  //   add('sortDescending', params.sortDescending);
  //   add('searchTerm', params.searchTerm);
  //   add('startDate', params.startDate);
  //   add('endDate', params.endDate);

  //   return httpParams;
  // }

  protected buildPaginationParams(
    params: PaginationParameters,
    filters: Record<string, any> = {}
  ): HttpParams {
    let httpParams = new HttpParams();

    // Core pagination
    const add = (key: string, value: unknown): void => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    };

    add('pageNumber', params.pageNumber ?? 1);
    add('pageSize', params.pageSize ?? 10);
    add('sortBy', params.sortBy);
    add('sortDescending', params.sortDescending);
    add('searchTerm', params.searchTerm);
    add('startDate', params.startDate);
    add('endDate', params.endDate);

    // Domain-specific filters
    Object.entries(filters).forEach(([key, value]) => {
      add(key, value);
    });

    return httpParams;
  }

  // ── CRUD methods ─────────────────────────────────────────────────────────

  /**
   * GET /{endpoint}?pageNumber=1&pageSize=10&...
   * Returns a paginated list wrapped in Result<PagedResult<TDto>>.
   */
  getPaginated(
    params: PaginationParameters = {},
    filters: Record<string, any> = {}
  ): Observable<Result<PagedResult<TDto>>> {
    return this.http.get<Result<PagedResult<TDto>>>(this.baseUrl, {
      params: this.buildPaginationParams(params, filters),
    });
  }

  /**
   * GET /{endpoint}/{id}
   */
  getById(id: TId): Observable<Result<TDto>> {
    return this.http.get<Result<TDto>>(`${this.baseUrl}/${id}`);
  }

  /**
   * POST /{endpoint}
   */
  add(body: TCreateDto): Observable<Result<TDto>> {
    return this.http.post<Result<TDto>>(this.baseUrl, body);
  }

  /**
   * PUT /{endpoint}/{id}
   */
  edit(id: TId, body: TUpdateDto): Observable<Result<TDto>> {
    return this.http.put<Result<TDto>>(`${this.baseUrl}/${id}`, body);
  }

  /**
   * DELETE /{endpoint}/{id}
   */
  delete(id: TId): Observable<Result<void>> {
    return this.http.delete<Result<void>>(`${this.baseUrl}/${id}`);
  }
}
