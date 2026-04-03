export type Result<T, E extends Error = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

export const Result = {
  ok<T>(value: T): Result<T, never> {
    return { success: true, value };
  },
  fail<E extends Error>(error: E): Result<never, E> {
    return { success: false, error };
  },
};
