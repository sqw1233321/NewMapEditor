import { UnitType } from "./mapTypes";

//拖拽数据
export interface DragType {
  //被拖拽节点的父节点
  parent: cc.Node;
  //被拖拽节点
  itemNode: cc.Node;
  //鼠标位置
  mousePos: cc.Vec2;
  //鼠标与anchor的偏移
  dragOffset: cc.Vec3;
  /** 拖拽过程中鼠标命中的房间（可选；由 LevelScene 实时写入） */
  hoverRoomId?: number;
  hoverRoomName?: string;
  /** 拖拽过程中鼠标命中的 layer 容器（仅拖拽房间时使用） */
  hoverLayerNode?: cc.Node;
  hoverLayerName?: string;
}

//鼠标移动到节点
export interface HoverType {
  //节点名称
  name: string;
  //世界坐标
  worldPos: cc.Vec2;
  width: number;
  height: number;
}

//属性面板
export interface attrPanelType {
  type: UnitType;
  dat:
  | attrPanelTypeBase
  | attrPanelTypeRoom
  | attrPanelTypePoint
  | attrPanelTypeDoor
  | attrPanelTypeLadder
  | attrPanelTypeSurvive
  | attrPanelTypeSearchItem
  | attrPanelTypePortal;
}

export interface attrPanelTypeBase {
  name: string;
  pos: cc.Vec2;
}

export interface attrPanelTypeRoom {
  size: { width: number; height: number };
  unLockPoints: string[];
}

export interface attrPanelTypePoint {
  roomId: string;
  links: string[];
}

export interface attrPanelTypeDoor {
  roomId: string;
  hp: number;
}

export interface attrPanelTypeLadder {
  roomId: string;
  bindPointIds: string[];
}

export interface attrPanelTypeSurvive {
  roomId: string;
  weight: number;
}

export interface attrPanelTypeSearchItem {
  roomId: string;
  param: string;
}

export interface attrPanelTypePortal {
  linkId: string;
  offsetX: number;
}
