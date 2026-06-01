import { MapEditorEvent } from "../../event/eventTypes";
import { EventManager } from "../../frameWork/EventManager";
import { AttrPanelPropertyType } from "../../type/mapTypes";
import AttrItem from "./AttrItem";


const { ccclass, property } = cc._decorator;

//通用属性面板item
@ccclass
export default class AttrPanelItemBase extends cc.Component {
    //当前操作的属性id
    static curPropertyId: string = "";

    @property(cc.Label)
    descLb: cc.Label;

    protected _cfg: AttrPanelPropertyType;
    protected _parentItem: AttrItem;
    protected _parentCfg: AttrPanelPropertyType;
    protected _afterEditorCb: () => void;

    public init(cfg: AttrPanelPropertyType, parentItem: AttrItem, cb, ...params) {
        this._cfg = cfg;
        this._parentItem = parentItem;
        this._parentCfg = parentItem?.getCfg() ?? null;
        this._afterEditorCb = cb;
    }

    //EditBox编辑完成
    public onAfterEdit() {
        AttrPanelItemBase.curPropertyId = this._cfg.ID;
        this._afterEditorCb?.();
    }

    //选点模式
    protected onClickP(isMulti, nd: cc.Node, dat: cc.Node[] | cc.Node, setter: (pids: string[]) => void) {
        const cb = (pids: string[]) => {
            if (isMulti) {
                setter(pids);
            }
            else {
                setter(pids);
            }
            AttrPanelItemBase.curPropertyId = this._cfg.ID;
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
