import { AttrPanelPropertyType } from "../../type/mapTypes";
import AttrPanelItemBase from "./AttrPanelItemBase";


const { ccclass, property } = cc._decorator;

//通用属性面板item,编辑boolean
@ccclass
export default class AttrPanelItemBoolean extends AttrPanelItemBase {
    @property(cc.Toggle)
    toggleBtn: cc.Toggle;

    private _dat;

    public init(cfg: AttrPanelPropertyType, cb: any, dat): void {
        super.init(cfg, cb);
        this._dat = dat;
        this.setUI();
    }

    private setUI() {
        this.descLb.string = this._cfg.Name;
        this.toggleBtn.isChecked = this._dat;
    }


    public getDat() {
        return this.toggleBtn.isChecked;
    }
}
