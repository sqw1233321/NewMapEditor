// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { attrPanelTypeEnemyRefresh } from "../../type/types";
import AttrPanel from "./AttrPanel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrPanelEnemyRefresh extends AttrPanel {
    @property(cc.EditBox)
    roomLb: cc.EditBox;

    @property(cc.EditBox)
    paramLb: cc.EditBox;

    private _dat: attrPanelTypeEnemyRefresh;

    setAttr(dat: attrPanelTypeEnemyRefresh) {
        this._dat = dat;
        this.roomLb.string = this._dat.roomId;
        this.paramLb.string = this._dat.param;
    }

    public getDat(): attrPanelTypeEnemyRefresh {
        return {
            roomId: this.roomLb.string,
            param: this.paramLb.string,
        }
    }
}
