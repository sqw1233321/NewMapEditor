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

    //初始化之后执行
    protected onAfterInit() {
        const dat = this._canEditdat;
        const iconPath = dat.iconPath;
        const spinePath = dat.spine;
        if (iconPath) {
            this.setSprite(this._unitType, iconPath);
        }
        if (spinePath) {
            this.setSpine(this._unitType, spinePath);
        }
    }

    //属性变化时
    protected onAttrChange() {
        const dat = this._canEditdat;
        const iconPath = dat.iconPath;
        const spinePath = dat.spine;
        if (iconPath) {
            this.setSprite(this._unitType, iconPath);
        }
        if (spinePath) {
            this.setSpine(this._unitType, spinePath);
        }
    }

}

ReflectionMgr.registerClass('MapDrawPortal', MapDrawPortal);
