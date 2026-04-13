import MapDrawDoor from "../item/MapDrawDoor";
import MapDrawEnemyRefresh from "../item/MapDrawEnemyRefresh";
import MapDrawLadder from "../item/MapDrawLadder";
import MapDrawSearchItem from "../item/MapDrawSearchItem";


//房间子节点信息
export interface RoomItemType {
    ladderDat: MapDrawLadder[];
    doorDat: MapDrawDoor[];
    enemyRefreshDat: MapDrawEnemyRefresh[];
    searchItemDat: MapDrawSearchItem[];
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
}
