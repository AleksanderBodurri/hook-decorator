const Hook = (config: {
    beforeAction: (...args: any[]) => any,
    options?: {
        patchAngular: boolean
    }
}) => {
    return (constructor: any) => {
        console.log({constructor});
        Object.getOwnPropertyNames(constructor.prototype).filter(key => key !== 'constructor').forEach(key => {
            if (key === 'ngOnInit') {
                const originalAngular = constructor.ɵcmp.onInit;
                constructor.ɵcmp.onInit = function(): any {
                    config.beforeAction();
                    return originalAngular.apply(this, arguments);
                };
            }

            const original = constructor.prototype[key];
            constructor.prototype[key] = function(): any {
                config.beforeAction();
                return original.apply(this, arguments);
            };
        });
    };
};
