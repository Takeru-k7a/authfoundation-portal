export type AuthApiResult<T> = {
  ok: boolean;
  status: number;
  data: T;
  location: string | null;
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
  term_id: number;
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
