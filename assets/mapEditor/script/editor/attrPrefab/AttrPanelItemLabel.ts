import { NodeUtil } from "../../tool/NodeUtil";
import { AttrPanelPropertyType } from "../../type/mapTypes";
import AttrPanelItemBase from "./AttrPanelItemBase";


const { ccclass, property } = cc._decorator;

//通用属性面板item,编辑label
@ccclass
export default class AttrPanelItemLabel extends AttrPanelItemBase {
    @property(cc.Node)
    singleEditorNd: cc.Node;

    @property(cc.Node)
    editorCont: cc.Node;

    private _dat;

    public init(cfg: AttrPanelPropertyType, cb: any, dat): void {
        super.init(cfg, cb);
        this._dat = dat;
        this.setUI();
    }

    private setUI() {
        this.descLb.string = this._cfg.Name;
        const properties = this._cfg.Properties;
        const hasMulti = !!properties;
        this.singleEditorNd.active = !hasMulti;
        this.editorCont.active = hasMulti;
        //子属性赋值
        if (hasMulti) {
            NodeUtil.autoRefreshChildren(this.editorCont, properties, (nd, index, property) => {
                const descLb = nd.children[0].getComponent(cc.Label);
                descLb.string = property.Name;
                const editController = nd.getComponent(cc.EditBox);
                editController.string = this._dat[`${property.ClassPropertyName}`];
            })
        }
        else {
            this.singleEditorNd.getComponent(cc.EditBox).string = this._dat;
        }
    }

    public getDat() {
        const properties = this._cfg.Properties;
        const hasMulti = !!properties;
        if (hasMulti) {
            const dat: any = {};
            this.editorCont.children.forEach((child, index) => {
                const editBox = child.getComponent(cc.EditBox);
                const property = properties[index];
                dat[property.ClassPropertyName] = editBox.string;
            })
            return dat;
        }
        else {
            const str = this.singleEditorNd.getComponent(cc.EditBox).string;
            return str;
        }
    }
}
