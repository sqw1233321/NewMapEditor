// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { UnitType } from "../type/mapTypes";
import { MapDrawDatStoneData } from "./MapDrawDat";
import MapDrawUnitBase from "./MapDrawUnitBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawStone extends MapDrawUnitBase {
    public getType() {
        return UnitType.Stone;
    }

    public getDat(): MapDrawDatStoneData {
        const dat: MapDrawDatStoneData = {
            pos: this.getPos(),
        };
        return dat;
    }
}
