// I use to hide the appliation logs on testing to make the tests result clear
const originalConsole = global.console;

beforeAll(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});

afterAll(() => {
  global.console = originalConsole;
});

// the test files must have at leat one test - Avoiding Jest to fail
describe('Setup Test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
})