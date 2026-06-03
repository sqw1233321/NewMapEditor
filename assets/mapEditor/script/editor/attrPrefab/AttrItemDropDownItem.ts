import { AttrCfgDropDownType } from "../../type/mapTypes";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrItemDropDownItem extends cc.Component {
    @property(cc.Label)
    showName: cc.Label = null;

    @property(cc.Node)
    selectSp: cc.Node;

    private _dat: AttrCfgDropDownType;
    private _index: number;
    private _selectCb: (curIndex: number) => void;

    protected onLoad(): void {
        this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
    }

    protected onDestroy(): void {
        this.node.off(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
    }


    public setDat(dat: AttrCfgDropDownType, index: number, selectCb) {
        this._dat = dat;
        this.showName.string = dat.showName;
        this._index = index;
        this._selectCb = selectCb;
    }

    public setSelect(curIndx: number) {
        this.selectSp.active = curIndx == this._index;
    }

    private onMouseDown(event: cc.Event.EventMouse) {
        this._selectCb?.(this._index);
    }

    public getDat(): AttrCfgDropDownType {
        return this._dat;
    }



}
