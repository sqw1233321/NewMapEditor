// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { Singleton } from "../frameWork/Singleton";

const { ccclass, property } = cc._decorator;

@ccclass
export class MapDrawTool extends Singleton<MapDrawTool> {

    private _getPathPoints: () => Map<string, cc.Node>;

    public static get instance(): MapDrawTool {
        return super.instance as MapDrawTool;
    }

    public init(config: {
        getPathPoints: () => Map<string, cc.Node>;

    }) {
        this._getPathPoints = config.getPathPoints;
    }

    public getPathPointById(id: string): cc.Node {
        return this._getPathPoints().get(id);
    }

}
