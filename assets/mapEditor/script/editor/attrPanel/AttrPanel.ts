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
import { AttrPanelEvent } from "../EditPanel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrPanel extends cc.Component {
    @property({ type: cc.Enum(UnitType) })
    type: UnitType = UnitType.Default;


    //EditBox编辑完成
    public onAfterEdit() {
        EventManager.instance.emit(AttrPanelEvent.afterEdit, this.type);
    }

    //选点模式
    protected onClickP(isMulti, nd: cc.Node, dat: cc.Node[] | cc.Node, setter: (nodes: cc.Node[]) => void) {
        const cb = (nodes: cc.Node[]) => {
            if (isMulti) {
                setter(nodes);
                NodeUtil.autoRefreshChildren(nd, nodes, (nd, index, dat) => {
                    const nameLb = nd.children[0].children[0].getComponent(cc.Label);
                    nameLb.string = dat?.getComponent(MapDrawP).getId() ?? "";
                })
            }
            else {
                setter(nodes);
                const singleLb = nd.getComponent(cc.Label) || nd.getComponent(cc.EditBox);
                singleLb.string = nodes[0]?.getComponent(MapDrawP).getId() ?? "";
            }
            EventManager.instance.emit(AttrPanelEvent.afterEdit, this.type);
        }

        let arr: cc.Node[] = [];
        if (!isMulti) {
            arr = dat ? [dat] : [];
        }
        else {
            arr = dat;
        }
        EventManager.instance.emit(MapEditorEvent.OpenSelectPointMode, isMulti, cb, arr);
    }
}
