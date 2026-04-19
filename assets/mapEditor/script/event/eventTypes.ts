export enum MapEditorEvent {
    //拖拽节点
    DragItem = "DragItem",
    /** 连线模式：点击路径点（payload 为 cc.Node） */
    PathPointLinkClick = "PathPointLinkClick",
    /** 梯子绑定模式：点击路径点（payload 为 cc.Node） */
    LadderBindPointClick = "LadderBindPointClick",
    /**开启通用选点模式 */
    OpenSelectPointMode = "OpenSelectPointMode",
    /** 通用路径点选择模式：点击路径点（payload 为 cc.Node） */
    SelectPointClick = "SelectPointClick",

    //刷新属性面板
    RefreshAttrPanel = "RefreshAttrPanel",
    //属性面板同步
    UpdateFromAttrPanel = "UpdateFromAttrPanel",
    //清除属性面板
    ClearEditPanel = "ClearEditPanel",
    //刷新区域信息面板
    RefreshAreaInfo = "RefreshAreaInfo",
    //区域信息更新
    UpdateAreaInfoFormPanel = "UpdateAreaInfoFormPanel",

    //当前模式显示
    UpdateCurModeDisplay = "UpdateCurModeDisplay"
}