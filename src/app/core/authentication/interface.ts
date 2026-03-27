export interface User {
  // Index signature to allow for any additional properties
  [prop: string]: any;

  // Identity & JWT Claims
  jti?: string;
  sub?: string;           // Usually maps to your User ID
  unique_name?: string;   // Usually the username
  given_name?: string;    // First Name
  family_name?: string;   // Last Name
  email?: string;

  // Custom Application Claims
  DepartmentId?: string;
  CompanyRole?: string;

  // Security/Token Timestamps
  nbf?: number;           // Not Before
  exp?: number;           // Expiration
  iss?: string;           // Issuer
  aud?: string;           // Audience

  // Keeping original fields for compatibility (optional)
  id?: number | string | null;
  avatar?: string;
  roles?: any[];
  permissions?: any[];
}
export interface Token {
  [prop: string]: any;

  access_token: string;
  token_type?: string;
  expires_in?: number;
  exp?: number;
  refresh_token?: string;
}
