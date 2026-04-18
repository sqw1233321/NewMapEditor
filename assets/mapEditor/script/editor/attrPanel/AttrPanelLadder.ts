import MapDrawP from "../../item/MapDrawP";
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

    @property(cc.Toggle)
    exitLadderToggle: cc.Toggle;

    private _dat: attrPanelTypeLadder;

    setAttr(dat: attrPanelTypeLadder) {
        this._dat = dat;
        this.roomLb.string = this._dat.roomId;
        this.startP.string = this._dat.bindPointIds[0]?.getComponent(MapDrawP).getId() ?? "";
        this.endP.string = this._dat.bindPointIds[1]?.getComponent(MapDrawP).getId() ?? "";
        this.exitLadderToggle.isChecked = this._dat.isExitLadder;
    }


    //选择起始点
    public onClickStart() {
        this.onClickP(false, this.startP.node, this._dat.bindPointIds[0], (nodes: cc.Node[]) => {
            this._dat.bindPointIds[0] = nodes[0];
        });
    }

    //选择终点
    public onClickEnd() {
        this.onClickP(false, this.endP.node, this._dat.bindPointIds[1], (nodes: cc.Node[]) => {
            this._dat.bindPointIds[1] = nodes[0];
        });
    }

    public getDat(): attrPanelTypeLadder {
        return {
            roomId: this.roomLb.string,
            bindPointIds: this._dat.bindPointIds,
            isExitLadder: this.exitLadderToggle.isChecked,
        }
    }
}
