export enum MapEditorEvent {
    //拖拽节点
    DragItem = "DragItem",
    /** 连线模式：点击路径点（payload 为 cc.Node） */
    PathPointLinkClick = "PathPointLinkClick",
    /** 梯子绑定模式：点击路径点（payload 为 cc.Node） */
    LadderBindPointClick = "LadderBindPointClick",
    /** 传送门绑定模式：点击传送门（payload 为 cc.Node） */
    PortalBindPortalClick = "PortalBindPortalClick",
    /** 传送门绑定模式：点击路径点作为终点（payload 为 cc.Node） */
    PortalBindPathPointClick = "PortalBindPathPointClick",
    /** 房间解锁点绑定：点击房间（payload 为 cc.Node） */
    RoomUnlockBindRoomClick = "RoomUnlockBindRoomClick",
    /** 房间解锁点绑定：点击路径点（payload 为 cc.Node） */
    RoomUnlockBindPointClick = "RoomUnlockBindPointClick",
    //刷新属性面板
    RefreshAttrPanel = "RefreshAttrPanel",
    //属性面板同步
    UpdateFromAttrPanel = "UpdateFromAttrPanel",
    //清除属性面板
    ClearEditPanel = "ClearEditPanel",
}