export enum MapEditorEvent {
    //拖拽节点
    DragItem = "DragItem",
    /** 连线模式：点击路径点（payload 为 cc.Node） */
    PathPointLinkClick = "PathPointLinkClick",
    /** 梯子绑定模式：点击路径点（payload 为 cc.Node） */
    LadderBindPointClick = "LadderBindPointClick",
    //刷新属性面板
    RefreshAttrPanel = "RefreshAttrPanel",
    //属性面板同步
    UpdateFromAttrPanel = "UpdateFromAttrPanel",
    //清除属性面板
    ClearEditPanel = "ClearEditPanel",
}