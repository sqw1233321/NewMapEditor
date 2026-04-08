// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { attrPanelTypeRoom } from "../type/types";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrPanelRoom extends cc.Component {

    @property(cc.EditBox)
    width: cc.EditBox;

    @property(cc.EditBox)
    height: cc.EditBox;

    private _dat: attrPanelTypeRoom;

    setAttr(dat: attrPanelTypeRoom) {
        this._dat = dat;
        this.width.string = `${dat.size.width}`;
        this.height.string = `${dat.size.height}`;
    }

    public getDat(): attrPanelTypeRoom {
        return {
            size: { width: Number(this.width.string), height: Number(this.height.string) },
            unLockPoints: []
        }
    }
}
