import MapDrawUnitBase from "./MapDrawUnitBase";
import { MechanismDefine, MechanismInstance } from "../type/MechanismDefine";
import { MechanismMgr } from "../frameWork/MechanismMgr";
import { UnitType } from "../type/mapTypes";
import prefabPanelBase from "../editor/prefabPanel/prefabPanelBase";
import { ResLoader } from "../frameWork/ResLoader";

const { ccclass, property } = cc._decorator;

/**
 * 机制项选择面板基类
 * 所有动态机制实例的基类，提供统一的字段存取接口
 */
@ccclass
export default class MechanismPrefab extends prefabPanelBase {
    @property(cc.Label)
    nameLabel: cc.Label = null;

    @property(cc.Sprite)
    defaultSp: cc.Sprite = null;

    private _defData: MechanismDefine = null;

    init(def: MechanismDefine) {
        this._defData = def;
        this.setUI();
    }

    private setUI() {
        this.nameLabel.string = this._defData.name;
        this.defaultSp.spriteFrame = ResLoader.loadAssetSync(this._defData.spritePath, cc.SpriteFrame);
    }
}
