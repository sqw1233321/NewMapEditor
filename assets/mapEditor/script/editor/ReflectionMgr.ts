export class ReflectionMgr {

    static _classMap: Map<string, Function> = new Map();

    static registerClass(name: string, cls: Function) {
        this._classMap.set(name, cls);
    }

    static getClass(name: string) {
        return this._classMap.get(name);
    }

}
