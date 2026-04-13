// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { attrPanelTypeLadder } from "../type/types";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrPanelLadder extends cc.Component {

    @property(cc.EditBox)
    roomLb: cc.EditBox;

    @property(cc.Label)
    startP: cc.Label;

    @property(cc.Label)
    endP: cc.Label;

    private _dat: attrPanelTypeLadder;

    setAttr(dat: attrPanelTypeLadder) {
        this._dat = dat;
        this.roomLb.string = this._dat.roomId;
        this.startP.string = this._dat.bindPointIds[0];
        this.endP.string = this._dat.bindPointIds[1];
    }

    public getDat(): attrPanelTypeLadder {
        return {
            roomId: this.roomLb.string,
            bindPointIds: [this.startP.string, this.endP.string]
        }
    }
}
