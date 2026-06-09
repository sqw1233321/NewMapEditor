//配置信息
export interface UIConfig {
    //层级
    layer: PopLayerType,
    //预制体名称
    prefab: string,
    //关闭后是否删除
    destroy: boolean,
}

export enum PopLayerType {
    Pop = "Pop", //弹窗层
}


/** 界面唯一标识（方便服务器通过编号数据触发界面打开） */
export enum PopUid {
    CreateFilePop = "CreateFilePop",
    ChangeBgPop = "ChangeBgPop",
    //嵌套属性界面
    AttrPop = "AttrPop",
    EditorSettingPop = "EditorSettingPop"
}

/** 打开界面方式的配置数据 */
export const PopConfig: { [key: string]: UIConfig } = {
    [PopUid.CreateFilePop]: { layer: PopLayerType.Pop, prefab: 'popUps/createFilePop', destroy: false },
    [PopUid.ChangeBgPop]: { layer: PopLayerType.Pop, prefab: 'popUps/changeBgPop', destroy: false },
    [PopUid.AttrPop]: { layer: PopLayerType.Pop, prefab: 'popUps/attrPop', destroy: false },
    [PopUid.EditorSettingPop]: { layer: PopLayerType.Pop, prefab: 'popUps/editorSettingPop', destroy: false },
};