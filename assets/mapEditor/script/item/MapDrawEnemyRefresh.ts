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

    refreshId: number = 0;

    param: string = "";

    public getType() {
        return UnitType.EnemyRefresh;
    }

    public init(roomId: number, refreshId: number, param: string) {
        this.refreshId = refreshId;
        this.param = param;
        this._roomCfgId = roomId;
    }

    public setRoomId(roomId: number) {
        this._roomCfgId = roomId;
    }

    public setParam(param: string) {
        this.param = param;
    }

    public setRefresId(refreshId: number) {
        this.refreshId = refreshId;
    }

    public getDat(): MapDrawDatEnemyRefreshData {
        const dat: MapDrawDatEnemyRefreshData = {
            refreshId: this.refreshId,
            param: this.param,
            roomId: this._roomCfgId,
            pos: this.getPos()
        }
        return dat;
    }

}
