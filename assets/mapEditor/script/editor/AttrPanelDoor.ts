// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

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
