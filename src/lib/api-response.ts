import { NextResponse } from 'next/server';

/**
 * Standard API response format for success responses
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json({
    status,
    data
  }, { status });
}

/**
 * Standard API response format for error responses
 */
export function apiError(message: string, status: number = 500, errors?: any) {
  return NextResponse.json({
    status,
    error: message,
    ...(errors ? { errors } : {})
  }, { status });
}

/**
 * Standard API response format for validation errors
 */
export function apiValidationError(errors: Record<string, string[]>, message: string = 'Validation failed') {
  return NextResponse.json({
    status: 422,
    error: message,
    errors
  }, { status: 422 });
}

/**
 * Standard API response format for unauthorized access
 */
export function apiUnauthorized(message: string = 'Unauthorized') {
  return NextResponse.json({
    status: 401,
    error: message
  }, { status: 401 });
}

/**
 * Standard API response format for forbidden access
 */
export function apiForbidden(message: string = 'Forbidden') {
  return NextResponse.json({
    status: 403,
    error: message
  }, { status: 403 });
}

/**
 * Standard API response format for not found resources
 */
export function apiNotFound(message: string = 'Not found') {
  return NextResponse.json({
    status: 404,
    error: message
  }, { status: 404 });
}

/**
 * Standard API response format for successful deletion (no content)
 */
export function apiNoContent() {
  return NextResponse.json(null, { status: 204 });
}

/**
 * Standard API response format for created resources
 */
export function apiCreated<T>(data: T) {
  return NextResponse.json({
    status: 201,
    data
  }, { status: 201 });
} 