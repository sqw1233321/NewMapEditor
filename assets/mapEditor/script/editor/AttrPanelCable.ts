// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
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
        this.startP.string = this._dat.startPId;
        this.endP.string = this._dat.endPId;
        NodeUtil.autoRefreshChildren(this.pointCont, this._dat.points, (nd, index, dat) => {
            const nameLb = nd.children[0].children[0].getComponent(cc.Label);
            nameLb.string = dat;
        })
    }

    public getDat(): attrPanelTypeCable {
        const points = this.pointCont.children.map((nd) => {
            return nd.children[0].children[0].getComponent(cc.Label).string;
        });
        return {
            startPId: this.startP.string,
            endPId: this.endP.string,
            points: points,
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
        const cb = (pids: string[]) => {
            this.startP.string = pids[0] ?? "";
            EventManager.instance.emit(AttrPanelEvent.afterEdit, {}, this.type);
        }
        const isMulti = false;
        EventManager.instance.emit(MapEditorEvent.OpenSelectPointMode, isMulti, cb);
    }

    //选择终点（正向时）
    public onClickEnd() {
        const cb = (pids: string[]) => {
            this.endP.string = pids[0] ?? "";
            EventManager.instance.emit(AttrPanelEvent.afterEdit, {}, this.type);
        }
        const isMulti = false;
        EventManager.instance.emit(MapEditorEvent.OpenSelectPointMode, isMulti, cb);
    }

    //选择可编辑点
    public onClickPoints() {
        const cb = (pids: string[]) => {
            NodeUtil.autoRefreshChildren(this.pointCont, pids, (nd, index, dat) => {
                const nameLb = nd.children[0].children[0].getComponent(cc.Label);
                nameLb.string = dat;
            })
        }
        const isMulti = true;
        EventManager.instance.emit(MapEditorEvent.OpenSelectPointMode, isMulti, cb);
    }


}
