import { UnitType } from "../type/mapTypes";
import { MapDrawDatSurvivorData } from "./MapDrawDat";
import MapDrawUnitBase from "./MapDrawUnitBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawSurvive extends MapDrawUnitBase {
  public getType() {
    return UnitType.SurviveDat;
  }

  private weight: number = 0;

  public init(roomId: number) {
    this._roomId = roomId;
  }

  public getDat() {
    const dat: MapDrawDatSurvivorData = {
      roomId: this._roomId,
      weight: this.weight,
      pos: this.getPos(),
    };
    return dat;
  }

  public setRoomId(roomId: number) {
    this._roomId = roomId;
  }

  public setWeight(weight: number) {
    this.weight = weight;
  }

}
