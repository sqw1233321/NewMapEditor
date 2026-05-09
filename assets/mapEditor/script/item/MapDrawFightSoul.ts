import { UnitType } from "../type/mapTypes";
import { MapDrawDatFightSoulData } from "./MapDrawDat";
import MapDrawUnitBase from "./MapDrawUnitBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawFightSoul extends MapDrawUnitBase {
  public getType() {
    return UnitType.FightSoul;
  }

  private weight: number = 0;

  public init(dat: MapDrawDatFightSoulData) {
    this._roomCfgId = dat.roomId;
    this.weight = dat.weight;
  }

  public getDat() {
    const dat: MapDrawDatFightSoulData = {
      roomId: this._roomCfgId,
      weight: this.weight,
      pos: this.getPos(),
      isGuide: false
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
