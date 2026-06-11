import MapDrawItem from "../editor/mapDrawElement/MapDrawItem";
import { ReflectionMgr } from "../editor/ReflectionMgr";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawCommonController extends MapDrawItem {
    //初始化之后执行
    protected onAfterInit() {
        const dat = this._canEditdat;
        const iconPath = dat.icon;
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
        const iconPath = dat.icon;
        const spinePath = dat.spine;
        if (iconPath) {
            this.setSprite(this._unitType, iconPath);
        }
        if (spinePath) {
            this.setSpine(this._unitType, spinePath);
        }
    }
}

ReflectionMgr.registerClass('MapDrawCommonController', MapDrawCommonController);
