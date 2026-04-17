import { PortalType } from "./MapDrawDat";
import MapDrawPortal from "./MapDrawPortal";
import MapDrawUnitBase from "./MapDrawUnitBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawDefaultPortal extends MapDrawPortal {
    protected start(): void {
        this._portalType = PortalType.Default;
    }

}
