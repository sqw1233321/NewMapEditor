import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import MapDrawP from "../item/MapDrawP";
import MapDrawRoom from "../item/MapDrawRoom";
import MapDrawUnitBase from "../item/MapDrawUnitBase";
import MapTool from "../tool/MapTool";
import { UnitType } from "../type/mapTypes";
import {
  attrPanelType,
  attrPanelTypeBase,
  attrPanelTypeDoor,
  attrPanelTypeLadder,
  attrPanelTypePoint,
  attrPanelTypePortal,
  attrPanelTypeRoom,
  DragType,
  HoverType,
} from "../type/types";
import EditorSetting from "./EditorSetting";
import HoverDrawer from "./HoverDrawer";
import MapLoader from "../item/MapLoader";
import { MapDrawDatRoom } from "../item/MapDrawDat";
import MapDrawDoor from "../item/MapDrawDoor";
import MapDrawLadder from "../item/MapDrawLadder";
import MapDrawPortal from "../item/MapDrawPortal";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LevelScene extends cc.Component {
  @property(cc.Node)
  editorRoot: cc.Node = null;

  @property(cc.Camera)
  camera: cc.Camera = null;

  //TODO:后续动态获取
  @property(cc.JsonAsset)
  levelJson: cc.JsonAsset = null;

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

  private _isRightDown: boolean = false;
  private _isLeftDown: boolean = false;
  private _isDrag: boolean = false;
  private _dragDat: DragType = null;
  private _hoverDat: HoverType = {
    name: "",
    worldPos: cc.Vec2.ZERO,
    width: 0,
    height: 0,
  };
  //拖拽时命中的房间（用于高亮）
  private _dragHoverRoomName: string = "";
  //属性面板追踪的节点(注意删除节点时的问题)
  private _trackNd: cc.Node;

  /** 世界坐标是否落在指定节点的 world rect 内（节点为空则视为不命中） */
  private isWorldPosInNodeRect(
    worldPos: cc.Vec2,
    node: cc.Node | null,
  ): boolean {
    if (!node || !cc.isValid(node)) return false;
    const box = node.getBoundingBoxToWorld();
    return box.contains(worldPos);
  }

  /**
   * 是否允许地图交互：
   * - 鼠标在 editorRoot 的 world rect 内
   * - 且不在 itemPanelNd 的 world rect 内（避免 UI 面板误触）
   */
  private isWorldPosInEditorArea(worldPos: cc.Vec2): boolean {
    if (this.isWorldPosInNodeRect(worldPos, this.mapGraph) || this.isWorldPosInNodeRect(worldPos, this.itemPanelNd)) return true;
    return false;
  }

  protected onLoad(): void {
    this.node.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this, true);
    this.node.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
    this.node.on(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
    EventManager.instance.on(MapEditorEvent.DragItem, this.startDrag, this);
    EventManager.instance.on(
      MapEditorEvent.PathPointLinkClick,
      this.onPathPointLinkClick,
      this,
    );
    EventManager.instance.on(
      MapEditorEvent.LadderBindPointClick,
      this.onLadderBindPointClick,
      this,
    );
    EventManager.instance.on(
      MapEditorEvent.PortalBindPortalClick,
      this.onPortalBindPortalClick,
      this,
    );
    EventManager.instance.on(
      MapEditorEvent.PortalBindPathPointClick,
      this.onPortalBindPathPointClick,
      this,
    );
    EventManager.instance.on(
      MapEditorEvent.RoomUnlockBindRoomClick,
      this.onRoomUnlockBindRoomClick,
      this,
    );
    EventManager.instance.on(
      MapEditorEvent.RoomUnlockBindPointClick,
      this.onRoomUnlockBindPointClick,
      this,
    );
    EventManager.instance.on(
      MapEditorEvent.UpdateFromAttrPanel,
      this.refreshNdAttr,
      this,
    );
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);

    MapTool.init(this.mapLoader);
    this.createLevel();
  }

  protected onDestroy(): void {
    EventManager.instance.off(MapEditorEvent.DragItem, this.startDrag, this);
    EventManager.instance.off(
      MapEditorEvent.PathPointLinkClick,
      this.onPathPointLinkClick,
      this,
    );
    EventManager.instance.off(
      MapEditorEvent.LadderBindPointClick,
      this.onLadderBindPointClick,
      this,
    );
    EventManager.instance.off(
      MapEditorEvent.PortalBindPortalClick,
      this.onPortalBindPortalClick,
      this,
    );
    EventManager.instance.off(
      MapEditorEvent.PortalBindPathPointClick,
      this.onPortalBindPathPointClick,
      this,
    );
    EventManager.instance.off(
      MapEditorEvent.RoomUnlockBindRoomClick,
      this.onRoomUnlockBindRoomClick,
      this,
    );
    EventManager.instance.off(
      MapEditorEvent.RoomUnlockBindPointClick,
      this.onRoomUnlockBindPointClick,
      this,
    );
    EventManager.instance.off(
      MapEditorEvent.UpdateFromAttrPanel,
      this.refreshNdAttr,
      this,
    );
    cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
  }

  private async createLevel() {
    await this.getLevelJson();
    const graphSize = this.mapGraph.getContentSize();
    const scaleX = graphSize.width / this.mapSize.x;
    const scaleY = graphSize.height / this.mapSize.y;
    EditorSetting.Instance.setMinScale(Math.max(scaleX, scaleY));
  }

  async getLevelJson() {
    const json = this.levelJson.json;
    return json;
  }

  /** 根据世界坐标命中房间（后遍历优先，尽量选上层叠放时更“靠上”的房间） */
  private findRoomAtWorldPos(worldPos: cc.Vec2): MapDrawRoom | null {
    if (!this.mapLoader) return null;
    const rooms = this.mapLoader.getComponentsInChildren(MapDrawRoom);
    const wp = cc.v2(worldPos.x, worldPos.y);
    for (let i = rooms.length - 1; i >= 0; i--) {
      const room = rooms[i];
      const box = room.node.getBoundingBoxToWorld();
      if (box.contains(wp)) return room;
    }
    return null;
  }

  /** 拖拽结束时，根据 hover 信息找到目标房间 */
  private findHoverRoomForDrag(): MapDrawRoom | null {
    if (!this.mapLoader || !this._dragDat) return null;
    const rooms = this.mapLoader.getComponentsInChildren(MapDrawRoom);
    const hoverRoomId = this._dragDat.hoverRoomId;
    const hoverRoomName = this._dragDat.hoverRoomName;
    for (let i = rooms.length - 1; i >= 0; i--) {
      const room = rooms[i];
      if (hoverRoomId !== undefined && room.getId() === hoverRoomId)
        return room;
      if (hoverRoomName && room.node.name === hoverRoomName) return room;
    }
    return null;
  }

  /** 非房间节点落到房间时，选择合适的容器（点进 pointCont，其它进 unitCont） */
  private getNonRoomDropParent(
    itemNd: cc.Node,
    hoverRoom: MapDrawRoom,
  ): cc.Node {
    if (!itemNd || !hoverRoom) return null;
    if (itemNd.getComponent("MapDrawP")) {
      return hoverRoom.node.getChildByName("pointCont") || hoverRoom.node;
    }
    return hoverRoom.node.getChildByName("unitCont") || hoverRoom.node;
  }

  /** 根据任意子节点找到其所属房间 */
  private findOwnerRoomByNode(nd: cc.Node): MapDrawRoom | null {
    let cur = nd;
    while (cur) {
      const room = cur.getComponent(MapDrawRoom);
      if (room) return room;
      cur = cur.parent;
    }
    return null;
  }

  /** 悬停框：与 MapDrawUnitBase 的命中盒一致 */
  private buildHoverBoxForNode(hoverNd: cc.Node): HoverType | null {
    const controller = hoverNd.getComponent(MapDrawUnitBase);
    if (!controller) return null;
    const mapScale = EditorSetting.Instance.getMapScale();
    const offset = cc.v2(
      hoverNd.anchorX * hoverNd.getContentSize().width * mapScale,
      hoverNd.anchorY * hoverNd.getContentSize().height * mapScale,
    );
    return {
      name: hoverNd.name,
      worldPos: hoverNd
        .convertToWorldSpaceAR(cc.Vec2.ZERO)
        .clone()
        .subtract(offset),
      width: controller.getHoverBoxSize().width,
      height: controller.getHoverBoxSize().height,
    };
  }

  /** 根据世界坐标命中 layer 容器（用于拖拽房间时，鼠标不在任意房间上也能高亮整个 layer） */
  private findLayerAtWorldPos(worldPos: cc.Vec2): cc.Node | null {
    if (!this.mapLoader) return null;
    const wp = cc.v2(worldPos.x, worldPos.y);

    // mapLoader.buildBaseNd() 里会创建名为 "LayerCont" 的容器，实际的层节点命名为 "Layer{n}"
    const layerCont = this.mapLoader.getChildByName("LayerCont");
    if (!layerCont) return null;

    for (const layerNd of layerCont.children) {
      // 避免把 LayerCont 自己/其它非 Layer{n} 节点误判
      if (!layerNd || !/^Layer\d+$/.test(layerNd.name)) continue;
      const box = layerNd.getBoundingBoxToWorld();
      if (box.contains(wp)) return layerNd;
    }
    return null;
  }

  //清楚hover框
  private clearDragRoomHover() {
    this._dragHoverRoomName = "";
    if (this._dragDat) {
      this._dragDat.hoverRoomId = undefined;
      this._dragDat.hoverRoomName = undefined;
      this._dragDat.hoverLayerNode = undefined;
      this._dragDat.hoverLayerName = undefined;
    }
    this.clearHoverDat();
    this.hoverDrawer?.clear();
  }

  //更新hover框
  private updateDragRoomHover(worldMousePos: cc.Vec2) {
    if (!this._dragDat) return;
    // 如果当前拖拽的是“房间”，则根据鼠标命中的 layer 容器高亮整个 layer
    const draggedRoom = this._dragDat.itemNode.getComponent(MapDrawRoom);
    if (draggedRoom) {
      // 没有命中其它房间时，也需要让 dragDat 里有当前拖拽房间的信息
      this._dragDat.hoverRoomId = draggedRoom.getId();
      this._dragDat.hoverRoomName = draggedRoom.node.name;

      const layerNd = this.findLayerAtWorldPos(worldMousePos);
      if (!layerNd) {
        this._dragDat.hoverLayerNode = undefined;
        this._dragDat.hoverLayerName = undefined;
        // 只清空 hover 框，不清空 hoverRoomId/hoverRoomName
        this._dragHoverRoomName = "";
        this.clearHoverDat();
        this.hoverDrawer?.clear();
        return;
      }
      this._dragDat.hoverLayerNode = layerNd;
      this._dragDat.hoverLayerName = layerNd.name;
      if (layerNd.name === this._dragHoverRoomName) return;
      this._dragHoverRoomName = layerNd.name;
      this._hoverDat.name = layerNd.name;
      const mapScale = EditorSetting.Instance.getMapScale();
      const size = layerNd.getContentSize();
      const offset = cc.v2(
        layerNd.anchorX * size.width * mapScale,
        layerNd.anchorY * size.height * mapScale,
      );
      this._hoverDat.worldPos = layerNd
        .convertToWorldSpaceAR(cc.Vec2.ZERO)
        .clone()
        .subtract(offset);
      this._hoverDat.width = size.width * mapScale;
      this._hoverDat.height = size.height * mapScale;
      this.hoverDrawer?.draw(this._hoverDat);
      return;
    }

    // 非房间拖拽：按房间命中判断 hover 框
    this._dragDat.hoverLayerNode = undefined;
    this._dragDat.hoverLayerName = undefined;

    const room = this.findRoomAtWorldPos(worldMousePos);
    if (!room) {
      this.clearDragRoomHover();
      return;
    }

    const roomNd = room.node;
    if (roomNd.name === this._dragHoverRoomName) return;
    this._dragHoverRoomName = roomNd.name;

    this._dragDat.hoverRoomId = room.getId();
    this._dragDat.hoverRoomName = roomNd.name;

    this._hoverDat.name = roomNd.name;
    const mapScale = EditorSetting.Instance.getMapScale();
    const size = roomNd.getContentSize();
    const offset = cc.v2(
      roomNd.anchorX * size.width * mapScale,
      roomNd.anchorY * size.height * mapScale,
    );
    this._hoverDat.worldPos = roomNd
      .convertToWorldSpaceAR(cc.Vec2.ZERO)
      .clone()
      .subtract(offset);
    this._hoverDat.width = size.width * mapScale;
    this._hoverDat.height = size.height * mapScale;
    this.hoverDrawer?.draw(this._hoverDat);
  }

  //操作事件
  public startDrag(dragDat: DragType) {
    if (!dragDat) {
      console.log("not has dargDat");
      return;
    }
    this._dragDat = dragDat;
    this.dragLayer.removeAllChildren();
    const itemDat = this._dragDat.itemNode;
    itemDat.parent = this.dragLayer;
    const localPos = this.dragLayer.convertToNodeSpaceAR(
      this._dragDat.mousePos,
    );
    const dragOffset = this._dragDat.dragOffset;
    itemDat.setPosition(localPos.add(cc.v2(dragOffset)));
    //刷新属性面板
    //拖拽过程中：判断鼠标是否覆盖到某个房间或者Layer上
    this.updateDragRoomHover(this._dragDat.mousePos);
    this.refreshAttrPanel();
  }

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
    // UI（属性面板等）上的操作不进入地图交互
    if (!this.isWorldPosInEditorArea(worldPos)) return;
    if (event.getButton() === cc.Event.EventMouse.BUTTON_LEFT) {
      this._isLeftDown = true;
      this.clearHoverDat();
      this.hoverDrawer?.clear();
      //拖拽过程中：判断鼠标是否覆盖到某个房间或者Layer上
      this.updateDragRoomHover(worldPos);
    } else if (event.getButton() === cc.Event.EventMouse.BUTTON_RIGHT) {
      this._isRightDown = true;
      this.clearHoverDat();
      this.hoverDrawer?.clear();
    }
  }

  private onMouseMove(event: cc.Event.EventMouse) {
    this._isDrag = true;
    //点击了左键
    if (this._isLeftDown) {
      if (this._dragDat) {
        const itemDat = this._dragDat.itemNode;
        const dragOffset = this._dragDat.dragOffset;
        if (itemDat && cc.isValid(itemDat)) {
          const localPos = this.dragLayer.convertToNodeSpaceAR(
            event.getLocation(),
          );
          itemDat.setPosition(localPos.add(cc.v2(dragOffset)));
          this.syncLadderWithDraggedNode(itemDat);
          //拖拽过程中：判断鼠标是否覆盖到某个房间或者Layer上
          this.updateDragRoomHover(event.getLocation());
          //刷新属性面板
          this.refreshAttrPanel();
        }
      }
    }
    //点击了右键
    else if (this._isRightDown) {
      let delta = event.getDelta();
      this.editorRoot.x += delta.x;
      this.editorRoot.y += delta.y;
    }
    //什么都没点击,框选节点
    else {
      if (event.target instanceof cc.Node) {
        const hoverNd = event.target;
        if (hoverNd.name == this._hoverDat?.name) return;
        const room = hoverNd.getComponent(MapDrawRoom);
        let boxes: HoverType[];
        if (room) {
          const main = this.buildHoverBoxForNode(hoverNd);
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
            const h = this.buildHoverBoxForNode(u.node);
            if (h) boxes.push(h);
          }
        } else {
          const h = this.buildHoverBoxForNode(hoverNd);
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
        const loader = this.mapLoader?.getComponent(MapLoader) ?? null;
        let linkSegs: Array<{ p0: cc.Vec2; p1: cc.Vec2 }> | undefined;
        if (room) {
          linkSegs = loader?.getPathLinkWorldSegmentsForRoomOwner(room.getId());
        } else if (hoverNd.getComponent(MapDrawP)) {
          linkSegs = loader?.getPathLinkWorldSegmentsFromPoint(hoverNd);
        }
        this.hoverDrawer?.drawMulti(hoverNd.name, boxes, linkSegs);
      }
    }
  }

  private onMouseUp(event: cc.Event.EventMouse) {
    if (event.getButton() === cc.Event.EventMouse.BUTTON_RIGHT) {
      const wasRightDown = this._isRightDown;
      this._isRightDown = false;
      // 没有经历过右键按下，则忽略右键抬起（避免 UI 上抬起误触发）
      if (!wasRightDown) return;
    } else if (event.getButton() === cc.Event.EventMouse.BUTTON_LEFT) {
      const wasLeftDown = this._isLeftDown;
      this._isLeftDown = false;
      // 没有经历过左键按下，则忽略左键抬起（避免 UI 上抬起误触发）
      if (!wasLeftDown) return;
      if (this._dragDat) {
        const itemDat = this._dragDat.itemNode;
        const itemParent = this._dragDat.parent;
        const dragOffset = this._dragDat.dragOffset;
        if (
          itemDat &&
          cc.isValid(itemDat) &&
          itemParent &&
          cc.isValid(itemParent)
        ) {
          //放回原位
          const draggedRoom = itemDat.getComponent(MapDrawRoom);
          const oldOwnerRoom = this.findOwnerRoomByNode(itemParent);
          let targetParent = itemParent;
          //门
          if (draggedRoom) {
            //拖拽到layer区域
            if (
              this._dragDat.hoverLayerNode &&
              cc.isValid(this._dragDat.hoverLayerNode)
            ) {
              targetParent = this._dragDat.hoverLayerNode;
            }
            // 拖到非 layer 区域：按相对 y 位置先创建新 layer，再放入房间
            else {
              const mapLoaderComp =
                this.mapLoader?.getComponent(MapLoader) ?? null;
              if (mapLoaderComp) {
                const roomWorldPos = itemDat.convertToWorldSpaceAR(
                  cc.Vec2.ZERO,
                );
                const newLayer = mapLoaderComp.createLayerForRoomDrop(
                  roomWorldPos.y,
                );
                if (newLayer) targetParent = newLayer;
              }
            }
          }
          //传送门
          else if (itemDat.getComponent(MapDrawPortal)) {
            targetParent = this.mapLoader
              .getComponent(MapLoader)
              .getPortalParent();
          } else {
            const hoverRoom = this.findHoverRoomForDrag();
            if (hoverRoom && cc.isValid(hoverRoom.node)) {
              const nonRoomParent = this.getNonRoomDropParent(
                itemDat,
                hoverRoom,
              );
              if (nonRoomParent && cc.isValid(nonRoomParent)) {
                targetParent = nonRoomParent;
              }
            }
          }
          if (targetParent !== itemParent) {
            // 更换父节点（从 panel/旧 layer 到当前 layer）时，使用“世界坐标->新父节点局部坐标”定位，避免 dragOffset 失效
            const worldPos = itemDat.convertToWorldSpaceAR(cc.Vec2.ZERO);
            itemDat.parent = targetParent;
            const localPos = targetParent.convertToNodeSpaceAR(worldPos);
            itemDat.setPosition(localPos);
          } else {
            itemDat.parent = itemParent;
            const localPos = itemParent.convertToNodeSpaceAR(
              event.getLocation(),
            );
            itemDat.setPosition(localPos.add(cc.v2(dragOffset)));
          }

          if (!this._isDrag) return;

          //房间名字同步
          if (
            draggedRoom &&
            targetParent &&
            /^Layer\d+$/.test(targetParent.name)
          ) {
            //刷新房间名字
            this.syncRoomNameAndIdForLayer(
              draggedRoom,
              targetParent,
              itemParent,
            );
            // 父节点发生变化（从旧 layer 到新 layer）后，需要重新计算两个 layer 的尺寸
            const mapLoaderComp =
              this.mapLoader?.getComponent(MapLoader) ?? null;
            if (mapLoaderComp) {
              if (itemParent && /^Layer\d+$/.test(itemParent.name)) {
                mapLoaderComp.refreshLayerBoundsByNode(itemParent);
              }
              if (
                targetParent &&
                /^Layer\d+$/.test(targetParent.name) &&
                itemParent.name !== targetParent.name
              ) {
                mapLoaderComp.refreshLayerBoundsByNode(targetParent);
              }
              // 房间迁移后，旧层可能被搬空，统一清理空 layer
              mapLoaderComp.cleanupEmptyLayersAfterMove();
              // layer 变化后，路径点命名需要按规则重排
              mapLoaderComp.rebuildPointIdsByLayer();
            }
          }
          // 非房间节点迁移后，刷新来源/目标房间，确保 roomId 与导出数据同步
          if (!draggedRoom) {
            const newOwnerRoom = this.findOwnerRoomByNode(targetParent);
            if (oldOwnerRoom && cc.isValid(oldOwnerRoom.node)) {
              oldOwnerRoom.refreshDat();
            }
            if (
              newOwnerRoom &&
              cc.isValid(newOwnerRoom.node) &&
              newOwnerRoom !== oldOwnerRoom
            ) {
              newOwnerRoom.refreshDat();
            }
            const mapLoaderComp =
              this.mapLoader?.getComponent(MapLoader) ?? null;
            if (mapLoaderComp) {
              mapLoaderComp.rebuildPointIdsByLayer();
            }
          }
          this.refreshAttrPanel();
        }
        this._dragDat = null;
      }
      this.clearDragRoomHover();
    }
  }

  private onKeyDown(event: cc.Event.EventKeyboard) {
    //退出按钮
    if (event.keyCode === cc.macro.KEY.escape) {
      if (EditorSetting.Instance.isPathPointLinkMode()) {
        this.cancelPathPointLinkPick();
        this.setPathPointLinkMode(false);
      }
      if (EditorSetting.Instance.isLadderBindMode()) {
        this.cancelLadderBindPick();
        this.setLadderBindMode(false);
      }
      if (EditorSetting.Instance.isPortalBindMode()) {
        this.cancelPortalBindPick();
        this.setPortalBindMode(false);
      }
      if (EditorSetting.Instance.isRoomUnlockBindMode()) {
        this.cancelRoomUnlockBindPick();
        this.setRoomUnlockBindMode(false);
      }
    }
    //p键，进入连线模式
    else if (event.keyCode === cc.macro.KEY.p) {
      this.togglePathPointLinkMode();
    }
    //l键，进入梯子绑定模式
    else if (event.keyCode === cc.macro.KEY.l) {
      this.toggleLadderBindMode();
    }
    //o键，进入传送门绑定模式
    else if (
      event.keyCode === (cc.macro.KEY as any).o ||
      event.keyCode === (cc.macro.KEY as any).O ||
      event.keyCode === 79
    ) {
      this.togglePortalBindMode();
    }
    //r键，进入房间解锁点绑定模式
    else if (event.keyCode === cc.macro.KEY.r) {
      this.toggleRoomUnlockBindMode();
    }
  }
  //模式：
  //连线模式
  public setPathPointLinkMode(enabled: boolean) {
    if (enabled && EditorSetting.Instance.isLadderBindMode()) {
      this.setLadderBindMode(false);
    }
    if (enabled && EditorSetting.Instance.isPortalBindMode()) {
      this.setPortalBindMode(false);
    }
    if (!enabled) {
      const n = EditorSetting.Instance.getPathPointLinkStart();
      if (n && cc.isValid(n)) {
        n.getComponent(MapDrawP)?.setLinkHighlight(false);
      }
    }
    EditorSetting.Instance.setPathPointLinkMode(enabled);
  }

  public togglePathPointLinkMode() {
    this.setPathPointLinkMode(!EditorSetting.Instance.isPathPointLinkMode());
  }

  private cancelPathPointLinkPick() {
    const n = EditorSetting.Instance.getPathPointLinkStart();
    if (n && cc.isValid(n)) {
      n.getComponent(MapDrawP)?.setLinkHighlight(false);
    }
    EditorSetting.Instance.setPathPointLinkStart(null);
  }

  //梯子绑定模式
  public setLadderBindMode(enabled: boolean) {
    if (enabled && EditorSetting.Instance.isPathPointLinkMode()) {
      this.setPathPointLinkMode(false);
    }
    if (enabled && EditorSetting.Instance.isPortalBindMode()) {
      this.setPortalBindMode(false);
    }
    if (!enabled) {
      this.cancelLadderBindPick();
    }
    EditorSetting.Instance.setLadderBindMode(enabled);
  }

  public toggleLadderBindMode() {
    this.setLadderBindMode(!EditorSetting.Instance.isLadderBindMode());
  }

  private cancelLadderBindPick() {
    const n = EditorSetting.Instance.getLadderBindStart();
    if (n && cc.isValid(n)) {
      n.getComponent(MapDrawP)?.setLinkHighlight(false);
    }
    EditorSetting.Instance.setLadderBindStart(null);
  }

  //传送门绑定模式（仿连线：先点传送门，再点一个路径点作为终点）
  public setPortalBindMode(enabled: boolean) {
    if (enabled && EditorSetting.Instance.isPathPointLinkMode()) {
      this.setPathPointLinkMode(false);
    }
    if (enabled && EditorSetting.Instance.isLadderBindMode()) {
      this.setLadderBindMode(false);
    }
    if (enabled && EditorSetting.Instance.isRoomUnlockBindMode()) {
      this.setRoomUnlockBindMode(false);
    }
    if (!enabled) {
      this.cancelPortalBindPick();
    }
    EditorSetting.Instance.setPortalBindMode(enabled);
  }

  public togglePortalBindMode() {
    this.setPortalBindMode(!EditorSetting.Instance.isPortalBindMode());
  }

  private cancelPortalBindPick() {
    const n = EditorSetting.Instance.getPortalBindPortal();
    if (n && cc.isValid(n)) {
      n.getComponent(MapDrawPortal)?.setPortalBindHighlight(false);
    }
    EditorSetting.Instance.setPortalBindPortal(null);
  }

  //房间解锁点绑定模式（先点房间，再点路径点切换）
  public setRoomUnlockBindMode(enabled: boolean) {
    if (enabled && EditorSetting.Instance.isPathPointLinkMode()) {
      this.setPathPointLinkMode(false);
    }
    if (enabled && EditorSetting.Instance.isLadderBindMode()) {
      this.setLadderBindMode(false);
    }
    if (enabled && EditorSetting.Instance.isPortalBindMode()) {
      this.setPortalBindMode(false);
    }
    if (!enabled) {
      this.cancelRoomUnlockBindPick();
    }
    EditorSetting.Instance.setRoomUnlockBindMode(enabled);
  }

  public toggleRoomUnlockBindMode() {
    this.setRoomUnlockBindMode(!EditorSetting.Instance.isRoomUnlockBindMode());
  }

  private cancelRoomUnlockBindPick() {
    const n = EditorSetting.Instance.getRoomUnlockBindRoom();
    if (n && cc.isValid(n)) {
      n.getComponent(MapDrawRoom)?.setUnlockBindHighlight(false);
    }
    EditorSetting.Instance.setRoomUnlockBindRoom(null);
  }

  private onRoomUnlockBindRoomClick(node: cc.Node) {
    if (!EditorSetting.Instance.isRoomUnlockBindMode()) return;
    if (!node || !cc.isValid(node)) return;
    const roomCom = node.getComponent(MapDrawRoom);
    if (!roomCom) return;

    const prev = EditorSetting.Instance.getRoomUnlockBindRoom();
    if (prev && cc.isValid(prev) && prev !== node) {
      prev.getComponent(MapDrawRoom)?.setUnlockBindHighlight(false);
    }
    if (prev === node) {
      roomCom.setUnlockBindHighlight(false);
      EditorSetting.Instance.setRoomUnlockBindRoom(null);
      return;
    }

    EditorSetting.Instance.setRoomUnlockBindRoom(node);
    roomCom.setUnlockBindHighlight(true);
  }

  private onRoomUnlockBindPointClick(node: cc.Node) {
    if (!EditorSetting.Instance.isRoomUnlockBindMode()) return;
    if (!node || !cc.isValid(node)) return;
    const pointNd = node;
    const pointCom = pointNd.getComponent(MapDrawP);
    if (!pointCom) return;

    const roomNd = EditorSetting.Instance.getRoomUnlockBindRoom();
    if (!roomNd || !cc.isValid(roomNd)) return;
    const roomCom = roomNd.getComponent(MapDrawRoom);
    if (!roomCom) return;

    const prev = roomCom.unLockPoints || [];
    const exists = prev.indexOf(pointNd) >= 0;
    const next = exists ? prev.filter((p) => p !== pointNd) : prev.concat([pointNd]);
    roomCom.setUnLockPoints(next);
    roomCom.refreshDat();
    this.refreshAttrPanel();
  }

  private onPortalBindPortalClick(node: cc.Node) {
    if (!EditorSetting.Instance.isPortalBindMode()) return;
    if (!node || !cc.isValid(node)) return;
    const portalCom = node.getComponent(MapDrawPortal);
    if (!portalCom) return;

    const prev = EditorSetting.Instance.getPortalBindPortal();
    if (prev && cc.isValid(prev) && prev !== node) {
      prev.getComponent(MapDrawPortal)?.setPortalBindHighlight(false);
    }

    if (prev === node) {
      portalCom.setPortalBindHighlight(false);
      EditorSetting.Instance.setPortalBindPortal(null);
      return;
    }

    EditorSetting.Instance.setPortalBindPortal(node);
    portalCom.setPortalBindHighlight(true);
  }

  private onPortalBindPathPointClick(node: cc.Node) {
    if (!EditorSetting.Instance.isPortalBindMode()) return;
    if (!node || !cc.isValid(node)) return;
    const pointCom = node.getComponent(MapDrawP);
    if (!pointCom) return;

    const portalNd = EditorSetting.Instance.getPortalBindPortal();
    if (!portalNd || !cc.isValid(portalNd)) return;

    const portalCom = portalNd.getComponent(MapDrawPortal);
    if (!portalCom) return;

    portalCom.setLinkId(pointCom.getId());
    portalCom.setPortalBindHighlight(false);
    EditorSetting.Instance.setPortalBindPortal(null);
    this.refreshAttrPanel();
  }

  private onPathPointLinkClick(node: cc.Node) {
    if (!EditorSetting.Instance.isPathPointLinkMode()) return;
    if (!node || !cc.isValid(node)) return;
    const target = node.getComponent(MapDrawP);
    if (!target) return;

    const startNd = EditorSetting.Instance.getPathPointLinkStart();
    if (!startNd || !cc.isValid(startNd)) {
      EditorSetting.Instance.setPathPointLinkStart(node);
      target.setLinkHighlight(true);
      return;
    }

    const startCom = startNd.getComponent(MapDrawP);
    if (!startCom) {
      EditorSetting.Instance.setPathPointLinkStart(null);
      return;
    }

    if (startNd === node) {
      startCom.setLinkHighlight(false);
      EditorSetting.Instance.setPathPointLinkStart(null);
      return;
    }

    if (startCom.hasLinkTo(node)) {
      startCom.removeLink(node);
      target.removeLink(startNd);
    } else {
      startCom.addLink(node);
      target.addLink(startNd);
    }

    startCom.setLinkHighlight(false);
    EditorSetting.Instance.setPathPointLinkStart(null);
    this.refreshAttrPanel();
  }

  private onLadderBindPointClick(node: cc.Node) {
    if (!EditorSetting.Instance.isLadderBindMode()) return;
    if (!node || !cc.isValid(node)) return;
    const targetPoint = node.getComponent(MapDrawP);
    if (!targetPoint) return;
    const ladderNode = this._trackNd;
    const ladderCom = ladderNode?.getComponent(MapDrawLadder);
    if (!ladderCom) return;

    const startNd = EditorSetting.Instance.getLadderBindStart();
    if (!startNd || !cc.isValid(startNd)) {
      EditorSetting.Instance.setLadderBindStart(node);
      targetPoint.setLinkHighlight(true);
      return;
    }

    const startPoint = startNd.getComponent(MapDrawP);
    if (!startPoint) {
      EditorSetting.Instance.setLadderBindStart(null);
      return;
    }
    if (startNd === node) {
      startPoint.setLinkHighlight(false);
      EditorSetting.Instance.setLadderBindStart(null);
      return;
    }

    const startWorld = startNd.convertToWorldSpaceAR(cc.Vec2.ZERO);
    const endWorld = node.convertToWorldSpaceAR(cc.Vec2.ZERO);
    const bindStart = startWorld.y <= endWorld.y ? startNd : node;
    const bindEnd = bindStart === startNd ? node : startNd;
    ladderCom.setBinds([bindStart, bindEnd]);
    startPoint.setLinkHighlight(false);
    EditorSetting.Instance.setLadderBindStart(null);
    this.syncLadderToBindPoints(ladderCom);
    this.refreshAttrPanel();
  }

  private setNodeWorldPos(node: cc.Node, worldPos: cc.Vec2) {
    if (!node || !node.parent) return;
    node.setPosition(node.parent.convertToNodeSpaceAR(worldPos));
  }

  //根据梯子位置反推两个绑定点位置
  private syncBindPointsByLadder(ladderCom: MapDrawLadder) {
    if (!ladderCom || !cc.isValid(ladderCom.node)) return;
    const binds = ladderCom.bindPoints || [];
    if (binds.length < 2) return;
    const p0 = binds[0];
    const p1 = binds[1];
    if (!p0 || !p1 || !cc.isValid(p0) || !cc.isValid(p1)) return;
    const w0 = ladderCom.node.convertToWorldSpaceAR(cc.v2(0, 0));
    const h = ladderCom.node.getContentSize().height;
    const w1 = ladderCom.node.convertToWorldSpaceAR(cc.v2(0, h));
    this.setNodeWorldPos(p0, w0);
    this.setNodeWorldPos(p1, w1);
    this.mapLoader.getComponent(MapLoader).rebuildPointIdsByLayer();
  }

  //根据两个绑定点反推梯子位置和高度
  private syncLadderToBindPoints(ladderCom: MapDrawLadder) {
    if (!ladderCom || !cc.isValid(ladderCom.node)) return;
    const binds = ladderCom.bindPoints || [];
    if (binds.length < 2) return;
    const p0 = binds[0];
    const p1 = binds[1];
    if (!p0 || !p1 || !cc.isValid(p0) || !cc.isValid(p1)) return;
    const w0 = p0.convertToWorldSpaceAR(cc.Vec2.ZERO);
    const w1 = p1.convertToWorldSpaceAR(cc.Vec2.ZERO);
    this.setNodeWorldPos(ladderCom.node, w0);
    const height = Math.max(1, w1.y - w0.y);
    const curSize = ladderCom.node.getContentSize();
    ladderCom.node.setContentSize(curSize.width, height);
  }

  //拖拽梯子/点时联动三者
  private syncLadderWithDraggedNode(draggedNode: cc.Node) {
    if (!draggedNode || !cc.isValid(draggedNode)) return;
    const draggedLadder = draggedNode.getComponent(MapDrawLadder);
    if (draggedLadder) {
      this.syncBindPointsByLadder(draggedLadder);
      return;
    }
    const draggedPoint = draggedNode.getComponent(MapDrawP);
    if (!draggedPoint || !this.mapLoader) return;
    const ladders = this.mapLoader.getComponentsInChildren(MapDrawLadder);
    ladders.forEach((ladderCom) => {
      const binds = ladderCom.bindPoints || [];
      if (binds.indexOf(draggedNode) >= 0) {
        this.syncLadderToBindPoints(ladderCom);
      }
    });
  }

  /** 拖拽后把 Room 落到 Layer{n}：命名规则：地图编号_layer-1_房间号 */
  private syncRoomNameAndIdForLayer(
    roomCom: MapDrawRoom,
    newLayerNd: cc.Node,
    oldLayerNd: cc.Node,
  ) {
    if (!roomCom || !newLayerNd) return;

    // 地图编号：从 levelJson.name 末尾提取数字（如 Level1 => 1）
    const mapName = this.levelJson?.name ?? "";
    const mapNoMatch = /(\d+)$/.exec(mapName);
    const mapNo = mapNoMatch ? Number(mapNoMatch[1]) : 0;
    const oldCfgId = roomCom.getId();

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

      // 最后一位从 1 开始
      rooms.forEach((r, index) => {
        const roomNo = index + 1;
        const renamedId = mapNo * 100 + (layerNo - 1) * 10 + roomNo;
        r.node.name = `room_${renamedId}`;
        const controller = r.node.getComponent(MapDrawRoom);
        controller.updateRoomId(renamedId);
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

    // 当前拖拽后的世界坐标/尺寸
    const worldPos = roomCom.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
    const size = roomCom.node.getContentSize();

    const roomDat: MapDrawDatRoom = {
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
    };

    // 如果是“未初始化/占位”的新房间（cfgId=0 常见），清理 prefab 里可能残留的解锁点
    if (oldCfgId === 0) {
      roomCom.unLockPoints = [];
    }

    // 保留当前 bg 颜色（初始化时会用到）
    let color = cc.Color.WHITE;
    const bgNd = roomCom.node.getChildByName("bg");
    if (bgNd) color = bgNd.color;

    // 重新 init + refresh，确保内部 roomId（给 door/ladder/点等）也同步
    roomCom.init(roomDat, color);
    roomCom.refreshDat();

    // 更新到 MapLoader（避免导出时同时存在旧 cfgId）
    const mapLoaderComp = this.mapLoader?.getComponent(MapLoader) ?? null;
    if (mapLoaderComp) {
      mapLoaderComp.renameRoomNode(oldCfgId, newCfgId, roomCom.node);
    }
  }

  //属性面板相关
  //刷新属性面板
  private refreshAttrPanel() {
    if (!this._dragDat) return;
    this._trackNd = this._dragDat.itemNode;
    const itemDat = this._dragDat.itemNode;
    const controller = itemDat.getComponent(MapDrawUnitBase);
    const type = controller.getType();

    //基础属性的同步
    const worldPos = this._dragDat.itemNode.convertToWorldSpaceAR(cc.Vec2.ZERO);
    const pos = MapTool.converWorldPosToMapPos(worldPos);
    const baseDat: attrPanelTypeBase = {
      name: this._trackNd.name,
      pos: pos,
    };
    const basePanelDat: attrPanelType = {
      type: UnitType.Default,
      dat: baseDat,
    };
    EventManager.instance.emit(MapEditorEvent.RefreshAttrPanel, basePanelDat);
    if (type == UnitType.Default) return;

    //特殊属性的同步
    let dat: any = {};
    switch (type) {
      case UnitType.Room:
        (dat as attrPanelTypeRoom).size = this._trackNd.getContentSize();
        (dat as attrPanelTypeRoom).unLockPoints = this._trackNd.getComponent(MapDrawRoom)
          ?.getUnLockPoints()
          .filter((nd) => nd && cc.isValid(nd))
          .map((nd) => nd.name);
        break;
      case UnitType.PathPoint:
        const pointCom = this._trackNd?.getComponent(MapDrawP);
        const links = pointCom?.links ?? [];
        (dat as attrPanelTypePoint).roomId =
          pointCom?.getDat()?.roomId.toString() ?? "";
        (dat as attrPanelTypePoint).links = links
          .filter((nd) => nd && cc.isValid(nd))
          .map((nd) => nd.name);
        break;
      case UnitType.Door:
        const doorCom = this._trackNd?.getComponent(MapDrawDoor);
        (dat as attrPanelTypeDoor).roomId =
          doorCom?.getDat()?.roomId.toString() ?? "";
        (dat as attrPanelTypeDoor).hp = doorCom?.getDat().hp ?? 0;
        break;
      case UnitType.Ladder:
        const ladderCom = this._trackNd?.getComponent(MapDrawLadder);
        (dat as attrPanelTypeLadder).roomId =
          ladderCom?.getDat()?.roomId.toString() ?? "";
        (dat as attrPanelTypeLadder).bindPointIds =
          ladderCom?.getDat().bindPointIds ?? [];
        break;
      case UnitType.EnemyRefresh:
        break;
      case UnitType.SearchPoint:
        break;
      case UnitType.Portal:
        const portalCom = this._trackNd?.getComponent(MapDrawPortal);
        (dat as attrPanelTypePortal).linkId = portalCom?.getDat()?.linkId ?? "";
        (dat as attrPanelTypePortal).offsetX =
          portalCom?.getDat()?.offsetX ?? 0;
        break;
    }
    const panelDat: attrPanelType = {
      type: type,
      dat: dat,
    };
    EventManager.instance.emit(MapEditorEvent.RefreshAttrPanel, panelDat);
  }

  //属性面板刷新节点
  private refreshNdAttr(attrDat: attrPanelType) {
    if (!this._trackNd) return;
    const type = attrDat.type;
    let dat;
    switch (type) {
      case UnitType.Default:
        dat = attrDat.dat as attrPanelTypeBase;
        const worldPos = MapTool.converMapPosToWorldPos(dat.pos);
        const localPos = this._trackNd.parent.convertToNodeSpaceAR(worldPos);
        this._trackNd.setPosition(localPos);
        break;
      case UnitType.Room:
        dat = attrDat.dat as attrPanelTypeRoom;
        const size = dat.size;
        this._trackNd.getComponent(MapDrawRoom).setSize(size);
        const mapLoaderComp = this.mapLoader?.getComponent(MapLoader) ?? null;
        const unlockNodes = mapLoaderComp?.resolvePathPointNodes(dat.unLockPoints || []) ?? [];
        this._trackNd.getComponent(MapDrawRoom).setUnLockPoints(unlockNodes);
        if (mapLoaderComp) {
          mapLoaderComp.refreshLayerBoundsByNode(this._trackNd.parent);
        }
        break;
      case UnitType.PathPoint:
        dat = attrDat.dat as attrPanelTypePoint;
        const links = dat.links;
        const controller = this._trackNd.getComponent(MapDrawP);
        if (controller) {
          const mapLoaderComp = this.mapLoader?.getComponent(MapLoader) ?? null;
          const linkNodes =
            mapLoaderComp?.resolvePathPointNodes(links || []) ?? [];
          controller.setLinks(linkNodes);
        }
        break;
      case UnitType.Door:
        dat = attrDat.dat as attrPanelTypeDoor;
        const doorCom = this._trackNd.getComponent(MapDrawDoor);
        if (doorCom) {
          doorCom.setHp(dat.hp);
        }
        break;
      case UnitType.Ladder:
        //操作在l 梯子绑定模式中
        break;
      case UnitType.EnemyRefresh:
      case UnitType.SearchPoint:
      case UnitType.Portal:
        dat = attrDat.dat as attrPanelTypePortal;
        const portalCom = this._trackNd.getComponent(MapDrawPortal);
        if (portalCom) {
          portalCom.setLinkId(dat.linkId);
          portalCom.setOffsetX(dat.offsetX);
        }
        break;
    }

    //如果有房间信息，更新一手
    if (dat.roomId) {
      const nextRoomId = Number(dat.roomId);
      if (isFinite(nextRoomId)) {
        const mapLoaderComp = this.mapLoader?.getComponent(MapLoader) ?? null;
        mapLoaderComp?.movePathPointToRoom(this._trackNd, nextRoomId);
      }
    }
  }

  //删除节点
  public deleteNd() {
    if (!this._trackNd || !cc.isValid(this._trackNd)) return;
    const type = this._trackNd.getComponent(MapDrawUnitBase).getType();
    const mapLoaderComp = this.mapLoader?.getComponent(MapLoader) ?? null;
    switch (type) {
      case UnitType.Room:
        mapLoaderComp?.deleteRoom(this._trackNd);
        break;
      case UnitType.PathPoint:
        mapLoaderComp?.deletePathPoint(this._trackNd);
        break;
      case UnitType.Door:
      case UnitType.Ladder:
      case UnitType.EnemyRefresh:
      case UnitType.SearchPoint:
        {
          // 房间内单位：直接删节点，然后刷新所属房间与 layer bounds
          const ownerRoom = this.findOwnerRoomByNode(this._trackNd.parent);
          const ownerLayer = ownerRoom?.node?.parent ?? null;
          this._trackNd.removeFromParent();
          this._trackNd.destroy();
          ownerRoom?.refreshDat();
          if (ownerLayer && mapLoaderComp) {
            mapLoaderComp.refreshLayerBoundsByNode(ownerLayer);
          }
          // 如果删的是梯子，可能影响绑定点联动/显示，重排一次点名确保一致
          mapLoaderComp?.rebuildPointIdsByLayer?.();
        }
        break;
      case UnitType.Portal:
        mapLoaderComp?.deletePortal(this._trackNd);
        break;
    }
    this._trackNd = null;
    EventManager.instance.emit(MapEditorEvent.ClearEditPanel);
  }

  //保存
  public onClickSave() {
    const json = this.mapLoader.getComponent(MapLoader).saveDat();
    this.levelJson.json = JSON.parse(json);
    this.persistLevelJsonToDisk(json);
  }

  //导出
  public onCLickExport() {
    //先保存并同步到当前 levelJson
    const json = this.mapLoader.getComponent(MapLoader).saveDat();
    this.levelJson.json = JSON.parse(json);
    this.persistLevelJsonToDisk(json);
    this.downloadJson();
  }

  public downloadJson(filename = "mapData.json") {
    const json = JSON.stringify(this.levelJson?.json ?? {});

    // 1️⃣ 创建 Blob
    const blob = new Blob([json], { type: "application/json" });

    // 2️⃣ 创建临时 URL
    const url = URL.createObjectURL(blob);

    // 3️⃣ 创建 a 标签并点击下载
    const a = document.createElement("a");
    a.href = url;
    a.download = filename; // 文件名
    a.click();

    // 4️⃣ 释放 URL
    URL.revokeObjectURL(url);
  }

  /** 把当前 levelJson 覆盖写回 assets 下对应 json 文件 */
  private persistLevelJsonToDisk(json: string) {
    if (!CC_EDITOR) return;
    if (!this.levelJson) return;
    try {
      const fs = require("fs");
      const path = require("path");
      const assetAny = this.levelJson as any;
      const uuid = assetAny?._uuid;
      if (!uuid) return;
      const filePath = (Editor as any)?.assetdb?.uuidToFspath(uuid);
      if (!filePath) return;
      const normalizedPath = path.normalize(filePath);
      fs.writeFileSync(normalizedPath, json, "utf8");
      console.log("Level JSON 已保存：", normalizedPath);
      (Editor as any)?.assetdb?.refresh("db://assets");
    } catch (err) {
      console.error("Level JSON 保存失败:", err);
    }
  }

  public onClickClear() {
    this.mapLoader.getComponent(MapLoader).clear();
  }

  //设置相关
  private setMapScale(scale: number) {
    EditorSetting.Instance.setMapScale(scale);
    const realScale = EditorSetting.Instance.getMapScale();
    this.editorRoot.scale = realScale;
  }

  private clearHoverDat() {
    this._hoverDat.name = "";
  }
}

declare var require: any;
declare var Editor: any;
