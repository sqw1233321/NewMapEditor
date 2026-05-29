import { MapEditorEvent } from "../../event/eventTypes";
import { EventManager } from "../../frameWork/EventManager";
import MapDrawP from "../../item/MapDrawP";
import { NodeUtil } from "../../tool/NodeUtil";
import { AttrPanelPropertyType } from "../../type/mapTypes";


const { ccclass, property } = cc._decorator;

//通用属性面板item
@ccclass
export default class AttrPanelItemBase extends cc.Component {
    @property(cc.Label)
    descLb: cc.Label;

    protected _cfg: AttrPanelPropertyType;
    protected _afterEditorCb: () => void;

    public init(cfg: AttrPanelPropertyType, cb, ...params) {
        this._cfg = cfg;
        this._afterEditorCb = cb;
    }

    //EditBox编辑完成
    public onAfterEdit() {
        this._afterEditorCb?.();
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
            this._afterEditorCb?.();
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




    public getDat() {

    }
}
