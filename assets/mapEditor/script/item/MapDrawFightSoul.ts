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
  private _isGuide: boolean;

  public init(dat: MapDrawDatFightSoulData) {
    this._roomCfgId = dat.roomId;
    this.weight = dat.weight;
    this._isGuide = dat.isGuide;
  }

  public setRoomId(roomId: number) {
    this._roomCfgId = roomId;
  }

  public setWeight(weight: number) {
    this.weight = weight;
  }

  public setIsGuide(isGuide: boolean) {
    this._isGuide = isGuide;
  }


  public getDat() {
    const dat: MapDrawDatFightSoulData = {
      roomId: this._roomCfgId,
      weight: this.weight,
      pos: this.getPos(),
      isGuide: this._isGuide
    };

    return dat;
  }


}
