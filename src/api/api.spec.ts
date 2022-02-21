import { paths } from "../types/open-api-schema-types";

const keysOf = Object.keys as <T extends Record<string, unknown>>(
  obj: T
) => Array<keyof T>;

/**
 * Type for an array with at least one element
 */
type ArrayOneOrMore<T> = [T, ...T[]];

/**
 * Union of all API paths
 */
type RoutePaths = keyof paths;
/**
 * A tests case, to be run by `jest`
 */
type TestCase = {
  title: string;
  it: () => Promise<void>;
};
type Methods<T extends keyof paths> = () => {
  GET: "get" extends keyof paths[T] ? ArrayOneOrMore<TestCase> : null;
  POST: "post" extends keyof paths[T] ? ArrayOneOrMore<TestCase> : null;
  PATCH: "patch" extends keyof paths[T] ? ArrayOneOrMore<TestCase> : null;
  PUT: "put" extends keyof paths[T] ? ArrayOneOrMore<TestCase> : null;
  DELETE: "delete" extends keyof paths[T] ? ArrayOneOrMore<TestCase> : null;
};

const METHODS = {
  GET: null,
  POST: null,
  PUT: null,
  PATCH: null,
  DELETE: null,
};

const PATH_TESTS: { [path in RoutePaths]: Methods<path> } = {
  "/todos/": () => {
    return {
      ...METHODS,
      GET: [{ title: "", it: async () => {} }],
      POST: [{ title: "", it: async () => {} }],
      PUT: [{ title: "", it: async () => {} }],
      DELETE: [{ title: "", it: async () => {} }],
    };
  },
};

/**
 * Generates tests cases given an ENDPOINTS object.
 *
 * Iterates all the paths in the object, traversing every path / method and tests for each one.
 */
const testGenerator = (endpoints: typeof PATH_TESTS) => {
  const allPaths = keysOf(endpoints);

  // iterate all paths
  allPaths.forEach((path) => {
    const pathTests = endpoints[path]();

    // extract the path methods
    const pathMethods = keysOf(pathTests);

    describe(`${path}`, () => {
      pathMethods.forEach((method) => {
        // may be null for path methods not present in the specification
        const pathMethodTests = pathTests[method] || [];

        pathMethodTests.forEach((testCase) => {
          it(`[${method.toUpperCase()}] ${testCase.title}`, async () => {
            await testCase.it();
          });
        });
      });
    });
  });
};

describe("Endpoint tests", () => {
  testGenerator(PATH_TESTS);
});
