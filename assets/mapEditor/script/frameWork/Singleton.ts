export abstract class Singleton<T> {

    private static _instanceMap: Map<any, any> = new Map();
    protected _inited: boolean = false;
    public static get instance(): any {
        const self = this as any;

        if (!Singleton._instanceMap.has(self)) {
            Singleton._instanceMap.set(self, new self());
        }
        return Singleton._instanceMap.get(self);
    }

    public init(...params): void {
        if (this._inited) return;
        this._inited = true;

        this.onInit(params);
    }

    /** 销毁入口 */
    public destroy(): void {
        if (!this._inited) return;
        this._inited = false;

        this.onDestroy();

        const cls = this.constructor as any;
        Singleton._instanceMap.delete(cls);
    }

    /** 子类实现初始化逻辑 */
    protected onInit(...params): void { }

    /** 子类实现销毁逻辑 */
    protected onDestroy(): void { }
}