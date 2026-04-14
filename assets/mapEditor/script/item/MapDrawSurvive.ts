import { UnitType } from "../type/mapTypes";
import { MapDrawDatSurvivorData } from "./MapDrawDat";
import MapDrawUnitBase from "./MapDrawUnitBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawSurvive extends MapDrawUnitBase {
  public getType() {
    return UnitType.SurviveDat;
  }

  public init(roomId: number) {
    this._roomId = roomId;
  }

  public getDat() {
    const dat: MapDrawDatSurvivorData = {
      roomId: this._roomId,
      weight: 0,
      pos: this.getPos(),
    };
    return dat;
  }
}
