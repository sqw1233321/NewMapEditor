// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

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
