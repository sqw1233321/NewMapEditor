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
    Default = "Default",
    Room = "Room",
    PathPoint = "PathPoint",
    Door = "Door",
    Ladder = "Ladder",
    EnemyRefresh = "EnemyRefresh",
    SearchPoint = "SearchPoint",
    Portal = "Portal",
    SurviveDat = "SurviveDat",
    Stone = "Stone",
    Cable = "Cable",
    FightSoul = "FightSoul",
}

//属性配置类型
export interface AttrCfgTypes {
    //对应的绘制类型
    typeArr: AttrCfgType[]
}

//单个节点的所有属性
export interface AttrCfgType {
    ClassName: UnitType;
    Properties: AttrPanelPropertyType[];
}

//单个属性类型
export interface AttrPanelPropertyType {
    //属性名称
    Name: string;
    //对应对象字段
    ClassPropertyName: string;
    //属性类型
    Type: AttrCfgTypeEnum;
    //默认值
    DefaultValue?: any;
    //属性
    Properties?: AttrCfgPropertiesType[]
}

//单个属性属性值类型
export interface AttrCfgPropertiesType {
    //属性名称
    Name?: string;
    //对应对象字段
    ClassPropertyName: string;
    //默认值
    DefaultValue?: any;
}

//属性类型枚举
export enum AttrCfgTypeEnum {
    label = "label",
    point = "point",
    pointArray = "pointArray",
    boolean = "boolean",
}