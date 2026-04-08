// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { UnitType } from "../type/mapTypes";
import { MapDrawDatPathPoint } from "./MapDrawDat";
import MapDrawUnitBase from "./MapDrawUnitBase";


const { ccclass, property } = cc._decorator;
@ccclass
export default class MapDrawP extends MapDrawUnitBase {
    @property([cc.Node])
    links: cc.Node[] = [];

    protected _type: UnitType.PathPoint;
    private _pid: string = null;
    private _pDat: MapDrawDatPathPoint = null;

    public init(pData: MapDrawDatPathPoint) {
        this._pDat = pData;
        this._pid = pData.id;
        this._roomId = pData.roomId;
        this.initUI();
    }

    private initUI() {
        const nameNd = this.node.getChildByName("name");
        const label = nameNd.getComponent(cc.Label);
        label.string = `${this._pid}`;
    }

    public setLinks(pointNds: cc.Node[]) {
        this.links = pointNds;
    }


    public getDat(): MapDrawDatPathPoint {
        const dat: MapDrawDatPathPoint = {
            id: this._pid,
            roomId: this._roomId,
            pos: this.getPos(),
            links: this.links.map((link: cc.Node) => link.getComponent(MapDrawP).getId()),
        }
        return dat;
    }

    public getId() {
        return this._pid;
    }


}
