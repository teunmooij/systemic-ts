/**
 * Pass in boolean type and call required matcher. If match fails, you'll get a type error.
 */
export const expectType = <TActual extends boolean>(): BooleanMatcher<TActual> =>
  ({
    toBeTrue: () => {
      /* irrelevant */
    },
    toBeFalse: () => {
      /* irrelevant */
    },
  }) as any;

/**
 * Pass in types and call required matcher. If match fails, you'll get a type error.
 */
export const expectTypes = <TActual, TExpected>(): Matcher<TActual, TExpected> =>
  ({
    toBeEqual: () => {
      /* irrelevant */
    },
  }) as Matcher<TActual, TExpected>;

type Matcher<TActual, TExpected> = {
  toBeEqual: [TExpected, TActual, IsAny<TActual>] extends [TActual, TExpected, IsAny<TExpected>]
    ? () => void
    : (error: "Types are not equal", expected: TExpected, actual: TActual) => void;
};

type BooleanMatcher<TActual extends boolean> = TActual extends true
  ? TActual extends false
    ? { toBeTrue: "Actual is a boolean"; toBeFalse: "Actual is a boolean" }
    : { toBeTrue: () => void; toBeFalse: "Actual is true" }
  : TActual extends false
    ? { toBeTrue: "Actual is false"; toBeFalse: () => void }
    : { toBeTrue: "Actual is not a boolean"; toBeFalse: "Actual is not a boolean" };

type IsAny<T> = true extends T & false ? true : false;
