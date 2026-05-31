import { UnitType } from "../type/mapTypes";
import DynamicGetter from "./DynamicGetter/DynamicGetter";

export class ReflectionMgr {

    static _classMap: Map<string, Function> = new Map();

    static registerClass(name: string, cls: Function) {
        this._classMap.set(name, cls);
    }

    static getClass(name: string) {
        return this._classMap.get(name);
    }

    //工具方法
    static getMapDrawClass(type: UnitType) {
        const settings = DynamicGetter.Ins.getItemSetting();
        const script = settings.find((t: any) => t.ClassName === type)?.script;
        if (script) {
            return ReflectionMgr.getClass(script);
        }
        return ReflectionMgr.getClass("MapDrawItem");
    }

}
