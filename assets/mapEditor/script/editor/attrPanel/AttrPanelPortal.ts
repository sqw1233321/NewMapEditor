import MapDrawP from "../../item/MapDrawP";
import { NodeUtil } from "../../tool/NodeUtil";
import { attrPanelTypePortal } from "../../type/types";
import AttrPanel from "./AttrPanel";


const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrPanelPortal extends AttrPanel {
  @property(cc.Label)
  bindP: cc.Label;

  @property(cc.EditBox)
  offsetP: cc.EditBox;

  @property(cc.Node)
  pointCont: cc.Node;

  private _dat: attrPanelTypePortal;

  setAttr(dat: attrPanelTypePortal) {
    this._dat = dat;
    this.bindP.string = this._dat.linkP?.getComponent(MapDrawP).getId() ?? "";
    this.offsetP.string = this._dat.offsetX.toString();
    this.refreshAnimPIds();
  }

  private refreshAnimPIds() {
    NodeUtil.autoRefreshChildren(this.pointCont, this._dat.animPs, (nd, index, dat) => {
      const nameLb = nd.children[0].children[0].getComponent(cc.Label);
      nameLb.string = dat?.getComponent(MapDrawP).getId() ?? "";
    })
  }

  public getDat(): attrPanelTypePortal {
    return {
      linkP: this._dat.linkP,
      offsetX: Number(this.offsetP.string),
      animPs: this._dat.animPs,
    };
  }

  //选择终点（正向时）
  public onClickEnd() {
    this.onClickP(false, this.bindP.node, this._dat.linkP, (nodes: cc.Node[]) => {
      this._dat.linkP = nodes[0];
    });
  }

  //选择可编辑点
  public onClickPoints() {
    this.onClickP(true, this.pointCont, this._dat.animPs, (nodes: cc.Node[]) => {
      this._dat.animPs = nodes;
    });
  }
}
