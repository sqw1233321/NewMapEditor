// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { NodeUtil } from "../tool/NodeUtil";
import { attrPanelTypePoint } from "../type/types";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrPanelPoint extends cc.Component {

    @property(cc.EditBox)
    roomLb: cc.EditBox;

    @property(cc.Node)
    pointCont: cc.Node;

    private _dat: attrPanelTypePoint;

    setAttr(dat: attrPanelTypePoint) {
        this._dat = dat;
        this.roomLb.string = this._dat.roomId;
        NodeUtil.autoRefreshChildren(this.pointCont, this._dat.links, (nd, index, dat) => {
            const nameLb = nd.children[0].children[0].getComponent(cc.Label);
            nameLb.string = dat;
        })

    }

    public getDat(): attrPanelTypePoint {
        const links = this.pointCont.children.map((nd) => {
            return nd.children[0].children[0].getComponent(cc.Label).string;
        });
        return {
            roomId: this.roomLb.string,
            links
        }
    }
}
