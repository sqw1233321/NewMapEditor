// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import PrefabPanelBase from "./PrefabPanelBase";
import { UnitType } from "../../type/mapTypes";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PrefabPanelRoom extends PrefabPanelBase {

    public getType() {
        return UnitType.Room;
    }
}
