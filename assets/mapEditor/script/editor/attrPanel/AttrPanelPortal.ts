import { NodeUtil } from "../../tool/NodeUtil";
import { attrPanelTypePortal } from "../../type/types";
import AttrPanel from "./AttrPanel";


const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrPanelPortal extends AttrPanel{
  @property(cc.Label)
  bindP: cc.Label;

  @property(cc.EditBox)
  offsetP: cc.EditBox;

  @property(cc.Node)
  pointCont: cc.Node;

  private _dat: attrPanelTypePortal;

  setAttr(dat: attrPanelTypePortal) {
    this._dat = dat;
    this.bindP.string = this._dat.linkId;
    this.offsetP.string = this._dat.offsetX.toString();
    this.refreshAnimPIds();
  }

  private refreshAnimPIds() {
    NodeUtil.autoRefreshChildren(this.pointCont, this._dat.animPIds, (nd, index, dat) => {
      const nameLb = nd.children[0].children[0].getComponent(cc.Label);
      nameLb.string = dat;
    })
  }

  public getDat(): attrPanelTypePortal {
    const links = this.pointCont.children.map((nd) => {
      return nd.children[0].children[0].getComponent(cc.Label).string;
    });
    return {
      linkId: this.bindP.string,
      offsetX: Number(this.offsetP.string),
      animPIds: links,
    };
  }
}
