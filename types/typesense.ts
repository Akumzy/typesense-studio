export interface TypesenseConfig {
  nodes: TypesenseNode[]
  apiKey: string
  connectionTimeoutSeconds?: number
  healthcheckIntervalSeconds?: number
  numRetries?: number
  retryIntervalSeconds?: number
}

export interface TypesenseNode {
  host: string
  port: number
  protocol: "http" | "https"
}

export interface CollectionSchema {
  name: string
  fields: CollectionField[]
  default_sorting_field?: string
  token_separators?: string[]
  symbols_to_index?: string[]
  enable_nested_fields?: boolean
}

export interface CollectionField {
  name: string
  type:
    | "string"
    | "int32"
    | "int64"
    | "float"
    | "bool"
    | "geopoint"
    | "string[]"
    | "int32[]"
    | "int64[]"
    | "float[]"
    | "bool[]"
    | "object"
    | "object[]"
    | "auto"
  facet?: boolean
  optional?: boolean
  index?: boolean
  sort?: boolean
  infix?: boolean
  locale?: string
}

export interface SearchParameters {
  q: string
  query_by: string
  query_by_weights?: string
  prefix?: boolean | string
  filter_by?: string
  sort_by?: string
  facet_by?: string
  max_facet_values?: number
  facet_query?: string
  num_typos?: string | number
  page?: number
  per_page?: number
  group_by?: string
  group_limit?: number
  include_fields?: string
  exclude_fields?: string
  highlight_fields?: string
  highlight_full_fields?: string
  highlight_affix_num_tokens?: number
  highlight_start_tag?: string
  highlight_end_tag?: string
  snippet_threshold?: number
  drop_tokens_threshold?: number
  typo_tokens_threshold?: number
  pinned_hits?: string
  hidden_hits?: string
  enable_overrides?: boolean
  pre_segmented_query?: boolean
  vector_query?: string
  remote_embedding_timeout_ms?: number
  remote_embedding_num_tries?: number
}

export interface SearchResponse<T = any> {
  facet_counts?: FacetCount[]
  found: number
  hits: SearchHit<T>[]
  out_of: number
  page: number
  request_params: SearchParameters
  search_time_ms: number
  search_cutoff?: boolean
}

export interface SearchHit<T = any> {
  document: T
  highlight?: Record<string, any>
  highlights?: SearchHighlight[]
  text_match: number
  text_match_info?: TextMatchInfo
}

export interface SearchHighlight {
  field: string
  snippet: string
  value?: string
  values?: string[]
}

export interface TextMatchInfo {
  best_field_score: string
  best_field_weight: number
  fields_matched: number
  score: string
  tokens_matched: number
}

export interface FacetCount {
  counts: FacetCountValue[]
  field_name: string
  stats?: FacetStats
}

export interface FacetCountValue {
  count: number
  highlighted: string
  value: string
}

export interface FacetStats {
  avg?: number
  max?: number
  min?: number
  sum?: number
}

export interface TypesenseError {
  message: string
  http_code: number
}
