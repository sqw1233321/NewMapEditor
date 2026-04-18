// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { attrPanelTypeSurviveRefresh } from "../../type/types";
import AttrPanel from "./AttrPanel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrPanelSurviveRefresh extends AttrPanel {

    @property(cc.EditBox)
    roomLb: cc.EditBox;

    @property(cc.EditBox)
    weightLb: cc.EditBox;

    private _dat: attrPanelTypeSurviveRefresh;

    setAttr(dat: attrPanelTypeSurviveRefresh) {
        this._dat = dat;
        this.roomLb.string = this._dat.roomId;
        this.weightLb.string = this._dat.weight.toString();
    }

    public getDat(): attrPanelTypeSurviveRefresh {
        return {
            roomId: this.roomLb.string,
            weight: Number(this.weightLb.string),
        }
    }
}
