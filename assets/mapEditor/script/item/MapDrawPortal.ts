// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { UnitType } from "../type/mapTypes";
import { MapDrawDatPortalData } from "./MapDrawDat";
import MapDrawUnitBase from "./MapDrawUnitBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawPortal extends MapDrawUnitBase {
  protected _type: UnitType.Portal;

  @property
  linkId: string = "";

  @property
  offsetX: number = 0;

  public getType() {
    return UnitType.Portal;
  }

  public init(...params: any[]): void {}

  setLinkId(id: string) {
    this.linkId = id;
  }

  setOffsetX(offset: number) {
    this.offsetX = offset;
  }

  public getDat(): MapDrawDatPortalData {
    const dat: MapDrawDatPortalData = {
      linkId: this.linkId,
      pos: this.getPos(),
      offsetX: this.offsetX,
    };
    return dat;
  }
}
