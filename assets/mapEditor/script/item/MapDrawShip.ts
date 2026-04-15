// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { UnitType } from "../type/mapTypes";
import { MapDrawDatPortalData, PortalType } from "./MapDrawDat";
import MapDrawPortal from "./MapDrawPortal";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawShip extends MapDrawPortal {
    protected start(): void {
        this._portalType = PortalType.Ship;
    }
}
