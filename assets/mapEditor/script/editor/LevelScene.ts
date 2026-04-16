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
  attrPanelTypeCable,
  attrPanelTypeDoor,
  attrPanelTypeLadder,
  attrPanelTypePoint,
  attrPanelTypePortal,
  attrPanelTypeRoom,
  DragType,
  HoverType,
  ModeType,
} from "../type/types";
import EditorSetting from "./EditorSetting";
import HoverDrawer from "./HoverDrawer";
import MapLoader from "../item/MapLoader";
import { MapDrawDatRoom } from "../item/MapDrawDat";
import MapDrawDoor from "../item/MapDrawDoor";
import MapDrawLadder from "../item/MapDrawLadder";
import MapDrawPortal from "../item/MapDrawPortal";
import PathPointLinkMode from "./modes/PathPointLinkMode";
import LadderBindMode from "./modes/LadderBindMode";
import PortalBindMode from "./modes/PortalBindMode";
import RoomUnlockBindMode from "./modes/RoomUnlockBindMode";
import ModeBase from "./modes/ModeBase";
import PortalAnimBindMode from "./modes/PortalAnimBindMode";
import MapDrawCable from "../item/MapDrawCable";
import SelectPointMode from "./modes/SelectPointMode";
import ModeMgr from "./modes/ModeMgr";

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

  @property(cc.Label)
  curModeLb: cc.Label;

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
  //拖拽时命中的房间（用于高亮）
  private _dragHoverRoomName: string = "";
  //属性面板追踪的节点(注意删除节点时的问题)
  private _trackNd: cc.Node;
  //房间外物品类型
  private outRoomUnitType = [UnitType.Portal, UnitType.Cable, UnitType.Stone];

  private _modeMgr: ModeMgr;


  /**
   * 是否允许地图交互：
   * - 鼠标在 mapGraph 或 itemPanelNd 的 world rect 内可交互
   */
  private isWorldPosInEditorArea(worldPos: cc.Vec2): boolean {
    const validNodes = [this.mapGraph, this.itemPanelNd];
    for (const node of validNodes) {
      if (MapTool.isWorldPosInNodeRect(worldPos, node)) return true;
    }
    return false;
  }

  protected onLoad(): void {
    this._modeMgr = new ModeMgr();
    this._modeMgr.init();
    this.node.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this, true);
    this.node.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
    this.node.on(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
    EventManager.instance.on(MapEditorEvent.DragItem, this.startDrag, this);
    EventManager.instance.on(
      MapEditorEvent.UpdateFromAttrPanel,
      this.refreshNdAttr,
      this,
    );
    EventManager.instance.on(
      MapEditorEvent.UpdateAreaInfoFormPanel,
      this.refreshAreaInfo,
      this
    )
    EventManager.instance.on(
      MapEditorEvent.UpdateCurModeDisplay,
      this.updateCurModeDisplay,
      this
    )
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    MapTool.init(this.mapLoader, this._modeMgr, this.mapSize);
    this.createLevel();
  }

  protected start(): void {
    this.mapLoader.getComponent(MapLoader).build(this.levelJson, this.mapSize);
  }

  protected onDestroy(): void {
    this._modeMgr.clear();
    EventManager.instance.off(MapEditorEvent.DragItem, this.startDrag, this);
    EventManager.instance.off(
      MapEditorEvent.UpdateFromAttrPanel,
      this.refreshNdAttr,
      this,
    );
    EventManager.instance.off(
      MapEditorEvent.UpdateAreaInfoFormPanel,
      this.refreshAreaInfo,
      this
    );
    EventManager.instance.off(
      MapEditorEvent.UpdateCurModeDisplay,
      this.updateCurModeDisplay,
      this
    )
    cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
  }

  private async createLevel() {
    const graphSize = this.mapGraph.getContentSize();
    const scaleX = graphSize.width / this.mapSize.x;
    const scaleY = graphSize.height / this.mapSize.y;
    EditorSetting.Instance.setMinScale(Math.max(scaleX, scaleY));
  }

  private updateCurModeDisplay(modeType: ModeType) {
    if (!modeType) {
      this.curModeLb.string = "无模式";
      return;
    }
    this.curModeLb.string = modeType;
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
  //清除hover框
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
  private updateDragRoomHover() {
    if (!this._dragDat) return;
    // 如果当前拖拽的是“房间”，则根据鼠标命中的 layer 容器高亮整个 layer
    const draggedRoom = this._dragDat.itemNode.getComponent(MapDrawRoom);
    if (draggedRoom) {
      // 没有命中其它房间时，也需要让 dragDat 里有当前拖拽房间的信息
      this._dragDat.hoverRoomId = draggedRoom.getId();
      this._dragDat.hoverRoomName = draggedRoom.node.name;

      const box = draggedRoom.getHoverBoxSize();
      const worldPos = draggedRoom.node.convertToWorldSpaceAR(MapTool.getLeftBottom(draggedRoom.node));
      const rect = new cc.Rect(worldPos.x, worldPos.y, box.width, box.height);
      const layerNd = this.findLayerAtWorldPos(rect);
      if (!layerNd) {
        // 只清空 hover 框，不清空 hoverRoomId/hoverRoomName
        this._dragDat.hoverLayerNode = undefined;
        this._dragDat.hoverLayerName = undefined;
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

    const base = this._dragDat.itemNode.getComponent(MapDrawUnitBase);
    const box = base.getHoverBoxSize();
    const worldPos = base.node.convertToWorldSpaceAR(MapTool.getLeftBottom(base.node));
    const rect = new cc.Rect(worldPos.x, worldPos.y, box.width, box.height);
    const room = this.findRoomAtWorldPos(rect);
    if (!room) {
      this.clearDragRoomHover();
      return;
    }

    const roomNd = room.node;
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
    //拖拽过程中：判断鼠标是否覆盖到某个房间或者Layer上
    this.updateDragRoomHover();
    //刷新属性面板
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
      this.updateDragRoomHover();
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
          this.trySnapDraggedPointY(itemDat);
          this.syncLadderWithDraggedNode(itemDat);
          //拖拽过程中：判断鼠标是否覆盖到某个房间或者Layer上
          this.updateDragRoomHover();
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
          const oldOwnerRoom = MapTool.findOwnerRoomByNode(itemParent);
          let targetParent = null;
          const type = itemDat.getComponent(MapDrawUnitBase).getType();
          //房间
          if (type == UnitType.Room) {
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
          //房间外物品
          else if (this.outRoomUnitType.findIndex(t => t == type) != -1) {
            targetParent = this.mapLoader
              .getComponent(MapLoader)
              .getOutRoomUnitParent();
          }
          //房间内物品 
          else {
            const hoverRoom = MapTool.findHoverRoomForDrag(this._dragDat.hoverRoomId, this._dragDat.hoverRoomName);
            if (hoverRoom && cc.isValid(hoverRoom.node)) {
              const nonRoomParent = MapTool.getNonRoomDropParent(
                itemDat,
                hoverRoom,
              );
              if (nonRoomParent && cc.isValid(nonRoomParent)) {
                targetParent = nonRoomParent;
              }
            }
          }

          //没有父节点，清除
          if (!targetParent) {
            this._dragDat.itemNode.destroy();
            this._dragDat = null;
            this.clearDragRoomHover();
            return;
          }

          //算位置
          //切换父节点
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
          // 抬起瞬间再执行一次 Shift 吸附
          this.trySnapDraggedPointY(itemDat);
          //梯子，重新算一次位置
          if (type == UnitType.Ladder) {
            this.syncLadderToBindPoints(itemDat.getComponent(MapDrawLadder));
          }
          //没有实际拖拽，只是点击了拖拽节点，清除本次dragDat
          if (!this._isDrag) {
            this._dragDat = null;
            return;
          }
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
            const mapLoaderComp = this.mapLoader?.getComponent(MapLoader) ?? null;
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
            const newOwnerRoom = MapTool.findOwnerRoomByNode(targetParent);
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
    if (this.isShiftKey(event.keyCode)) {
      this._isShiftDown = true;
      return;
    }
    //退出按钮
    if (event.keyCode === cc.macro.KEY.escape) {
      this._modeMgr.clear();
    }
    //p键，进入连线模式
    else if (event.keyCode === cc.macro.KEY.p) {
      this._modeMgr.enterMode(ModeType.PathPointLink);
    }
    //l键，进入梯子绑定模式
    else if (event.keyCode === cc.macro.KEY.l) {
      this._modeMgr.enterMode(ModeType.LadderBind, this._trackNd);
    }
    //o键，进入传送门绑定模式
    else if (event.keyCode === cc.macro.KEY.o) {
      this._modeMgr.enterMode(ModeType.PortalBind);
    }
    //i键，进入传送门动画点绑定模式
    else if (event.keyCode === cc.macro.KEY.i) {
      this._modeMgr.enterMode(ModeType.PortalAnimBind);
    }
    //r键，进入房间解锁点绑定模式
    else if (event.keyCode === cc.macro.KEY.r) {
      this._modeMgr.enterMode(ModeType.RoomUnlockBind);
    }
  }

  private onKeyUp(event: cc.Event.EventKeyboard) {
    if (this.isShiftKey(event.keyCode)) {
      this._isShiftDown = false;
    }
  }

  private isShiftKey(keyCode: number): boolean {
    return (
      keyCode === cc.macro.KEY.shift ||
      keyCode === (cc.macro.KEY as any).left_shift ||
      keyCode === (cc.macro.KEY as any).right_shift ||
      keyCode === 16
    );
  }

  //模式：
  public setMode(mode: ModeBase) {
    const enable = mode.isEnabled();
    mode?.setEnabled(!enable);
  }

  private setNodeWorldPos(node: cc.Node, worldPos: cc.Vec2) {
    if (!node || !node.parent) return;
    node.setPosition(node.parent.convertToNodeSpaceAR(worldPos));
  }

  /** Shift 拖拽路径点：吸附同层左邻点 y；没有左邻则右邻；都没有则不吸附 */
  private trySnapDraggedPointY(draggedNode: cc.Node) {
    if (!this._isShiftDown) return;
    if (!draggedNode || !cc.isValid(draggedNode)) return;
    const draggedPointCom = draggedNode.getComponent(MapDrawP);
    if (!draggedPointCom) return;
    const layerNd = this.findLayerByRoomId(draggedPointCom.getRoomId());
    if (!layerNd) return;

    const pointNodes = layerNd
      .getComponentsInChildren(MapDrawP)
      .map((p) => p.node)
      .filter((nd) => !!nd && cc.isValid(nd))
      .sort(
        (a, b) =>
          a.convertToWorldSpaceAR(cc.Vec2.ZERO).x -
          b.convertToWorldSpaceAR(cc.Vec2.ZERO).x,
      );
    const draggedName = draggedNode.name || "";
    const m = /^P(\d+)_(\d+)$/.exec(draggedName);
    if (!m) return;
    const draggedNo = Number(m[2]);
    if (!isFinite(draggedNo)) return;

    let leftNd: cc.Node = null;
    let rightNd: cc.Node = null;
    let leftNo = Number.NEGATIVE_INFINITY;
    let rightNo = Number.POSITIVE_INFINITY;
    pointNodes.forEach((nd) => {
      const name = nd?.name || "";
      const mm = /^P(\d+)_(\d+)$/.exec(name);
      if (!mm) return;
      const no = Number(mm[2]);
      if (!isFinite(no)) return;
      if (no < draggedNo && no > leftNo) {
        leftNo = no;
        leftNd = nd;
      }
      if (no > draggedNo && no < rightNo) {
        rightNo = no;
        rightNd = nd;
      }
    });
    const refNd = leftNd || rightNd;
    if (!refNd) return;

    const curWorld = draggedNode.convertToWorldSpaceAR(cc.Vec2.ZERO);
    const refWorld = refNd.convertToWorldSpaceAR(cc.Vec2.ZERO);
    this.setNodeWorldPos(draggedNode, cc.v2(curWorld.x, refWorld.y));
  }

  private findLayerByNode(node: cc.Node): cc.Node | null {
    let cur = node;
    while (cur) {
      if (/^Layer\d+$/.test(cur.name || "")) return cur;
      cur = cur.parent;
    }
    return null;
  }

  /** 拖拽点在 dragLayer 下时，按 point.roomId 反查所属 layer */
  private findLayerByRoomId(roomId: number): cc.Node | null {
    if (!isFinite(roomId) || !this.mapLoader) return null;
    const rooms = this.mapLoader.getComponentsInChildren(MapDrawRoom);
    const room = rooms.find((r) => r && r.getId() === roomId);
    if (!room || !room.node) return null;
    return this.findLayerByNode(room.node);
  }

  //根据梯子位置反推两个绑定点位置
  private syncBindPointsByLadder(ladderCom: MapDrawLadder) {
    if (!ladderCom || !cc.isValid(ladderCom.node)) return;
    const binds = ladderCom.bindPoints || [];
    if (binds.length < 2) return;
    const p0 = binds[0];
    const p1 = binds[1];
    if (!p0 || !p1 || !cc.isValid(p0) || !cc.isValid(p1)) return;
    const h = ladderCom.node.getContentSize().height;
    const anchorY = ladderCom.node.anchorY ?? 0;
    // 以 AR 为原点：底端/顶端在局部坐标中的 y（兼容不同 anchorY）
    const bottomLocalY = -anchorY * h;
    const topLocalY = (1 - anchorY) * h;
    const w0 = ladderCom.node.convertToWorldSpaceAR(cc.v2(0, bottomLocalY));
    const w1 = ladderCom.node.convertToWorldSpaceAR(cc.v2(0, topLocalY));
    this.setNodeWorldPos(p0, w0);
    this.setNodeWorldPos(p1, w1);
    const loader = this.mapLoader?.getComponent(MapLoader);
    loader?.movePathPointToRoomByWorldPos(p0, w0, false);
    loader?.movePathPointToRoomByWorldPos(p1, w1, false);
    loader?.rebuildPointIdsByLayer();

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
    const mapScale = EditorSetting.Instance.getMapScale();
    const heightWorld = Math.max(1, w1.y - w0.y);
    // contentSize 是本地尺寸，world 距离需要除以缩放
    const heightLocal = Math.max(1, heightWorld / Math.max(0.0001, mapScale));
    const anchorY = ladderCom.node.anchorY ?? 0;
    // 让梯子“底端”贴合 w0：需要把节点 anchor 点移动到 w0 + anchorY*heightWorld
    const anchorWorld = cc.v2(w0.x, w0.y + anchorY * heightWorld);
    this.setNodeWorldPos(ladderCom.node, anchorWorld);
    const curSize = ladderCom.node.getContentSize();
    ladderCom.node.setContentSize(curSize.width, heightLocal);
  }

  //拖拽梯子/点时联动三者
  private syncLadderWithDraggedNode(draggedNode: cc.Node) {
    if (!draggedNode || !cc.isValid(draggedNode)) return;
    const draggedLadder = draggedNode.getComponent(MapDrawLadder);
    if (draggedLadder) {
      this.syncBindPointsByLadder(draggedLadder);
      const binds = draggedLadder.bindPoints || [];
      const p0 = binds[0];
      const p1 = binds[1];
      //如果是吸附的话，先吸点再吸梯子
      if (this._isShiftDown) {
        this.trySnapDraggedPointY(p0);
        this.trySnapDraggedPointY(p1);
        this.syncLadderToBindPoints(draggedLadder);
      }
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
      case UnitType.Portal:
        const portalCom = this._trackNd?.getComponent(MapDrawPortal);
        (dat as attrPanelTypePortal).linkId = portalCom?.getDat()?.linkId ?? "";
        (dat as attrPanelTypePortal).offsetX =
          portalCom?.getDat()?.offsetX ?? 0;
        (dat as attrPanelTypePortal).animPIds =
          portalCom?.getAnimIds() ?? [];
        break;
      case UnitType.Cable:
        const controller = this._trackNd?.getComponent(MapDrawCable);
        const cableDat = controller.getDat();
        (dat as attrPanelTypeCable).startPId = cableDat.point1;
        (dat as attrPanelTypeCable).endPId = cableDat.point2;
        (dat as attrPanelTypeCable).points = cableDat.points;
        (dat as attrPanelTypeCable).speed = cableDat.speed;
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
      case UnitType.Portal:
        dat = attrDat.dat as attrPanelTypePortal;
        const portalCom = this._trackNd.getComponent(MapDrawPortal);
        if (portalCom) {
          portalCom.setLinkId(dat.linkId);
          portalCom.setOffsetX(dat.offsetX);
          portalCom.setAnimIds(dat.animPIds);
        }
        break;
      case UnitType.Cable:
        dat = attrDat.dat as attrPanelTypeCable;
        const cableCom = this._trackNd.getComponent(MapDrawCable);
        if (cableCom) {
          cableCom.setSpeed(dat.speed);
        }
        break;
    }

    //如果有房间信息，更新一手
    if (dat.roomId) {
      const nextRoomId = Number(dat.roomId);
      if (isFinite(nextRoomId)) {
        const mapLoaderComp = this.mapLoader?.getComponent(MapLoader) ?? null;
        mapLoaderComp?.moveUnitToRoom(this._trackNd, nextRoomId);
      }
    }
  }

  private refreshAreaInfo(areaInfo: number[]) {
    this.mapLoader.getComponent(MapLoader).setAreaInfo(areaInfo);
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
          const ownerRoom = MapTool.findOwnerRoomByNode(this._trackNd.parent);
          const ownerLayer = ownerRoom?.node?.parent ?? null;
          this._trackNd.removeFromParent();
          this._trackNd.destroy();
          //删除完要过一帧
          this.scheduleOnce(() => {
            ownerRoom?.refreshDat();
            if (ownerLayer && mapLoaderComp) {
              mapLoaderComp.refreshLayerBoundsByNode(ownerLayer);
            }
          })
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

  //清除
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

  //工具类方法
  /** 根据世界坐标命中 layer 容器（用于拖拽房间时，鼠标不在任意房间上也能高亮整个 layer） */
  private findLayerAtWorldPos(rect: cc.Rect): cc.Node | null {
    const layerCont = this.mapLoader.getChildByName("LayerCont");
    if (!layerCont) return null;
    let bestLayer: cc.Node | null = null;
    let maxArea = 0;
    for (const layerNd of layerCont.children) {
      if (!layerNd || !/^Layer\d+$/.test(layerNd.name)) continue;
      const mapScale = EditorSetting.Instance.getMapScale();
      const size = layerNd.getContentSize();
      const offset = cc.v2(
        layerNd.anchorX * size.width * mapScale,
        layerNd.anchorY * size.height * mapScale,
      );
      const worldPos = layerNd
        .convertToWorldSpaceAR(cc.Vec2.ZERO)
        .clone()
        .subtract(offset);
      const width = size.width * mapScale;
      const height = size.height * mapScale;
      const boxRect = new cc.Rect(worldPos.x, worldPos.y, width, height);
      // 计算相交矩形
      const interRect = MapTool._getIntersection(rect, boxRect);
      if (!interRect) continue;
      const area = interRect.width * interRect.height;
      if (area > maxArea) {
        maxArea = area;
        bestLayer = layerNd;
      }
    }
    return bestLayer;
  }


  /** 根据世界坐标命中房间（后遍历优先，尽量选上层叠放时更“靠上”的房间） */
  private findRoomAtWorldPos(rect: cc.Rect): MapDrawRoom | null {
    const roomList = this.mapLoader.getComponentsInChildren(MapDrawRoom);
    let bestRoom: MapDrawRoom;
    let maxArea = 0;
    for (const room of roomList) {
      const box = room.getHoverBoxSize();
      const worldPos = room.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
      const boxRect = new cc.Rect(worldPos.x, worldPos.y, box.width, box.height);
      // 计算相交矩形
      const interRect = MapTool._getIntersection(rect, boxRect);
      if (!interRect) continue;
      const area = interRect.width * interRect.height;
      if (area > maxArea) {
        maxArea = area;
        bestRoom = room;
      }
    }
    return bestRoom;
  }
}

declare var require: any;
declare var Editor: any;
