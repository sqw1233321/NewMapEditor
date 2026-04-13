// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { UnitType } from "../type/mapTypes";
import { MapDrawDatDoor } from "./MapDrawDat";
import MapDrawUnitBase from "./MapDrawUnitBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawDoor extends MapDrawUnitBase {
     protected _type: UnitType.Door;

    @property
    hp: number = 0;

    public getType() {
        return UnitType.Door;
    }

    public init(roomId: number, hp: number) {
        this.hp = hp;
        this._roomId = roomId;
    }

    public setHp(hp: number) {
        this.hp = hp;
    }

    public getDat(): MapDrawDatDoor {
        const dat: MapDrawDatDoor = {
            hp: this.hp,
            roomId: this._roomId,
            pos: this.getPos()
        }
        return dat;
    }
}
