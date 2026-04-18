// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { MapEditorEvent } from "../../event/eventTypes";
import { EventManager } from "../../frameWork/EventManager";
import MapDrawP from "../../item/MapDrawP";
import { NodeUtil } from "../../tool/NodeUtil";
import { UnitType } from "../../type/mapTypes";
import { attrPanelTypeCable } from "../../type/types";
import { AttrPanelEvent } from "../EditPanel";
import AttrPanel from "./AttrPanel";

const { ccclass, property } = cc._decorator;
//缆车属性面板
@ccclass
export default class AttrPanelCable extends AttrPanel {
    @property({ type: cc.Enum(UnitType) })
    type: UnitType = UnitType.Default;

    @property(cc.Label)
    startP: cc.Label;

    @property(cc.Label)
    endP: cc.Label;

    @property(cc.Node)
    pointCont: cc.Node;

    @property(cc.EditBox)
    speed: cc.EditBox;

    private _dat: attrPanelTypeCable;

    setAttr(dat: attrPanelTypeCable) {
        this._dat = dat;
        this.startP.string = this._dat.startP?.getComponent(MapDrawP).getId() ?? "";
        this.endP.string = this._dat.endP?.getComponent(MapDrawP).getId() ?? "";
        NodeUtil.autoRefreshChildren(this.pointCont, this._dat.points, (nd, index, dat) => {
            const nameLb = nd.children[0].children[0].getComponent(cc.Label);
            nameLb.string = dat.getComponent(MapDrawP)?.getId() ?? "";
        })
    }

    public getDat(): attrPanelTypeCable {
        return {
            startP: this._dat.startP,
            endP: this._dat.endP,
            points: this._dat.points,
            speed: Number(this.speed.string)
        }
    }


    //选择起始点（正向时）
    public onClickStart() {
        this.onClickP(false, this.startP.node, this._dat.startP, (nodes: cc.Node[]) => {
            this._dat.startP = nodes[0];
        });
    }

    //选择终点（正向时）
    public onClickEnd() {
        this.onClickP(false, this.endP.node, this._dat.endP, (nodes: cc.Node[]) => {
            this._dat.endP = nodes[0];
        });
    }

    //选择可编辑点
    public onClickPoints() {
        this.onClickP(true, this.pointCont, this._dat.points, (nodes: cc.Node[]) => {
            this._dat.points = nodes;
        });
    }

}
