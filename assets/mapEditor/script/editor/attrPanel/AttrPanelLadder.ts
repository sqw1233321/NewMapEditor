import { attrPanelTypeLadder } from "../../type/types";
import AttrPanel from "./AttrPanel";


const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrPanelLadder extends AttrPanel {

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
