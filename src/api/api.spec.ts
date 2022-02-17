import { paths } from "../types/open-api-schema-types";

type Paths = keyof paths;
/**
 * Contains the test cases, within an array.
 * Missing tests will throw, unless they are explictly marked as `skip: true`
 */
type TestCases = Array<{
  skip?: boolean;
  title?: string;
  it?: () => Promise<void>;
}>;
type MethodTests = {
  beforeEach?: () => void;
  testCases: TestCases;
};
type Methods<T extends keyof paths> = () => {
  // TODONOW: refactor for cleaningness
  get: "get" extends keyof paths[T] ? MethodTests : undefined;
  post: "post" extends keyof paths[T] ? MethodTests : undefined;
  put: "put" extends keyof paths[T] ? MethodTests : undefined;
  delete: "delete" extends keyof paths[T] ? MethodTests : undefined;
};
type EndpointTests = { [path in Partial<Paths>]: Methods<path> };

const ENDPOINTS: EndpointTests = {
  "/todos/": () => {
    return {
      get: {
        testCases: [{ it: async () => {} }],
      },
      post: {
        testCases: [{ it: async () => {} }],
      },
      put: {
        testCases: [{ it: async () => {} }],
      },
      delete: {
        testCases: [{ it: async () => {} }],
      },
    };
  },
};

const keysOf = Object.keys as <T extends Record<string, unknown>>(
  obj: T
) => Array<keyof T>;

/**
 * Generates tests cases given an ENDPOINTS object.
 * Support `skip`, `beforeEach` and multiple tests per endpoint / method.
 *
 * Iterates all the paths in the object, traversion every method and tests for each one.
 *
 * Test can not be empty arrays nor miss the `it` property, unless they are explicitly skipped.
 */
const testGenerator = (endpoints: typeof ENDPOINTS) => {
  const allPaths = keysOf(endpoints);

  // iterate all paths
  allPaths.forEach((path) => {
    const endpointTests = endpoints[path]() ?? {};

    // extract the path operation, looking into the response of the closure
    const operations: string[] = keysOf(endpointTests).filter(
      (op) => get(endpoints[path](), `${op}`, null) !== null
    );

    describe(`${path}`, () => {
      operations.forEach((operation) => {
        const methodTests: MethodTests = get(
          endpointTests,
          `${operation}`,
          null
        );

        if (!methodTests) return;

        if (methodTests.beforeEach) {
          beforeEach(methodTests.beforeEach);
        }

        if (methodTests.testCases.length === 0) {
          throw `missing test cases for [${operation.toUpperCase()}] ${path}. Add a test or explicitly skip it, with 'skip: true'`;
        }

        methodTests.testCases.forEach((testCase) => {
          if (testCase.skip) {
            it.skip(`[${operation.toUpperCase()}]`, () => null);
            return;
          }

          if (!testCase.it) {
            throw `missing test case for [${operation.toUpperCase()}] ${path}. Add it with 'it: async () => {}'`;
          }

          it(`[${operation.toUpperCase()}] ${
            testCase.title || ""
          }`, async () => {
            testCase.it
              ? await testCase.it()
              : (() => {
                  throw `missing test for [${operation.toUpperCase()}] ${path}`;
                })();
          });
        });
      });
    });
  });
};

describe("testGenerator", () => {
  describe.skip("should throw if the test cases is an empty array", () => {
    testGenerator({
      "/new-endpoint/": () => {
        return {
          ...EMPTY_OPERATIONS,
          get: {
            testCases: [],
          },
        };
      },
    } as any);
  });

  describe.skip("should throw if the test case is an empty object", () => {
    testGenerator({
      "/new-endpoint/": () => {
        return {
          ...EMPTY_OPERATIONS,
          get: {
            testCases: [{}],
          },
        };
      },
    } as any);
  });

  describe("should skip test marked with skip", () => {
    testGenerator({
      "/new-endpoint/": () => {
        return {
          ...EMPTY_OPERATIONS,
          get: {
            testCases: [
              {
                skip: true,
                it: async () => expect(true).toBe(false), // this will fail the tests if run
              },
            ],
          },
        };
      },
    } as any);
  });

  describe("should run multiple tests per endpoint and operation", () => {
    testGenerator({
      "/new-endpoint/": () => {
        return {
          ...EMPTY_OPERATIONS,
          get: {
            testCases: [
              {
                title: "test 1",
                it: async () => expect(true).toBe(true),
              },
              {
                title: "test 2",
                it: async () => expect(true).toBe(true),
              },
            ],
          },
        };
      },
    } as any);
  });

  describe("should run before each per each test per endpoint and operation", () => {
    const beforeEach = jest.fn();

    testGenerator({
      "/new-endpoint/": () => {
        return {
          get: {
            beforeEach,
            testCases: [
              {
                title: "test 1",
                it: async () => {
                  expect(beforeEach).toHaveBeenCalledTimes(1);
                },
              },
              {
                title: "test 2",
                it: async () => expect(beforeEach).toHaveBeenCalledTimes(1),
              },
            ],
          },
        };
      },
    } as any);
  });
});

describe("App endpoint infrastructure tests", () => {
  testGenerator(ENDPOINTS);
});
