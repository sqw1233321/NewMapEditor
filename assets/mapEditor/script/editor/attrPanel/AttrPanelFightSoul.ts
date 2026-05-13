import { attrPanelTypeFightSoul } from "../../type/types";
import AttrPanel from "./AttrPanel";


const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrPanelFightSoul extends AttrPanel {
    @property(cc.EditBox)
    roomLb: cc.EditBox;

    @property(cc.EditBox)
    weightLb: cc.EditBox;

    @property(cc.Toggle)
    isGuideToggle: cc.Toggle;

    private _dat: attrPanelTypeFightSoul;

    setAttr(dat: attrPanelTypeFightSoul) {
        this._dat = dat;
        this.roomLb.string = this._dat.roomId;
        this.weightLb.string = this._dat.weight.toString();
        this.isGuideToggle.isChecked = this._dat.isGuide;
    }

    public getDat(): attrPanelTypeFightSoul {
        return {
            roomId: this.roomLb.string,
            weight: Number(this.weightLb.string),
            isGuide: this.isGuideToggle.isChecked
        }
    }
}
