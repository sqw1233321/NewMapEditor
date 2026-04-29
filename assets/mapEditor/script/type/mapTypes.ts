import MapDrawDoor from "../item/MapDrawDoor";
import MapDrawEnemyRefresh from "../item/MapDrawEnemyRefresh";
import MapDrawFightSoul from "../item/MapDrawFightSoul";
import MapDrawLadder from "../item/MapDrawLadder";
import MapDrawSearchItem from "../item/MapDrawSearchItem";
import MapDrawSurvive from "../item/MapDrawSurvive";


//房间子节点信息
export interface RoomItemType {
    ladderDat: MapDrawLadder[];
    doorDat: MapDrawDoor[];
    enemyRefreshDat: MapDrawEnemyRefresh[];
    searchItemDat: MapDrawSearchItem[];
    surviveDat: MapDrawSurvive[];
    fightSoulDat: MapDrawFightSoul[];
}

export enum UnitType {
    Default = 0,
    Room,
    PathPoint,
    Door,
    Ladder,
    EnemyRefresh,
    SearchPoint,
    Portal,
    SurviveDat,
    Stone,
    Cable,
    FightSoul,
}
