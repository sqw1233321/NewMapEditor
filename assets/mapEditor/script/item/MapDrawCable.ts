// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { UnitType } from "../type/mapTypes";
import { MapDrawDatCableData } from "./MapDrawDat";
import MapDrawP from "./MapDrawP";
import MapDrawUnitBase from "./MapDrawUnitBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawCable extends MapDrawUnitBase {

    _startP: cc.Node;
    _endP: cc.Node;
    _speed: number = 0;

    public getType() {
        return UnitType.Cable;
    }

    public init(startPoint: cc.Node, endPoint: cc.Node, dat: MapDrawDatCableData) {
        this._startP = startPoint;
        this._endP = endPoint;
        this._speed = dat.speed;
    }

    public setStartP(startP: cc.Node) {
        this._startP = startP;
    }
    public setEndP(endP: cc.Node) {
        this._endP = endP;
    }
    public setSpeed(speed: number) {
        this._speed = speed;
    }

    public getDat(): MapDrawDatCableData {
        const startId = this._startP.getComponent(MapDrawP);
        const endId = this._endP.getComponent(MapDrawP);
        const dat: MapDrawDatCableData = {
            pos: this.getPos(),
            startId: startId.getId(),
            endId: endId.getId(),
            speed: this._speed
        };
        return dat;
    }
}
