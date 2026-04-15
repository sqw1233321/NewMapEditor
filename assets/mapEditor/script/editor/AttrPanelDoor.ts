import { attrPanelTypeDoor } from "../type/types";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrPanelDoor extends cc.Component {

    @property(cc.EditBox)
    roomLb: cc.EditBox;

    @property(cc.EditBox)
    hpLb: cc.EditBox;

    private _dat: attrPanelTypeDoor;

    setAttr(dat: attrPanelTypeDoor) {
        this._dat = dat;
        this.roomLb.string = this._dat.roomId;
        this.hpLb.string = `${this._dat.hp}`;
    }

    public getDat(): attrPanelTypeDoor {
        return {
            roomId: this.roomLb.string,
            hp: Number(this.hpLb.string),
        }
    }
}
