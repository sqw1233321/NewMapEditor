const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawLadder extends cc.Component {
    // protected _type: UnitType.Ladder;

    // @property([cc.Node])
    // bindPoints: cc.Node[] = [];

    // private _isExitLadder: boolean = false;

    // public getType() {
    //     return UnitType.Ladder;
    // }

    // public init(roomId: number, bindPoints: cc.Node[], isExit: boolean): void {
    //     this._roomCfgId = roomId;
    //     this.bindPoints = bindPoints;
    //     this._isExitLadder = isExit;
    // }

    // public setBinds(nodeArr: cc.Node[]) {
    //     this.bindPoints = nodeArr;
    // }

    // public setIsExitLadder(isExitLadder: boolean) {
    //     this._isExitLadder = isExitLadder;
    // }

    // getDat(): MapDrawDatLadder {
    //     const bindPointIds = (this.bindPoints || [])
    //         .filter((bindPoint) => bindPoint && cc.isValid(bindPoint))
    //         .map((bindPoint) => bindPoint.getComponent(MapDrawP))
    //         .filter((pointCom) => pointCom && pointCom.getId())
    //         .map((pointCom) => pointCom.getId());

    //     const dat: MapDrawDatLadder = {
    //         roomId: this._roomCfgId,
    //         pos: this.getPos(),
    //         bindPointIds: bindPointIds,
    //         unlockMethod: 0,
    //         unlockCost: 0,
    //         showType: 0,
    //         isExitLadder: this._isExitLadder,
    //     }
    //     return dat;
    // }
}
