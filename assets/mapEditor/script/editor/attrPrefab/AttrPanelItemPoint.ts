import MapDrawP from "../../item/MapDrawP";
import { NodeUtil } from "../../tool/NodeUtil";
import { AttrPanelPropertyType } from "../../type/mapTypes";
import AttrPanelItemBase from "./AttrPanelItemBase";


const { ccclass, property } = cc._decorator;

//通用属性面板item,编辑point
@ccclass
export default class AttrPanelItemPoint extends AttrPanelItemBase {
    @property(cc.Node)
    editorCont: cc.Node;

    private _dat;

    public init(cfg: AttrPanelPropertyType, cb: any, dat) {
        super.init(cfg, cb, dat);
        this._dat = dat;
        this.setUI();
    }

    private setUI() {
        this.descLb.string = this._cfg.Name;
        const properties = this._cfg.Properties;
        NodeUtil.autoRefreshChildren(this.editorCont, properties, (nd, index, property) => {
            const descLb = nd.children[0].getComponent(cc.Label);
            descLb.string = property.Name;
            const pointLb = nd.children[1].children[0].getComponent(cc.Label);
            const pointNd = this._dat[index] as cc.Node;
            pointLb.string = pointNd.getComponent(MapDrawP).getId() ?? "";
            const selectBtn = nd.children[2];
            selectBtn.on(cc.Node.EventType.TOUCH_END, () => {
                this.onClickSelect(nd.children[1].children[0], this._dat[index], (nodes: cc.Node[]) => {
                    this._dat[index] = nodes[0];
                })
            }, this);
        })
    }

    private onClickSelect(nd, curValue, setterCb) {
        this.onClickP(false, nd, curValue, setterCb);
    }


    public getDat() {
        return this._dat;
    }
}
