import { NodeUtil } from "../tool/NodeUtil";
import { attrPanelTypeRoom } from "../type/types";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrPanelRoom extends cc.Component {

    @property(cc.EditBox)
    width: cc.EditBox;

    @property(cc.EditBox)
    height: cc.EditBox;

    @property(cc.Node)
    pointCont: cc.Node;

    private _dat: attrPanelTypeRoom;

    setAttr(dat: attrPanelTypeRoom) {
        this._dat = dat;
        this.width.string = `${dat.size.width}`;
        this.height.string = `${dat.size.height}`;
        NodeUtil.autoRefreshChildren(this.pointCont, this._dat.unLockPoints, (nd, index, dat) => {
            const nameLb = nd.children[0].children[0].getComponent(cc.Label);
            nameLb.string = dat;
        })
    }

    public getDat(): attrPanelTypeRoom {
        const links = this.pointCont.children.map((nd) => {
            return nd.children[0].children[0].getComponent(cc.Label).string;
        });
        return {
            size: { width: Number(this.width.string), height: Number(this.height.string) },
            unLockPoints: links
        }
    }
}
