//UnitType也得动态生成啊
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
    ID: string,
    //显示条件（ex:"3_11"  第3个属性值为11时才显示）
    Condition: string,
    //属性名称
    Name: string;
    //对应对象字段
    ClassPropertyName: string;
    //excel名称，如果有这个字段，就从配置表json中读写字段。而不是地图json
    ExcelName?: string;
    //正则表达式（用来将excel字段中的一个字符串转化为一个对象）
    Regex?: string;
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
    string = "string",
    number = "number",
    boolean = "boolean",
    array = "array",
    object = "object",
    point = "point",
    pointArray = "pointArray",
    //下拉框
    dropDownNumber = "dropDownNumber",
    dropDownString = "dropDownString",
    //按钮打开弹窗
    openPop = "openPop",
}

//下拉框属性规范
export interface AttrCfgDropDownType {
    showName: string,
    exportValue: string | number
}