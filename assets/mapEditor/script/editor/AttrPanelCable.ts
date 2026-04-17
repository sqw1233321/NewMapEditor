// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import MapDrawP from "../item/MapDrawP";
import { NodeUtil } from "../tool/NodeUtil";
import { UnitType } from "../type/mapTypes";
import { attrPanelType, attrPanelTypeCable } from "../type/types";
import { AttrPanelEvent } from "./EditPanel";

const { ccclass, property } = cc._decorator;
//缆车属性面板
@ccclass
export default class AttrPanelCable extends cc.Component {
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

    //编辑结束
    public onAfterEdit() {
        //TODO:后续删除这个{}
        EventManager.instance.emit(AttrPanelEvent.afterEdit, {}, this.type);
    }

    //选择起始点（正向时）
    public onClickStart() {
        //进入选点模式，传入一个回调
        const cb = (nodes: cc.Node[]) => {
            this.startP.string = nodes[0]?.getComponent(MapDrawP).getId() ?? "";
            this._dat.startP = nodes[0];
            EventManager.instance.emit(AttrPanelEvent.afterEdit, {}, this.type);
        }
        const isMulti = false;
        const arr = this._dat.startP ? [this._dat.startP] : [];
        EventManager.instance.emit(MapEditorEvent.OpenSelectPointMode, isMulti, cb, arr);
    }

    //选择终点（正向时）
    public onClickEnd() {
        const cb = (nodes: cc.Node[]) => {
            this.endP.string = nodes[0]?.getComponent(MapDrawP).getId() ?? "";
            this._dat.endP = nodes[0];
            EventManager.instance.emit(AttrPanelEvent.afterEdit, {}, this.type);
        }
        const isMulti = false;
        const arr = this._dat.endP ? [this._dat.endP] : [];
        EventManager.instance.emit(MapEditorEvent.OpenSelectPointMode, isMulti, cb, arr);
    }

    //选择可编辑点
    public onClickPoints() {
        const cb = (nodes: cc.Node[]) => {
            this._dat.points = nodes;
            NodeUtil.autoRefreshChildren(this.pointCont, nodes, (nd, index, dat) => {
                const nameLb = nd.children[0].children[0].getComponent(cc.Label);
                nameLb.string = dat?.getComponent(MapDrawP).getId() ?? "";
            })
            EventManager.instance.emit(AttrPanelEvent.afterEdit, {}, this.type);
        }
        const isMulti = true;
        EventManager.instance.emit(MapEditorEvent.OpenSelectPointMode, isMulti, cb, this._dat.points);
    }


}
