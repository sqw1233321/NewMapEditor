// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { UnitType } from "../type/mapTypes";
import { MapDrawDatSearchItemData } from "./MapDrawDat";
import MapDrawUnitBase from "./MapDrawUnitBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawSearchItem extends MapDrawUnitBase {
     protected _type: UnitType.SearchPoint;


    public init(roomId: number) {
        this._roomId = roomId;
    }

    public getDat() {
        const dat: MapDrawDatSearchItemData = {
            roomId: this._roomId,
            param: "",
            pos: this.getPos()
        }
        return dat;
    }

}
