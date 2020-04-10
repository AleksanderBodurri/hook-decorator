[![npm version](https://badge.fury.io/js/hook-decorator.svg)](https://badge.fury.io/js/hook-decorator)

# hook-decorator

Inspired by rails action controller filters.

This decorator patches before/after hooks into every method (referred to in API as actions) defined by a class.

##Installation

```shell
npm i hook-decorator --save
```

## Usage

###Example

```typescript
import { Hook } from 'hook-decorator';

@Hook({
  beforeAction: {
    callback: (classInstance: Logger) => console.log(classInstance.pre),
  },
  afterAction: {
    callback: (classInstance: Logger) => console.log(classInstance.post),
  },
})
class Logger {
  pre = 'hello';
  post = '!';

  log(): void {
    console.log('world');
  }
}

const logger = new Logger();
logger.log();
// hello
// world
// !
```

### Configuration

```ts
export interface HookConfig {
  beforeAction?: Hook;
  afterAction?: Hook;
  options?: HookConfigOptions;
}

interface Hook {
  callback: Callback;
  only?: string[];
  except?: string[];
}

type Callback = (classInstance?: any) => any;

interface HookConfigOptions {
  patchAngular: boolean;
}
```

#### Angular lifecycles

Angular invokes lifecycle methods via internal data structures associated with the component. Because of this, overriding the lifecycle methods inside the class prototype does not change run time behaviour.

Include the `options: { patchAngular: true }` in your config to patch these internal methods.

## License

MIT
