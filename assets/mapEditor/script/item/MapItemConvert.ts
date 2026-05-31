// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { UnitType } from "../type/mapTypes";

const { ccclass, property } = cc._decorator;

//由程序生成这样一份代码
@ccclass
export default class MapItemConvert extends cc.Component {

    public static convertUnitType(mapDataValue: any) {
        switch (mapDataValue) {
            case "doors":
                return UnitType.Door;
            case "ladders":
                return UnitType.Ladder;
            case "enemyRefreshDatas":
                return UnitType.EnemyRefresh;
            case "searchItemDatas":
                return UnitType.SearchPoint;
            case "survivorDatas":
                return UnitType.SurviveDat;
            case "fightSoulDatas":
                return UnitType.FightSoul;
        }
        return null;
    }
}
