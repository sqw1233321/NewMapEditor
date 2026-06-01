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
    protected _id: string;

    public initBase(cfg: AttrPanelPropertyType, parentId: string, index: number, parentItem: AttrItem, cb, ...params) {
        this._cfg = cfg;
        this._id = parentId ?? "";
        //数组类型加入id 1-1-3&{2}-4-5&{1}
        if (index != undefined) {
            this._id += `&{${index}}`;
        }
        else {
            const curCfgId = this._cfg.ID.split("-").pop();
            if (!this._id) this._id += `${curCfgId}`;
            else this._id += `-${curCfgId}`;
        }
        this._parentItem = parentItem;
        this._parentCfg = parentItem?.getCfg() ?? null;
        this._afterEditorCb = cb;
    }

    public getId() {
        return this._id;
    }

    //EditBox编辑完成
    public onAfterEdit(event?, editId: string = "") {
        if (editId) {
            AttrPanelItemBase.curPropertyId = editId;
        }
        else {
            AttrPanelItemBase.curPropertyId = this._id;
        }
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
            AttrPanelItemBase.curPropertyId = this._id;
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
