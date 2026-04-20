// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { UnitType } from "../type/mapTypes";
import { MapDrawDatLadder } from "./MapDrawDat";
import MapDrawP from "./MapDrawP";
import MapDrawUnitBase from "./MapDrawUnitBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawLadder extends MapDrawUnitBase {
    protected _type: UnitType.Ladder;

    @property([cc.Node])
    bindPoints: cc.Node[] = [];

    private _isExitLadder: boolean = false;

    public getType() {
        return UnitType.Ladder;
    }

    public init(roomId: number, bindPoints: cc.Node[], isExit: boolean): void {
        this._roomId = roomId;
        this.bindPoints = bindPoints;
        this._isExitLadder = isExit;
    }

    public setBinds(nodeArr: cc.Node[]) {
        this.bindPoints = nodeArr;
    }

    public setIsExitLadder(isExitLadder: boolean) {
        this._isExitLadder = isExitLadder;
    }

    getDat(): MapDrawDatLadder {
        const bindPointIds = (this.bindPoints || [])
            .filter((bindPoint) => bindPoint && cc.isValid(bindPoint))
            .map((bindPoint) => bindPoint.getComponent(MapDrawP))
            .filter((pointCom) => pointCom && pointCom.getId())
            .map((pointCom) => pointCom.getId());

        const dat: MapDrawDatLadder = {
            roomId: this._roomId,
            pos: this.getPos(),
            bindPointIds: bindPointIds,
            unlockMethod: 0,
            unlockCost: 0,
            showType: 0,
            isExitLadder: this._isExitLadder,
        }
        return dat;
    }

}
