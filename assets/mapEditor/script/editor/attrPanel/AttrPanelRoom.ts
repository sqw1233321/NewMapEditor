import MapDrawP from "../../item/MapDrawP";
import { NodeUtil } from "../../tool/NodeUtil";
import { attrPanelTypeRoom } from "../../type/types";
import AttrPanel from "./AttrPanel";


const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrPanelRoom extends AttrPanel {
    @property(cc.EditBox)
    nameLb: cc.EditBox;

    @property(cc.EditBox)
    width: cc.EditBox;

    @property(cc.EditBox)
    height: cc.EditBox;

    @property(cc.Node)
    pointCont: cc.Node;

    private _dat: attrPanelTypeRoom;

    setAttr(dat: attrPanelTypeRoom) {
        this._dat = dat;
        this.nameLb.string = dat.roomId;
        this.width.string = `${dat.size.width}`;
        this.height.string = `${dat.size.height}`;
        NodeUtil.autoRefreshChildren(this.pointCont, this._dat.unLockPoints, (nd, index, dat) => {
            const nameLb = nd.children[0].children[0].getComponent(cc.Label);
            nameLb.string = dat?.getComponent(MapDrawP).getId() ?? "";
        })
    }

    public getDat(): attrPanelTypeRoom {
        return {
            roomId: this.nameLb.string,
            size: { width: Number(this.width.string), height: Number(this.height.string) },
            unLockPoints: this._dat.unLockPoints
        }
    }

    //选择可编辑点
    public onClickPoints() {
        this.onClickP(true, this.pointCont, this._dat.unLockPoints, (nodes: cc.Node[]) => {
            this._dat.unLockPoints = nodes;
        });
    }
}
