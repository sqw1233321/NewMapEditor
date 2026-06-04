export enum MapEditorEvent {
    //=================生命周期相关=================

    //编辑器初始化完成
    EditorInitComplete = "EditorInitComplete",

    //==============地图操作相关=======
    //拖拽节点
    DragItem = "DragItem",
    /** 连线模式：点击路径点（payload 为 cc.Node） */
    PathPointLinkClick = "PathPointLinkClick",
    /**开启通用选点模式 */
    OpenSelectPointMode = "OpenSelectPointMode",
    /** 通用路径点选择模式：点击路径点（payload 为 cc.Node） */
    SelectPointClick = "SelectPointClick",
    //当前模式显示
    UpdateCurModeDisplay = "UpdateCurModeDisplay",

    //==========属性面板相关==============
    //刷新属性面板
    RefreshAttrPanel = "RefreshAttrPanel",
    //属性面板同步
    UpdateFromAttrPanel = "UpdateFromAttrPanel",
    //清除属性面板
    ClearEditPanel = "ClearEditPanel",
    CreateDropDown = "CreateDropDown",

    //===========文件操作相关==========
    //切换背景
    ChangeMapBg = "ChangeMapBg",
    //更换文件
    UpdateFile = "UpdateFile",

    //============通用相关==============
    //显示弹窗
    ShowPop = "ShowPop",
    //显示tip
    ShowTip = "ShowTip"
}