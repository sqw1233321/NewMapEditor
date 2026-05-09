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

  public init(dat: MapDrawDatSurvivorData) {
    this._roomCfgId = dat.roomId;
    this.weight = dat.weight;
  }

  public getDat() {
    const dat: MapDrawDatSurvivorData = {
      roomId: this._roomCfgId,
      weight: this.weight,
      pos: this.getPos(),
    };
    return dat;
  }

  public setRoomId(roomId: number) {
    this._roomCfgId = roomId;
  }

  public setWeight(weight: number) {
    this.weight = weight;
  }

}
