export type AuthApiResult<T> = {
  ok: boolean;
  status: number;
  data: T;
  location: string | null;
};

export type AuthorizeStartResponse = {
  result?: "redirect" | "error";
  redirect_url?: string;
  session_id?: string;
  response_code?: string;
  message?: string;
  raw?: string;
};

export type LoginResponse = {
  result?: "redirect" | "logged_in" | "error";
  response_code?: string;
  message?: string;
  raw?: string;
};

export type SignupResponse = {
  StatusCode?: string;
  Message?: string;
  VerifyUrl?: string;
  statusCode?: string;
  message?: string;
  verifyUrl?: string;
  raw?: string;
};

export type TermsResponse = {
  client_id?: string;
  terms?: TermItem[];
  scopes?: string[];
  response_code?: string;
  message?: string;
  raw?: string;
};

export type TermItem = {
  term_id: string;
  title: string;
  version: string;
  required: boolean;
};

export type TermsSubmitResponse = {
  result?: "redirect" | "error";
  error?: string;
  response_code?: string;
  message?: string;
  raw?: string;
};

export type TokenResponse = {
  response_code?: string;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  scope?: string;
  id_token?: string;
  message?: string;
  raw?: string;
};

export type UserInfoResponse = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  response_code?: string;
  message?: string;
  raw?: string;
  [claim: string]: unknown;
};
