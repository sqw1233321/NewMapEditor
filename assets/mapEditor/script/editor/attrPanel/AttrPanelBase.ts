import { attrPanelTypeBase } from "../../type/types";
import AttrPanel from "./AttrPanel";

const { ccclass, property } = cc._decorator;

//属性面板基础属性
@ccclass
export default class AttrPanelBase extends AttrPanel {
    @property(cc.Label)
    ndName: cc.Label

    @property(cc.EditBox)
    xPos: cc.EditBox;

    @property(cc.EditBox)
    yPos: cc.EditBox;

    private _dat: attrPanelTypeBase;

    setAttr(dat: attrPanelTypeBase) {
        this._dat = dat;
        this.ndName.string = dat.name;
        this.xPos.string = `${dat.pos.x}`;
        this.yPos.string = `${dat.pos.y}`;
    }

    public getDat(): attrPanelTypeBase {
        return {
            pos: cc.v2(Number(this.xPos.string), Number(this.yPos.string)),
            name: this._dat.name
        }
    }
}
