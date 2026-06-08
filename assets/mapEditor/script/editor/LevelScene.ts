import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import { UndoManager } from "../frameWork/UndoManager";
import MapDrawP from "../item/MapDrawP";
import MapDrawRoom from "../item/MapDrawRoom";
import MapTool from "../tool/MapTool";
import { UnitType } from "../type/mapTypes";
import {
  DragType,
  HoverType,
  ModeType,
  ModeTypeDisplay,
} from "../type/types";
import EditorSetting from "./EditorSetting";
import HoverDrawer from "./HoverDrawer";
import MapLoader from "../item/MapLoader";
import { AttrMgr } from "../frameWork/AttrMgr";
import { ModeMgr } from "../frameWork/ModeMgr";
import MapInteraction from "../item/MapInteraction";
import MapExporter from "../item/MapExporter";
import KeyInputHandler from "./KeyInputHandler";
import MapBgPrefab from "./MapBgPrefab";
import { MapBgManager } from "./MapBgManager";
import { PopUid } from "./PopConfigs";
import MapDrawItem from "./mapDrawElement/MapDrawItem";
import MapDrawItemBase from "./mapDrawElement/MapDrawItemBase";
import DynamicGetter from "./DynamicGetter/DynamicGetter";
import { MapDrawTool } from "../item/MapDrawTool";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LevelScene extends cc.Component {
  @property(cc.Camera)
  lineHightCamera: cc.Camera;

  @property(cc.Node)
  editorRoot: cc.Node = null;

  @property(cc.Camera)
  camera: cc.Camera = null;

  @property(cc.Node)
  mapCanvasNd: cc.Node;

  @property(cc.Node)
  mapGraph: cc.Node = null;

  @property(cc.Node)
  mapLoader: cc.Node;

  @property(cc.Node)
  dragLayer: cc.Node = null;

  @property(cc.Node)
  itemPanelNd: cc.Node = null;

  @property(HoverDrawer)
  hoverDrawer: HoverDrawer;

  @property(cc.Prefab)
  magBgPrefab: cc.Prefab;

  @property(cc.Node)
  curModeNd: cc.Node;

  //============测试用=============
  @property(cc.JsonAsset)
  testJson: cc.JsonAsset;


  // ==================== 私有变量 ====================
  private _isRightDown: boolean = false;
  private _isLeftDown: boolean = false;
  private _isDrag: boolean = false;
  private _dragSaveSnap: boolean = true;
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
  private _undoManager: UndoManager = null;

  // ==================== 生命周期 ====================

  protected async onLoad() {
    // 初始化子模块
    this._mapInteraction = new MapInteraction();
    this._mapInteraction.init(this.mapLoader);

    this._mapExporter = new MapExporter();
    this._mapExporter.init(this.mapLoader);

    // 事件监听
    this.node.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this, true);
    this.node.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
    this.node.on(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
    EventManager.instance.on(MapEditorEvent.DragItem, this.startDrag, this);
    EventManager.instance.on(MapEditorEvent.ChangeMapBg, this.changeMapBg, this);
    EventManager.instance.on(MapEditorEvent.UpdateCurModeDisplay, this.updateCurModeDisplay, this);
    EventManager.instance.on(MapEditorEvent.ChangeStage, this.updateStageId, this);

    // 初始化键盘输入处理
    this._keyInputHandler = new KeyInputHandler();
    this._keyInputHandler.onShiftDown = () => EditorSetting.Instance.setIsSnapY(true);
    this._keyInputHandler.onShiftUp = () => EditorSetting.Instance.setIsSnapY(false);
    this._keyInputHandler.onCtrlS = () => this.onClickSave();
    this._keyInputHandler.onCtrlZ = () => this.onUndo();
    this._keyInputHandler.onCtrlY = () => this.onRedo();
    this._keyInputHandler.startListen();

    // 初始化撤销管理器
    this._undoManager = new UndoManager();

    // 初始化管理器
    ModeMgr.instance.init();
    AttrMgr.instance.init(this.mapLoader.getComponent(MapLoader));
    AttrMgr.instance.saveSnap = () => this.saveUndoSnapshot();

    // 适配地图
    this.adapterMap();

    this.curModeNd.active = false;
  }

  protected async start() {
    //初始化mapLoader
    this.mapLoader.getComponent(MapLoader).init();
    // 加载图集配置
    if (CC_BUILD) await MapBgManager.instance.loadMapData();
    //记载机制的json表
    await DynamicGetter.Ins.loadDynamicJson();
    //自动命名默认为false
    EditorSetting.Instance.setAutoRename(false);
    //测试用数据
    if (!CC_BUILD && this.testJson) {
      this.changeMap(JSON.stringify(this.testJson.json), "test.json");
    }
    //初始化完成
    EventManager.instance.emit(MapEditorEvent.EditorInitComplete);
  }

  protected onDestroy(): void {
    this.node.off(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    this.node.off(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this, true);
    this.node.off(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
    this.node.off(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
    EventManager.instance.off(MapEditorEvent.DragItem, this.startDrag, this);
    EventManager.instance.off(MapEditorEvent.ChangeMapBg, this.changeMapBg, this);
    EventManager.instance.off(MapEditorEvent.UpdateCurModeDisplay, this.updateCurModeDisplay, this);
    EventManager.instance.on(MapEditorEvent.ChangeStage, this.updateStageId, this);

    this._keyInputHandler?.stopListen();

    ModeMgr.instance.destroy();
    AttrMgr.instance.destroy();
  }

  // ==================== 初始化 ====================

  private adapterMap() {
    const canvasNd = cc.Canvas.instance.node;
    const worldPos = canvasNd.convertToWorldSpaceAR(MapTool.getLeftBottom(canvasNd));
    const localPos = this.mapCanvasNd.parent.convertToNodeSpaceAR(worldPos);
    this.mapCanvasNd.setPosition(localPos);
    this.mapLoader.setPosition(localPos);
  }


  // ==================== 区域判断 ====================

  //是否在可拖拽区域
  private isWorldPosInEditorArea(worldPos: cc.Vec2): boolean {
    const validNodes = [this.mapGraph, this.itemPanelNd];
    return this.checkArea(worldPos, validNodes);
  }
  //判断是否在地图区域
  private isWorldPosMapArea(worldPos: cc.Vec2): boolean {
    const validNodes = [this.mapGraph];
    return this.checkArea(worldPos, validNodes);
  }

  //区域检测
  private checkArea(worldPos: cc.Vec2, validNodes: cc.Node[]): boolean {
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
    this.saveUndoSnapshot();
    this._dragSaveSnap = true;
    this._dragDat = dragDat;
    this.dragLayer.removeAllChildren();
    const itemDat = this._dragDat.itemNode;
    itemDat.parent = this.dragLayer;
    const localPos = this.dragLayer.convertToNodeSpaceAR(this._dragDat.mousePos);
    const dragOffset = this._dragDat.dragOffset;
    itemDat.setPosition(localPos.add(cc.v2(dragOffset)));
    this._mapInteraction.updateDragRoomHover(this._dragDat, this._hoverDat, this.hoverDrawer);

    // 刷新属性面板
    AttrMgr.instance.setTrackNd(itemDat);
    AttrMgr.instance.refreshAttrPanel();
  }


  // ==================== 鼠标事件 ====================

  private onMouseWheel(event: cc.Event.EventMouse) {
    const worldPos = event.getLocation();
    if (!this.isWorldPosMapArea(worldPos)) return;
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
      if (this.isWorldPosMapArea(worldPos)) {
        this._mapInteraction.updateDragRoomHover(this._dragDat, this._hoverDat, this.hoverDrawer);
      }
    } else if (event.getButton() === cc.Event.EventMouse.BUTTON_RIGHT) {
      this._isRightDown = true;
      this.clearHoverDat();
      this.hoverDrawer?.clear();
    }
  }

  private onMouseMove(event: cc.Event.EventMouse) {
    const worldPos = event.getLocation();
    if (!this.isWorldPosInEditorArea(worldPos)) {
      this.clearHover();
      return;
    }
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
          if (EditorSetting.Instance.getIsSnapY()) {
            this._mapInteraction.trySnapDraggedPointY(itemDat);
          }

          itemDat.getComponent(MapDrawItemBase)["onDragMove"]();

          // 更新 hover
          if (this.isWorldPosMapArea(worldPos)) {
            this._mapInteraction.updateDragRoomHover(this._dragDat, this._hoverDat, this.hoverDrawer);
          } else {
            this.clearHover();
          }

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
      this.handleHover(event.target, event.getLocation());
    }
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
  }

  private handleDragEnd(event: cc.Event.EventMouse) {
    if (!this._dragDat) return;

    const itemDat = this._dragDat.itemNode;
    const itemParent = this._dragDat.parent;

    if (!itemDat || !cc.isValid(itemDat) || !itemParent || !cc.isValid(itemParent)) {
      this._dragDat = null;
      return;
    }

    //不在地图区域内直接删除
    const worldPos = event.getLocation();
    if (!this.isWorldPosMapArea(worldPos)) {
      this._dragDat.itemNode.destroy();
      this._dragDat = null;
      this.clearHover();
      AttrMgr.instance.setTrackNd(null);
      AttrMgr.instance.refreshAttrPanel()
      return;
    }

    const type = itemDat.getComponent(MapDrawItem).getType();
    let targetParent: cc.Node = null;

    // =====================计算目标父节点========================
    //特殊点如起始点，撤离点
    if (itemDat.name === "playerExit" || itemDat.name === "playerCreate") {
      targetParent = itemParent;
    }
    //房间
    else if (type === UnitType.Room) {
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
      this.clearHover();
      AttrMgr.instance.setTrackNd(null);
      AttrMgr.instance.refreshAttrPanel()
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
    if (EditorSetting.Instance.getIsSnapY()) {
      this._mapInteraction.trySnapDraggedPointY(itemDat);
    }

    itemDat.getComponent(MapDrawItemBase)["onDragEnd"]();

    // 没有实际拖拽，不更新数据，直接return
    if (!this._isDrag) {
      this._dragDat = null;
      if (this._dragSaveSnap) {
        //没有实际拖拽的话，就撤回到拖拽开始的时候
        this._dragSaveSnap = false;
        this._undoManager.undo();
      }
      return;
    }

    // 房间拖拽后续处理
    const draggedRoom = itemDat.getComponent(MapDrawRoom);
    if (draggedRoom && /^Layer\d+$/.test(targetParent.name)) {
      this.handleRoomDragEnd(draggedRoom, targetParent, itemParent);
    }
    else if (itemDat.name == "playerExit" || itemDat.name == "playerCreate") {
      itemDat.parent = targetParent;
    }
    // 房间内item 刷新来源/目标房间数据
    else if (!this._mapInteraction.isOutRoomUnitType(type)) {
      this.refreshRoomDataOnMove(itemDat, targetParent);
    }

    AttrMgr.instance.refreshAttrPanel();

    this._dragDat = null;
  }

  //房间拖拽结束处理
  private handleRoomDragEnd(roomCom: MapDrawRoom, targetParent: cc.Node, oldParent: cc.Node) {
    const mapLoaderComp = this._mapInteraction.getMapLoaderComp();
    if (!mapLoaderComp) return;

    //刷新房间命名
    mapLoaderComp.syncRoomNameAndIdForLayer(roomCom, targetParent, oldParent);

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
  private refreshRoomDataOnMove(targetNd: cc.Node, targetParent: cc.Node) {
    const mapLoaderComp = this._mapInteraction.getMapLoaderComp();
    const oldRoomId = targetNd.getComponent(MapDrawItem).getRoomId();
    const oldOwnerRoom = MapLoader.ins.getRoomNode(oldRoomId)?.getComponent(MapDrawRoom);
    const newOwnerRoom = MapTool.findOwnerRoomByNode(targetParent);

    if (oldOwnerRoom && cc.isValid(oldOwnerRoom.node)) {
      oldOwnerRoom.getComponent(MapDrawRoom).refreshDat();
    }
    if (newOwnerRoom && cc.isValid(newOwnerRoom.node) && newOwnerRoom !== oldOwnerRoom) {
      newOwnerRoom.refreshDat();
    }
    mapLoaderComp?.rebuildPointIdsByLayer();
  }

  //清除hover
  private clearHover() {
    this._mapInteraction.clearDragHover(this._hoverDat, this.hoverDrawer);
  }

  //================= hover提示 ===========================
  private handleHover(target: any, worldPos: cc.Vec2) {
    if (!(target instanceof cc.Node)) return;
    //不在地图区域内不显示hover
    if (!this.isWorldPosMapArea(worldPos)) {
      this.clearHover();
      return;
    }

    const hoverNd = target;
    if (hoverNd.name === this._hoverDat?.name) return;

    const room = hoverNd.getComponent(MapDrawRoom);
    let boxes: HoverType[];

    const isArea = target.name.startsWith("mapArea");
    if (room) {
      const main = this._mapInteraction.buildHoverBoxForNode(hoverNd);
      if (!main) {
        this.clearHoverDat();
        this.hoverDrawer.clear();
        return;
      }
      boxes = [main];
      const units = room.node.getComponentsInChildren(MapDrawItem);
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        if (!u || !u.node || u.node === room.node) continue;
        const h = this._mapInteraction.buildHoverBoxForNode(u.node);
        if (h) boxes.push(h);
      }
    } else if (isArea) {
      const h = this._mapInteraction.buildHoverBoxForNode(hoverNd, true);
      if (!h) {
        this.clearHoverDat();
        this.hoverDrawer.clear();
        return;
      }
      boxes = [h];
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

  // ==================== 节点操作 ====================

  //删除节点
  public deleteNd() {
    const trackNd = AttrMgr.instance.getTrachNd();
    if (!trackNd || !cc.isValid(trackNd)) return;
    // 保存删除前的快照
    this.saveUndoSnapshot();

    const type = trackNd.getComponent(MapDrawItem).getType();
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
      mapLoaderComp?.deleteOurRoomUnits(trackNd);
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

  // ==================== 编辑器操作 ====================

  //新建
  public async onClickCreate() {
    EventManager.instance.emit(MapEditorEvent.ShowPop, PopUid.CreateFilePop, {
      exporter: this._mapExporter, cb: async (jsonContent, fileName) => {
        await this.changeMap(jsonContent, fileName);
      }
    });
  }

  //更换背景
  public async onClickChangeBg() {
    EventManager.instance.emit(MapEditorEvent.ShowPop, PopUid.ChangeBgPop);
  }

  //导入
  public async onClickImport() {
    const result = await this._mapExporter?.import();
    await this.changeMap(result.content, result.fileName);
  }

  //导入excel
  public async onClickImportExcel() {
    if (!CC_BUILD) return;
    const result = await window.electronAPI.openFileDialog();
    if (!result.success) return;
    const jsonObj = JSON.parse(result.content);
    const jsonName = result.fileName.split(".")[0];
    const path = EditorSetting.OuterJsonPath;
    //写入json
    window.electronAPI.writeFile(`${path}${jsonName}`, JSON.stringify(jsonObj))
      .then(() => {
        console.log("excel导入成功: ", jsonName);
        EventManager.instance.emit(MapEditorEvent.ShowTip, "excel导入成功: " + jsonName);
        //内存写入
        DynamicGetter.Ins.setExcelJson(jsonName, jsonObj);
      })
      .catch((err: any) => {
        console.error("excel导入失败: ", err);
        EventManager.instance.emit(MapEditorEvent.ShowTip, "excel导入失败: " + err);
      });
  }

  //导出excel
  public async onCLickExportExcel() {
    if (!CC_BUILD) return;
    this._mapExporter.saveAllDiskExcels();
    EventManager.instance.emit(MapEditorEvent.ShowTip, "excel导出成功: ");
  }

  //保存
  public onClickSave() {
    this._mapExporter?.save();
  }

  //导出
  public onCLickExport() {
    this._mapExporter?.export();
  }

  //清空
  public onClickClear() {
    this.saveUndoSnapshot();
    this._mapInteraction.getMapLoaderComp()?.clear();
  }



  //TODO：===================撤销功能===================

  /**
   * 保存撤销快照（供外部调用）
   */
  public saveUndoSnapshot() {
    const mapLoaderComp = this._mapInteraction.getMapLoaderComp();
    if (!mapLoaderComp) return;
    const snapshot = mapLoaderComp.saveDat();
    this._undoManager?.saveSnapshot(snapshot);
  }

  /**
   * 撤销 (Ctrl+Z)
   */
  private onUndo() {
    const snapshot = this._undoManager?.undo();
    if (!snapshot) {
      EventManager.instance.emit(MapEditorEvent.ShowTip, "没有可撤销的操作");
      return;
    }

    const mapLoaderComp = this._mapInteraction.getMapLoaderComp();
    if (mapLoaderComp) {
      // 清除当前追踪节点（恢复快照后旧节点引用可能失效）
      AttrMgr.instance.setTrackNd(null);
      EventManager.instance.emit(MapEditorEvent.ClearEditPanel);

      mapLoaderComp.createMapFromJson(snapshot);
      EventManager.instance.emit(MapEditorEvent.ShowTip, "撤销成功");
    }
  }

  /**
   * 重做 (Ctrl+Y)
   */
  private onRedo() {
    const snapshot = this._undoManager?.redo();
    if (!snapshot) {
      console.log("[Undo] No snapshot to redo");
      return;
    }

    const mapLoaderComp = this._mapInteraction.getMapLoaderComp();
    if (mapLoaderComp) {
      // 清除当前追踪节点（恢复快照后旧节点引用可能失效）
      AttrMgr.instance.setTrackNd(null);
      EventManager.instance.emit(MapEditorEvent.ClearEditPanel);

      mapLoaderComp.createMapFromJson(snapshot);
      console.log("[Undo] Redo success");
    }
  }

  // ==================== 缩放 ====================

  private setMapScale(scale: number) {
    EditorSetting.Instance.setMapScale(scale);
    const realScale = EditorSetting.Instance.getMapScale();
    this.editorRoot.scale = realScale;
    this.dragLayer.scale = realScale;
  }

  private clearHoverDat() {
    this._hoverDat.name = "";
  }

  // ==================== 路径线模式 ====================

  public onClickPathLineMode() {
    ModeMgr.instance.enterMode(ModeType.PathPointLink);
  }

  public updateCurModeDisplay(modeType: ModeType) {
    if (!modeType) {
      this.lineHightCamera.cullingMask = -3;
      this.curModeNd.active = false;
      this.hoverDrawer.setEnable(true);
      return;
    }
    this.curModeNd.active = true;
    this.curModeNd.children[0].addComponentSafe(cc.Label).string = `${ModeTypeDisplay[modeType]}...`;
    if (modeType == ModeType.PathPointLink || ModeType.SelectPoint) {
      this.lineHightCamera.cullingMask = -4;
      this.hoverDrawer.setEnable(false);
    }
  }

  onTogAutoReanme(event) {
    EditorSetting.Instance.setAutoRename(event.isChecked);
  }

  //切换地图
  private async changeMap(jsonContent: string, fileName: string) {
    //设置当前地图数据
    const name = fileName.split(".")[0];
    EditorSetting.Instance.setFileInfo({
      //去掉.json
      fileName: name.split(".")[0],
      fileJson: jsonContent,
    })
    EventManager.instance.emit(MapEditorEvent.UpdateFile, name);
    const mapDat = JSON.parse(jsonContent);
    //初始化工具类
    const width = mapDat.size.width;
    const height = mapDat.size.height;
    //可能之前有些地图数据是错的（字符串类型），这里纠正一下类型
    MapTool.init(this.mapLoader, cc.v2(Number(width), Number(height)));
    //设置地图缩放范围
    const graphSize = this.mapGraph.getContentSize();
    const scaleX = graphSize.width / width;
    const scaleY = graphSize.height / height;
    EditorSetting.Instance.setMinScale(Math.max(scaleX, scaleY));

    //TODO:加个菊花

    //创建地图
    const mapLoaderComp = this._mapInteraction.getMapLoaderComp();
    mapLoaderComp.createMapFromJson(jsonContent, fileName);
    EventManager.instance.emit(MapEditorEvent.ShowTip, "地图切换成功！！！");
    //清除快照
    this._undoManager.clear();
    //更换背景
    if (CC_BUILD) await this.changeMapBg();
  }

  //切换背景图片
  private async changeMapBg() {
    //如果当前没有背景图，则创建一个
    if (this.mapCanvasNd.childrenCount == 0) {
      const prefab = cc.instantiate(this.magBgPrefab);
      prefab.parent = this.mapCanvasNd;
      prefab.setPosition(0, 0);
      MapDrawTool.instance.setMapBgPrefab(prefab);
    }
    const mapBg = this.mapCanvasNd.children[0];
    const mapBgHandler = mapBg.getComponent(MapBgPrefab);
    // 从 MapBgManager 获取当前地图对应的背景图数据
    const mapDatName = EditorSetting.Instance.getFileInfo()?.fileName;
    const bgData = await MapBgManager.instance.loadBgByMapDta(mapDatName);
    if (!bgData) {
      mapBgHandler?.setDefault();
      EventManager.instance.emit(MapEditorEvent.ShowTip, "请绑定背景图！！！");
      return;
    }
    mapBgHandler?.init(bgData);
    const size = mapBgHandler.getSize();
    //通过背景图更新一下size
    MapTool.changeSize(cc.v2(size.width, size.height));
  }

  //切换关卡
  private async updateStageId() {
    const stageId = EditorSetting.Instance.getStageId();
    const cfgDat = DynamicGetter.Ins.getExcelJson("LevelBaseConfig")[stageId];
    const mapName = cfgDat?.levelRes1 ?? "";
    const mapBg = this.mapCanvasNd.children[0];
    const mapBgHandler = mapBg.getComponent(MapBgPrefab);
    if (!cfgDat) {
      EventManager.instance.emit(MapEditorEvent.ShowTip, "新建关卡，请绑定地图文件！！！");
      this.onClickClear();
      mapBgHandler?.setDefault();
      return;
    }
    if (!mapName) {
      EventManager.instance.emit(MapEditorEvent.ShowTip, "请绑定地图文件！！！");
      this.onClickClear();
      mapBgHandler?.setDefault();
      return;
    }
    if(!CC_BUILD) return;
    const result = await window.electronAPI.readFile(EditorSetting.MapDatPath + mapName);
    if (!result.success) {
      EventManager.instance.emit(MapEditorEvent.ShowTip, "读取地图文件失败！！！");
      this.onClickClear();
      mapBgHandler?.setDefault();
      return;
    }
    const jsonContent = result.content;
    await this.changeMap(jsonContent, mapName);
  }

}
