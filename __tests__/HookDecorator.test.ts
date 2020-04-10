import { Hook } from '../src';

const consoleOutput: string[] = [];

@Hook({
  beforeAction: () => consoleOutput.push('hello'),
})
class Logger {
  log(s: string): void {
    consoleOutput.push(s);
  }
}

describe('Hook', () => {
  it('should output hello world', () => {
    const logger = new Logger();
    logger.log('world');
    expect(consoleOutput).toEqual(['hello', 'world']);
  });
});
