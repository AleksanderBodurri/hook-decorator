import { Hook } from '../src';

let consoleOutput: string[] = [];

@Hook({
  beforeAction: {
    callback: () => consoleOutput.push('hello'),
    only: ['log'],
  },
  afterAction: {
    callback: () => consoleOutput.push('alone'),
    except: ['log'],
  },
})
class Logger {
  log(s: string): void {
    consoleOutput.push(s);
  }

  clear(): void {
    consoleOutput = [];
  }
}

describe('Hook', () => {
  it('should fire before callback only on calling log method', () => {
    const logger = new Logger();
    logger.log('world');
    expect(consoleOutput).toEqual(['hello', 'world']);
    logger.clear();
    expect(consoleOutput).toEqual(['alone']);
  });
});
