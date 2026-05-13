// ============================================
// 机制定义相关类型
// ============================================

/** 机制字段类型 */
export enum MechanismFieldType {
    /** 文本输入 */
    Text = "text",
    /** 整数输入 */
    Int = "int",
    /** 浮点数输入 */
    Float = "float",
    /** 布尔开关 */
    Bool = "bool",
    /** 路径点选择（单选） */
    PointSingle = "point_single",
    /** 路径点选择（多选） */
    PointMultiple = "point_multiple",
}

/** 机制字段定义 */
export interface MechanismFieldDefine {
    /** 字段唯一标识 */
    id: string;
    /** 字段显示名称 */
    name: string;
    /** 字段类型 */
    type: MechanismFieldType;
    /** 交互模式（选点相关） */
    selectMode?: "single" | "multiple";
    /** 字段默认值 */
    defaultValue?: any;
    /** 字段描述 */
    description?: string;
}

/** 机制定义 */
export interface MechanismDefine {
    /** 机制唯一ID */
    id: string;
    /** 机制显示名称 */
    name: string;
    /** 图集帧名称（工具栏图标） */
    spritePath: string;
    /** prefab资源路径 */
    prefabPath: string;
    /** 是否在工具栏显示 */
    showInToolbar: boolean;
    /** 工具栏显示顺序 */
    toolbarOrder: number;
    /** 属性字段定义 */
    fields: MechanismFieldDefine[];
    /** 额外配置（可扩展） */
    extra?: Record<string, any>;
}

/** 机制实例数据 */
export interface MechanismInstance {
    /** 机制定义ID */
    mechanismId: string;
    /** 实例唯一ID */
    instanceId: string;
    /** 所属房间ID */
    roomId: number;
    /** 位置 */
    pos: { x: number; y: number };
    /** 字段值映射 */
    fieldValues: Record<string, any>;
}

/** 属性面板机制数据 */
export interface AttrPanelTypeMechanism {
    /** 机制定义ID */
    mechanismId: string;
    /** 机制名称 */
    mechanismName: string;
    /** 字段值 */
    fields: MechanismFieldDefine[];
    /** 当前实例值 */
    values: Record<string, any>;
}

/** 机制配置管理器数据结构 */
export interface MechanismConfig {
    /** 版本号 */
    version: string;
    /** 所有机制定义 */
    defines: MechanismDefine[];
}
