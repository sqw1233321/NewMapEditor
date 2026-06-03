import MapDrawItem from "../editor/mapDrawElement/MapDrawItem";
import { ReflectionMgr } from "../editor/ReflectionMgr";


const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawPortal extends MapDrawItem {
    static getUniqueType(dat): number {
        const uniqueType = dat["portalType"] ?? -1;
        return uniqueType;
    }

    protected getDefaultDat(): any {
        const dat = super.getDefaultDat();
        dat["portalType"] = this._uniqueType;
        return dat;
    }

}

ReflectionMgr.registerClass('MapDrawPortal', MapDrawPortal);
