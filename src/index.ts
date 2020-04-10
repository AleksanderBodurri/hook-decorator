type ClassDecorator = (constructor: any) => void;
type Callback = (classInstance?: any) => any;

interface HookConfigOptions {
  patchAngular: boolean;
}

interface Hook {
  callback: Callback;
  only?: string[];
  except?: string[];
}

export interface HookConfig {
  beforeAction?: Hook;
  afterAction?: Hook;
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
    if (!beforeAction?.callback && !afterAction?.callback) {
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

const patchWithBefore = (functionToPatchParent: Function, keyToFunction: string, before: Hook) => {
  const original = functionToPatchParent[keyToFunction];
  functionToPatchParent[keyToFunction] = function (): any {
    invokeHookCallback(before, this, keyToFunction);
    return original.apply(this, arguments);
  };
};

const patchWithAfter = (functionToPatchParent: Function, keyToFunction: string, after: Hook) => {
  const original = functionToPatchParent[keyToFunction];
  functionToPatchParent[keyToFunction] = function (): any {
    const result = original.apply(this, arguments);
    invokeHookCallback(after, this, keyToFunction);
    return result;
  };
};

const patchWithBeforeAndAfter = (functionToPatchParent: Function, keyToFunction: string, before: Hook, after: Hook) => {
  const original = functionToPatchParent[keyToFunction];
  functionToPatchParent[keyToFunction] = function (): any {
    invokeHookCallback(before, this, keyToFunction);
    const result = original.apply(this, arguments);
    invokeHookCallback(after, this, keyToFunction);
    return result;
  };
};

const invokeHookCallback = (hook: Hook, classInstance: any, functionName: string) => {
  const { callback, only, except } = hook;

  if (only || except) {
    if (only?.length) {
      const found = only.find((name) => name === functionName);
      found && callback.call(classInstance, classInstance);
    } else if (except?.length) {
      const found = except.find((name) => name === functionName);
      !found && callback.call(classInstance, classInstance);
    }
    return;
  }

  callback.call(classInstance, classInstance);
};
