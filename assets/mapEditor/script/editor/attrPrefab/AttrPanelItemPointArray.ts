import MapDrawP from "../../item/MapDrawP";
import { NodeUtil } from "../../tool/NodeUtil";
import { AttrPanelPropertyType } from "../../type/mapTypes";
import AttrPanelItemBase from "./AttrPanelItemBase";


const { ccclass, property } = cc._decorator;

//通用属性面板item,编辑point
@ccclass
export default class AttrPanelItemPointArray extends AttrPanelItemBase {
    @property(cc.Node)
    editorCont: cc.Node;

    @property(cc.Node)
    selectNd: cc.Node;

    private _dat;

    public init(cfg: AttrPanelPropertyType, cb: any, dat) {
        super.init(cfg, cb, dat);
        this._dat = dat;
        this.selectNd.on(cc.Node.EventType.TOUCH_END, () => {
            this.onClickSelect(this.editorCont, this._dat, (nodes: cc.Node[]) => {
                this._dat = [];
                nodes.forEach(node => {
                    this._dat.push(node);
                });
            })
        }, this);
        this.setUI();
    }

    private setUI() {
        this.descLb.string = this._cfg.Name;
        NodeUtil.autoRefreshChildren(this.editorCont, this._dat, (nd, index, dat: cc.Node) => {
            const nameLb = nd.children[0].children[0].getComponent(cc.Label);
            nameLb.string = dat?.getComponent(MapDrawP).getId() ?? "";
        })
    }

    private onClickSelect(nd, curValue, setterCb) {
        this.onClickP(true, nd, curValue, setterCb);
    }


    public getDat() {
        return this._dat;
    }
}
