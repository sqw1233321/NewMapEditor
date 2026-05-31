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
    //属性id
    ID: number,
    //显示条件（ex:"3_11"  第3个属性值为11时才显示）
    Condition: string,
    //属性名称
    Name: string;
    //对应对象字段
    ClassPropertyName: string;
    //属性类型
    Type: AttrCfgTypeEnum;
    //以弹窗模式打开的时候，弹窗的名称
    PopName?: string;
    //属性权限
    PERMISSIONS?: AttrCfgPermissionsEnum,
    //默认值
    DefaultValue?: any;
    //属性
    Properties?: AttrPanelPropertyType[]
}

//属性字段权限
export enum AttrCfgPermissionsEnum {
    //只读
    readonly = "readonly",
    //可读可写
    writeable = "writeable",
}

//属性类型枚举
export enum AttrCfgTypeEnum {
    label = "label",
    boolean = "boolean",
    array = "array",
    object = "object",
    point = "point",
    pointArray = "pointArray",
    //按钮打开弹窗
    openPop = "openPop",
}