import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import MapDrawP from "../item/MapDrawP";
import MapDrawRoom from "../item/MapDrawRoom";
import MapDrawUnitBase from "../item/MapDrawUnitBase";
import MapTool from "../tool/MapTool";
import { UnitType } from "../type/mapTypes";
import {
  DragType,
  HoverType,
  ModeType,
} from "../type/types";
import EditorSetting from "./EditorSetting";
import HoverDrawer from "./HoverDrawer";
import MapLoader from "../item/MapLoader";
import MapDrawLadder from "../item/MapDrawLadder";
import { AttrMgr } from "../frameWork/AttrMgr";
import { ModeMgr } from "../frameWork/ModeMgr";
import MapInteraction from "../item/MapInteraction";
import MapExporter from "../item/MapExporter";
import { MapDrawDatRoom } from "../item/MapDrawDat";
import KeyInputHandler from "./KeyInputHandler";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LevelScene extends cc.Component {
  @property(cc.Camera)
  lineHightCamera: cc.Camera;

  @property(cc.Node)
  editorRoot: cc.Node = null;

  @property(cc.Camera)
  camera: cc.Camera = null;

  @property(cc.JsonAsset)
  levelJson: cc.JsonAsset = null;

  @property(cc.Node)
  mapCanvasNd: cc.Node;

  @property(cc.Node)
  mapGraph: cc.Node = null;

  @property(cc.Node)
  mapLoader: cc.Node;

  @property(cc.Node)
  dragLayer: cc.Node = null;

  @property(cc.Vec2)
  mapSize: cc.Vec2 = new cc.Vec2(0, 0);

  @property(cc.Node)
  itemPanelNd: cc.Node = null;

  @property(HoverDrawer)
  hoverDrawer: HoverDrawer;

  @property(cc.Label)
  curModeLb: cc.Label;

  @property(cc.Toggle)
  autoRenameTog: cc.Toggle;

  // ==================== 私有变量 ====================
  private _isRightDown: boolean = false;
  private _isLeftDown: boolean = false;
  private _isShiftDown: boolean = false;
  private _isDrag: boolean = false;
  private _dragDat: DragType = null;
  private _hoverDat: HoverType = {
    name: "",
    worldPos: cc.Vec2.ZERO,
    width: 0,
    height: 0,
  };

  // ==================== 子模块 ====================
  private _mapInteraction: MapInteraction = null;
  private _mapExporter: MapExporter = null;
  private _keyInputHandler: KeyInputHandler = null;

  // ==================== 生命周期 ====================

  protected onLoad(): void {
    // 初始化子模块
    this._mapInteraction = new MapInteraction();
    this._mapInteraction.init(this.mapLoader);

    this._mapExporter = new MapExporter();
    this._mapExporter.init(this.mapLoader, this.levelJson);

    // 事件监听
    this.node.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this, true);
    this.node.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
    this.node.on(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
    EventManager.instance.on(MapEditorEvent.DragItem, this.startDrag, this);
    EventManager.instance.on(
      MapEditorEvent.UpdateCurModeDisplay,
      this.updateCurModeDisplay,
      this
    );

    // 初始化键盘输入处理
    this._keyInputHandler = new KeyInputHandler();
    this._keyInputHandler.onShiftDown = () => this._isShiftDown = true;
    this._keyInputHandler.onShiftUp = () => this._isShiftDown = false;
    this._keyInputHandler.onCtrlS = () => this.onClickSave();
    this._keyInputHandler.onCtrlZ = () => this.onUndo();
    this._keyInputHandler.startListen();

    // 初始化管理器
    ModeMgr.instance.init();
    AttrMgr.instance.init(this.mapLoader.getComponent(MapLoader));
    MapTool.init(this.mapLoader, this.mapSize);

    // 初始化地图
    this.createLevel();
    this.adapterMap();
  }

  protected start(): void {
    this.mapLoader.getComponent(MapLoader).build(this.levelJson, this.mapSize);
    this.autoRenameTog.isChecked = true;
    EditorSetting.Instance.setAutoRename(true);
  }

  protected onDestroy(): void {
    this.node.off(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    this.node.off(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this, true);
    this.node.off(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
    this.node.off(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
    EventManager.instance.off(MapEditorEvent.DragItem, this.startDrag, this);
    EventManager.instance.off(
      MapEditorEvent.UpdateCurModeDisplay,
      this.updateCurModeDisplay,
      this
    );

    this._keyInputHandler?.stopListen();

    ModeMgr.instance.destroy();
    AttrMgr.instance.destroy();
  }

  // ==================== 初始化 ====================

  private createLevel() {
    const graphSize = this.mapGraph.getContentSize();
    const scaleX = graphSize.width / this.mapSize.x;
    const scaleY = graphSize.height / this.mapSize.y;
    EditorSetting.Instance.setMinScale(Math.max(scaleX, scaleY));
  }

  private adapterMap() {
    const canvasNd = cc.Canvas.instance.node;
    const worldPos = canvasNd.convertToWorldSpaceAR(MapTool.getLeftBottom(canvasNd));
    const localPos = this.mapCanvasNd.parent.convertToNodeSpaceAR(worldPos);
    this.mapCanvasNd.setPosition(localPos);
    this.mapLoader.setPosition(localPos);
  }

  private updateCurModeDisplay(modeType: ModeType) {
    if (!modeType) {
      this.curModeLb.string = "无模式";
      return;
    }
    this.curModeLb.string = modeType;
  }

  // ==================== 区域判断 ====================

  private isWorldPosInEditorArea(worldPos: cc.Vec2): boolean {
    const validNodes = [this.mapGraph, this.itemPanelNd];
    for (const node of validNodes) {
      if (MapTool.isWorldPosInNodeRect(worldPos, node)) return true;
    }
    return false;
  }

  // ==================== 拖拽逻辑 ====================

  public startDrag(dragDat: DragType) {
    if (!dragDat) {
      console.log("not has dargDat");
      return;
    }
    this._dragDat = dragDat;
    this.dragLayer.removeAllChildren();
    const itemDat = this._dragDat.itemNode;
    itemDat.parent = this.dragLayer;
    const localPos = this.dragLayer.convertToNodeSpaceAR(this._dragDat.mousePos);
    const dragOffset = this._dragDat.dragOffset;
    itemDat.setPosition(localPos.add(cc.v2(dragOffset)));

    // 更新 hover
    this._mapInteraction.updateDragRoomHover(this._dragDat, this._hoverDat, this.hoverDrawer);

    // 刷新属性面板
    AttrMgr.instance.setTrackNd(itemDat);
    AttrMgr.instance.refreshAttrPanel();
  }

  // ==================== 鼠标事件 ====================

  private onMouseWheel(event: cc.Event.EventMouse) {
    this.clearHoverDat();
    this.hoverDrawer.clear();
    const delta = event.getScrollY();
    const prescale = EditorSetting.Instance.getMapScale();
    const scale = prescale + delta * 0.001;
    this.setMapScale(scale);
  }

  private onMouseDown(event: cc.Event.EventMouse) {
    this._isDrag = false;
    const worldPos = event.getLocation();
    if (!this.isWorldPosInEditorArea(worldPos)) return;

    if (event.getButton() === cc.Event.EventMouse.BUTTON_LEFT) {
      this._isLeftDown = true;
      this.clearHoverDat();
      this.hoverDrawer?.clear();
      this._mapInteraction.updateDragRoomHover(this._dragDat, this._hoverDat, this.hoverDrawer);
    } else if (event.getButton() === cc.Event.EventMouse.BUTTON_RIGHT) {
      this._isRightDown = true;
      this.clearHoverDat();
      this.hoverDrawer?.clear();
    }
  }

  private onMouseMove(event: cc.Event.EventMouse) {
    this._isDrag = true;

    // 左键拖拽
    if (this._isLeftDown) {
      if (this._dragDat) {
        const itemDat = this._dragDat.itemNode;
        const dragOffset = this._dragDat.dragOffset;
        if (itemDat && cc.isValid(itemDat)) {
          const localPos = this.dragLayer.convertToNodeSpaceAR(event.getLocation());
          itemDat.setPosition(localPos.add(cc.v2(dragOffset)));

          // Shift 吸附
          if (this._isShiftDown) {
            this._mapInteraction.trySnapDraggedPointY(itemDat);
          }

          // 梯子联动
          this._mapInteraction.syncLadderWithDraggedNode(itemDat, this._isShiftDown);

          // 更新 hover
          this._mapInteraction.updateDragRoomHover(this._dragDat, this._hoverDat, this.hoverDrawer);

          // 刷新属性面板
          AttrMgr.instance.refreshAttrPanel();
        }
      }
    }
    // 右键拖拽画布
    else if (this._isRightDown) {
      let delta = event.getDelta();
      this.editorRoot.x += delta.x;
      this.editorRoot.y += delta.y;
    }
    // 悬停显示
    else {
      this.handleHover(event.target);
    }
  }


  //悬停显示
  private handleHover(target: any) {
    if (!(target instanceof cc.Node)) return;

    const hoverNd = target;
    if (hoverNd.name === this._hoverDat?.name) return;

    const room = hoverNd.getComponent(MapDrawRoom);
    let boxes: HoverType[];

    if (room) {
      const main = this._mapInteraction.buildHoverBoxForNode(hoverNd);
      if (!main) {
        this.clearHoverDat();
        this.hoverDrawer.clear();
        return;
      }
      boxes = [main];
      const units = room.node.getComponentsInChildren(MapDrawUnitBase);
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        if (!u || !u.node || u.node === room.node) continue;
        const h = this._mapInteraction.buildHoverBoxForNode(u.node);
        if (h) boxes.push(h);
      }
    } else {
      const h = this._mapInteraction.buildHoverBoxForNode(hoverNd);
      if (!h) {
        this.clearHoverDat();
        this.hoverDrawer.clear();
        return;
      }
      boxes = [h];
    }

    this._hoverDat.name = hoverNd.name;
    this._hoverDat.worldPos = boxes[0].worldPos;
    this._hoverDat.width = boxes[0].width;
    this._hoverDat.height = boxes[0].height;

    // 获取路径连线
    let linkSegs: Array<{ p0: cc.Vec2; p1: cc.Vec2 }> | undefined;
    if (room) {
      linkSegs = this._mapInteraction.getPathLinkWorldSegmentsForRoom(room.getRoomCfgId());
    } else if (hoverNd.getComponent(MapDrawP)) {
      linkSegs = this._mapInteraction.getPathLinkWorldSegmentsFromPoint(hoverNd);
    }

    this.hoverDrawer?.drawMulti(hoverNd.name, boxes, linkSegs);
  }

  private onMouseUp(event: cc.Event.EventMouse) {
    if (event.getButton() === cc.Event.EventMouse.BUTTON_RIGHT) {
      const wasRightDown = this._isRightDown;
      this._isRightDown = false;
      if (!wasRightDown) return;
    } else if (event.getButton() === cc.Event.EventMouse.BUTTON_LEFT) {
      const wasLeftDown = this._isLeftDown;
      this._isLeftDown = false;
      if (!wasLeftDown) return;
      this.handleDragEnd(event);
    }
    //清除hover
    this.clearDragRoomHover();
  }

  private handleDragEnd(event: cc.Event.EventMouse) {
    if (!this._dragDat) return;

    const itemDat = this._dragDat.itemNode;
    const itemParent = this._dragDat.parent;

    if (!itemDat || !cc.isValid(itemDat) || !itemParent || !cc.isValid(itemParent)) {
      this._dragDat = null;
      return;
    }

    const type = itemDat.getComponent(MapDrawUnitBase).getType();
    let targetParent: cc.Node = null;

    // 计算目标父节点

    //房间
    if (type === UnitType.Room) {
      if (this._dragDat.hoverLayerNode && cc.isValid(this._dragDat.hoverLayerNode)) {
        targetParent = this._dragDat.hoverLayerNode;
      } else {
        const roomWorldPos = itemDat.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const newLayer = this._mapInteraction.getMapLoaderComp()?.createLayerForRoomDrop(roomWorldPos.y);
        if (newLayer) targetParent = newLayer;
      }
    }
    //房间外item 
    else if (this._mapInteraction.isOutRoomUnitType(type)) {
      targetParent = this._mapInteraction.getMapLoaderComp()?.getOutRoomUnitParent() ?? null;
    }
    //特殊点如起始点，撤离点
    else if (itemDat.name === "playerExit" || itemDat.name === "playerCreate") {
      targetParent = itemParent;
    }
    //房间内item
    else {
      const hoverRoom = MapTool.findHoverRoomForDrag(this._dragDat.hoverRoomId, this._dragDat.hoverRoomName);
      if (hoverRoom && cc.isValid(hoverRoom.node)) {
        const nonRoomParent = MapTool.getNonRoomDropParent(itemDat, hoverRoom);
        if (nonRoomParent && cc.isValid(nonRoomParent)) {
          targetParent = nonRoomParent;
        }
      }
    }

    // 无合法父节点，删除节点，并清除hover
    if (!targetParent) {
      this._dragDat.itemNode.destroy();
      this._dragDat = null;
      this.clearDragRoomHover();
      return;
    }

    // 移动节点到目标父节点
    if (targetParent !== itemParent) {
      const worldPos = itemDat.convertToWorldSpaceAR(cc.Vec2.ZERO);
      itemDat.parent = targetParent;
      const localPos = targetParent.convertToNodeSpaceAR(worldPos);
      itemDat.setPosition(localPos);
    } else {
      const dragOffset = this._dragDat.dragOffset;
      itemDat.parent = itemParent;
      const localPos = itemParent.convertToNodeSpaceAR(event.getLocation());
      itemDat.setPosition(localPos.add(cc.v2(dragOffset)));
    }

    // Shift 吸附
    if (this._isShiftDown) {
      this._mapInteraction.trySnapDraggedPointY(itemDat);
    }

    // 梯子重新计算位置
    if (type === UnitType.Ladder) {
      this._mapInteraction.syncLadderToBindPoints(itemDat.getComponent(MapDrawLadder));
    }

    // 没有实际拖拽，不更新数据，直接return
    if (!this._isDrag) {
      this._dragDat = null;
      return;
    }

    // 房间拖拽后续处理
    const draggedRoom = itemDat.getComponent(MapDrawRoom);
    if (draggedRoom && /^Layer\d+$/.test(targetParent.name)) {
      this.handleRoomDragEnd(draggedRoom, targetParent, itemParent);
    }
    else if(itemDat.name == "playerExit" || itemDat.name == "playerCreate") {
      itemDat.parent = targetParent;
    }
    // 房间内item 刷新来源/目标房间数据
    else if (!this._mapInteraction.isOutRoomUnitType(type)) {
      this.refreshRoomDataOnMove(itemDat.parent, itemParent, targetParent);
    }

    AttrMgr.instance.refreshAttrPanel();
    this._dragDat = null;
  }

  //房间拖拽结束处理
  private handleRoomDragEnd(roomCom: MapDrawRoom, targetParent: cc.Node, oldParent: cc.Node) {
    const mapLoaderComp = this._mapInteraction.getMapLoaderComp();
    if (!mapLoaderComp) return;

    // 刷新房间命名
    this.syncRoomNameAndIdForLayer(roomCom, targetParent, oldParent);

    // 刷新 layer bounds
    if (oldParent && /^Layer\d+$/.test(oldParent.name)) {
      mapLoaderComp.refreshLayerBoundsByNode(oldParent);
    }
    if (targetParent && /^Layer\d+$/.test(targetParent.name) && oldParent?.name !== targetParent.name) {
      mapLoaderComp.refreshLayerBoundsByNode(targetParent);
    }

    // 清理空 layer
    mapLoaderComp.cleanupEmptyLayersAfterMove();
    mapLoaderComp.rebuildPointIdsByLayer();
  }

  //房间内item 刷新来源/目标房间数据
  private refreshRoomDataOnMove(newParent: cc.Node, oldParent: cc.Node, targetParent: cc.Node) {
    const mapLoaderComp = this._mapInteraction.getMapLoaderComp();
    const oldOwnerRoom = MapTool.findOwnerRoomByNode(oldParent);
    const newOwnerRoom = MapTool.findOwnerRoomByNode(targetParent);

    if (oldOwnerRoom && cc.isValid(oldOwnerRoom.node)) {
      oldOwnerRoom.refreshDat();
    }
    if (newOwnerRoom && cc.isValid(newOwnerRoom.node) && newOwnerRoom !== oldOwnerRoom) {
      newOwnerRoom.refreshDat();
    }
    mapLoaderComp?.rebuildPointIdsByLayer();
  }

  //清除hover
  private clearDragRoomHover() {
    this._mapInteraction.clearDragHover(this._dragDat, this._hoverDat, this.hoverDrawer);
  }

  // ==================== 房间命名同步 ====================

  private syncRoomNameAndIdForLayer(
    roomCom: MapDrawRoom,
    newLayerNd: cc.Node,
    oldLayerNd: cc.Node,
  ) {
    if (!roomCom || !newLayerNd) return;

    const mapName = this.levelJson?.name ?? "";
    const mapNoMatch = /(\d+)$/.exec(mapName);
    const mapNo = mapNoMatch ? Number(mapNoMatch[1]) : 0;
    const oldCfgId = roomCom.getRoomCfgId();
    const mapLoaderComp = this._mapInteraction.getMapLoaderComp();

    const reorderLayerNames = (layerNd: cc.Node): MapDrawRoom[] => {
      if (!layerNd || !cc.isValid(layerNd)) return [];
      const m = /^Layer(\d+)$/.exec(layerNd.name);
      if (!m) return [];
      const layerNo = Number(m[1]);
      if (!isFinite(layerNo)) return [];

      const rooms = layerNd.children
        .map((nd) => nd?.getComponent(MapDrawRoom))
        .filter((r) => !!r && cc.isValid(r.node))
        .sort((a, b) => {
          const ax = a.node.convertToWorldSpaceAR(cc.Vec2.ZERO).x;
          const bx = b.node.convertToWorldSpaceAR(cc.Vec2.ZERO).x;
          return ax - bx;
        });

      rooms.forEach((r, index) => {
        const roomNo = index + 1;
        const renamedId = mapNo * 100 + (layerNo - 1) * 10 + roomNo;
        const controller = r.node.getComponent(MapDrawRoom);
        if (EditorSetting.Instance.getAutoRename()) {
          mapLoaderComp.renameRoomNode(controller.getRoomId(), renamedId, r.node);
          controller.updateRoomId(renamedId);
        }
      });
      return rooms;
    };

    const newLayerRooms = reorderLayerNames(newLayerNd);
    if (oldLayerNd && oldLayerNd !== newLayerNd) {
      reorderLayerNames(oldLayerNd);
    }

    const layerMatch = /^Layer(\d+)$/.exec(newLayerNd.name);
    if (!layerMatch) return;
    const layer = Number(layerMatch[1]);
    if (!isFinite(layer)) return;

    const idx = newLayerRooms.findIndex((r) => r === roomCom);
    if (idx < 0) return;
    const newRoomNo = idx + 1;
    const newCfgId = mapNo * 100 + (layer - 1) * 10 + newRoomNo;

    const worldPos = roomCom.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
    const size = roomCom.node.getContentSize();
    const uid = roomCom.getUid();

    // 颜色保留
    let color = cc.Color.WHITE;
    const bgNd = roomCom.node.getChildByName("bg");
    if (bgNd) color = bgNd.color;

    // 重新 init
    const roomDat: MapDrawDatRoom = {
      uid: uid,
      cfgId: newCfgId,
      layer: layer,
      pos: { x: worldPos.x, y: worldPos.y },
      size: { width: size.width, height: size.height },
      pathPointIds: [],
      unlockPointIds: [],
      doors: [],
      ladders: [],
      enemyRefreshDatas: [],
      enemyCreateDatas: [],
      baseItemDatas: [],
      searchItemDatas: [],
      survivorDatas: [],
      fightSoulDatas: [],
    };

    if (oldCfgId === 0) {
      roomCom.unLockPoints = [];
    }

    roomCom.init(roomDat, color);
    roomCom.refreshDat();
    mapLoaderComp?.renameRoomNode(oldCfgId, newCfgId, roomCom.node);
  }

  // ==================== 节点操作 ====================

  public deleteNd() {
    const trackNd = AttrMgr.instance.getTrachNd();
    if (!trackNd || !cc.isValid(trackNd)) return;

    const type = trackNd.getComponent(MapDrawUnitBase).getType();
    const mapLoaderComp = this._mapInteraction.getMapLoaderComp();

    //删除房间
    if (type === UnitType.Room) {
      mapLoaderComp?.deleteRoom(trackNd);
    } 
    //删除路径点
    else if (type === UnitType.PathPoint) {
      mapLoaderComp?.deletePathPoint(trackNd);
    } 
    //删除房间外物体
    else if (this._mapInteraction.isOutRoomUnitType(type)) {
      mapLoaderComp?.deletePortal(trackNd);
    } 
    //删除房间内物体
    else {
      const ownerRoom = MapTool.findOwnerRoomByNode(trackNd.parent);
      const ownerLayer = ownerRoom?.node?.parent ?? null;
      trackNd.removeFromParent();
      trackNd.destroy();
      this.scheduleOnce(() => {
        ownerRoom?.refreshDat();
        if (ownerLayer && mapLoaderComp) {
          mapLoaderComp.refreshLayerBoundsByNode(ownerLayer);
        }
      });
    }

    AttrMgr.instance.setTrackNd(null);
    EventManager.instance.emit(MapEditorEvent.ClearEditPanel);
  }

  // ==================== 保存 & 导出 ====================

  //保存当前工作地图
  public onClickSave() {
    this._mapExporter?.save();
  }

  //导出当前工作地图（下载）
  public onCLickExport() {
    this._mapExporter?.export();
  }

  //清空当前工作地图
  public onClickClear() {
    this._mapInteraction.getMapLoaderComp()?.clear();
  }


  //TODO：===================撤销功能===================
  private onUndo() {
    // TODO: 实现撤销功能
    console.log("撤销");
  }

  // ==================== 缩放 ====================

  private setMapScale(scale: number) {
    EditorSetting.Instance.setMapScale(scale);
    const realScale = EditorSetting.Instance.getMapScale();
    this.editorRoot.scale = realScale;
  }

  private clearHoverDat() {
    this._hoverDat.name = "";
  }

  // ==================== 路径线模式 ====================

  public onClickPathLineMode() {
    this.lineHightCamera.cullingMask = -4;
    ModeMgr.instance.enterMode(ModeType.PathPointLink, () => {
      this.lineHightCamera.cullingMask = -3;
    });
  }

  onTogAutoReanme(event) {
    EditorSetting.Instance.setAutoRename(event.isChecked);
  }
}
