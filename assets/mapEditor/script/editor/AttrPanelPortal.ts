import { attrPanelTypePortal } from "../type/types";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrPanelPortal extends cc.Component {
  @property(cc.Label)
  bindP: cc.Label;

  @property(cc.EditBox)
  offsetP: cc.EditBox;

  private _dat: attrPanelTypePortal;

  setAttr(dat: attrPanelTypePortal) {
    this._dat = dat;
    this.bindP.string = this._dat.linkId;
    this.offsetP.string = this._dat.offsetX.toString();
  }

  public getDat(): attrPanelTypePortal {
    return {
      linkId: this.bindP.string,
      offsetX: Number(this.offsetP.string),
    };
  }
}
