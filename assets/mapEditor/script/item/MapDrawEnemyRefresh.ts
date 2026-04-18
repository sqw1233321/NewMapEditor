// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { UnitType } from "../type/mapTypes";
import { MapDrawDatEnemyRefreshData } from "./MapDrawDat";
import MapDrawUnitBase from "./MapDrawUnitBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawEnemyRefresh extends MapDrawUnitBase {
     protected _type: UnitType.EnemyRefresh;
    
    @property
    refreshId: number = 0;

    @property
    param: string = "";

    public getType() {
        return UnitType.EnemyRefresh;
    }

    public init(roomId: number, refreshId: number, param: string) {
        this.refreshId = refreshId;
        this.param = param;
        this._roomId = roomId;
    }

    public setRoomId(roomId: number) {
        this._roomId = roomId;
    }

    public setParam(param: string) {
        this.param = param;
    }

    public getDat(): MapDrawDatEnemyRefreshData {
        const dat: MapDrawDatEnemyRefreshData = {
            refreshId: this.refreshId,
            param: this.param,
            roomId: this._roomId,
            pos: this.getPos()
        }
        return dat;
    }

}
