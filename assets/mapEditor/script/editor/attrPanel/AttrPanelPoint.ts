import MapDrawP from "../../item/MapDrawP";
import { NodeUtil } from "../../tool/NodeUtil";
import { attrPanelTypePoint } from "../../type/types";
import AttrPanel from "./AttrPanel";


const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrPanelPoint extends AttrPanel {

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
            nameLb.string = dat.getComponent(MapDrawP).getId() ?? "";
        })

    }

    public getDat(): attrPanelTypePoint {
        return {
            roomId: this.roomLb.string,
            links: this._dat.links,
        }
    }

    //选择可编辑点
    public onClickPoints() {
        this.onClickP(true, this.pointCont, this._dat.links, (nodes: cc.Node[]) => {
            this._dat.links = nodes;
        });
    }
}
