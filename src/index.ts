type ClassDecorator = (constructor: any) => void;
type Callback = () => any;

interface HookConfigOptions {
  patchAngular: boolean;
}

export interface HookConfig {
  beforeAction?: Callback;
  afterAction?: Callback;
  options?: HookConfigOptions;
}

const angularLifeCycleInternalMappings: { [key: string]: string } = {
  ngOnChanges: 'onChanges',
  ngOnInit: 'onInit',
  ngDoCheck: 'doCheck',
  ngAfterContentInit: 'afterContentInit',
  ngAfterContentChecked: 'afterContentChecked',
  ngAfterViewInit: 'afterViewInit',
  ngAfterViewChecked: 'afterViewChecked',
  ngOnDestroy: 'onDestroy',
};

export const Hook = (config: HookConfig): ClassDecorator => {
  const { beforeAction, afterAction } = config;
  return (constructor) => {
    if (!beforeAction && !afterAction) {
      return;
    }
    Object.getOwnPropertyNames(constructor.prototype)
      .filter((key) => key !== 'constructor')
      .forEach((key) => assertFunction(constructor.prototype[key]) && applyHook(constructor, key, config));
  };
};

const assertFunction = (value: any) => {
  return typeof value === 'function';
};

const applyHook = (constructor: any, key: string, config: HookConfig) => {
  const { options } = config;

  parseAndPatch(constructor.prototype, key, config);

  if (options?.patchAngular && constructor.ɵcmp && angularLifeCycleInternalMappings[key]) {
    parseAndPatchAngular(constructor.ɵcmp, angularLifeCycleInternalMappings[key], config);
  }
};

const parseAndPatch = (functionToPatchParent: Function, keyToFunction: string, config: HookConfig) => {
  const { beforeAction, afterAction } = config;

  if (beforeAction && afterAction) {
    patchWithBeforeAndAfter(functionToPatchParent, keyToFunction, beforeAction, afterAction);
  } else if (beforeAction) {
    patchWithBefore(functionToPatchParent, keyToFunction, beforeAction);
  } else if (afterAction) {
    patchWithAfter(functionToPatchParent, keyToFunction, afterAction);
  }
};

const parseAndPatchAngular = (componentMetadata: any, lifecycle: string, config: HookConfig) => {
  const lifecycleToPatch = componentMetadata[lifecycle];
  if (!lifecycleToPatch) {
    return;
  }

  parseAndPatch(componentMetadata, lifecycle, config);
};

const patchWithBefore = (functionToPatchParent: Function, keyToFunction: string, before: Callback) => {
  const original = functionToPatchParent[keyToFunction];
  functionToPatchParent[keyToFunction] = function (): any {
    before.call(this);
    return original.apply(this, arguments);
  };
};

const patchWithAfter = (functionToPatchParent: Function, keyToFunction: string, after: Callback) => {
  const original = functionToPatchParent[keyToFunction];
  functionToPatchParent[keyToFunction] = function (): any {
    const result = original.apply(this, arguments);
    after.call(this);
    return result;
  };
};

const patchWithBeforeAndAfter = (
  functionToPatchParent: Function,
  keyToFunction: string,
  before: Callback,
  after: Callback
) => {
  const original = functionToPatchParent[keyToFunction];
  functionToPatchParent[keyToFunction] = function (): any {
    before.call(this);
    const result = original.apply(this, arguments);
    after.call(this);
    return result;
  };
};
