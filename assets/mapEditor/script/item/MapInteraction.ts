import MapDrawRoom from "./MapDrawRoom";
import MapDrawLadder from "./MapDrawLadder";
import MapDrawP from "./MapDrawP";
import MapDrawUnitBase from "./MapDrawUnitBase";
import EditorSetting from "../editor/EditorSetting";
import MapLoader from "./MapLoader";
import { DragType, HoverType } from "../type/types";
import { UnitType } from "../type/mapTypes";

/**
 * 地图交互辅助类
 * 负责：碰撞检测、坐标转换、拖拽相关计算
 */
export default class MapInteraction {
  private _mapLoader: cc.Node = null;
  private _mapLoaderComp: MapLoader = null;

  public init(mapLoader: cc.Node) {
    this._mapLoader = mapLoader;
    this._mapLoaderComp = mapLoader.getComponent(MapLoader);
  }

  /** 获取 MapLoader 组件（供外部调用） */
  public getMapLoaderComp(): MapLoader {
    return this._mapLoaderComp;
  }

  // ==================== 坐标转换 ====================

  /** 获取节点左下角世界坐标 */
  public getNodeLeftBottomWorld(node: cc.Node): cc.Vec2 {
    const size = node.getContentSize();
    const offset = cc.v2(
      -node.anchorX * size.width,
      -node.anchorY * size.height
    );
    return node.convertToWorldSpaceAR(offset);
  }

  /** 构建悬停框信息（与 MapDrawUnitBase 的命中盒一致） */
  public buildHoverBoxForNode(hoverNd: cc.Node): HoverType | null {
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

  // ==================== 碰撞检测 ====================

  /** 根据世界坐标命中 Layer 容器（后遍历优先选上层叠放） */
  public findLayerAtWorldPos(rect: cc.Rect): cc.Node | null {
    const layerCont = this._mapLoader.getChildByName("LayerCont");
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
      const interRect = this.getIntersection(rect, boxRect);
      if (!interRect) continue;
      const area = interRect.width * interRect.height;
      if (area > maxArea) {
        maxArea = area;
        bestLayer = layerNd;
      }
    }
    return bestLayer;
  }

  /** 根据世界坐标命中房间（后遍历优先选上层叠放） */
  public findRoomAtWorldPos(rect: cc.Rect): MapDrawRoom | null {
    const roomList = this._mapLoader.getComponentsInChildren(MapDrawRoom);
    let bestRoom: MapDrawRoom;
    let maxArea = 0;
    for (const room of roomList) {
      const box = room.getHoverBoxSize();
      const worldPos = room.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
      const boxRect = new cc.Rect(worldPos.x, worldPos.y, box.width, box.height);
      const interRect = this.getIntersection(rect, boxRect);
      if (!interRect) continue;
      const area = interRect.width * interRect.height;
      if (area > maxArea) {
        maxArea = area;
        bestRoom = room;
      }
    }
    return bestRoom;
  }

  /** 计算两个矩形的交集 */
  private getIntersection(a: cc.Rect, b: cc.Rect): cc.Rect | null {
    const xMin = Math.max(a.xMin, b.xMin);
    const yMin = Math.max(a.yMin, b.yMin);
    const xMax = Math.min(a.xMax, b.xMax);
    const yMax = Math.min(a.yMax, b.yMax);
    if (xMax >= xMin && yMax >= yMin) {
      return new cc.Rect(xMin, yMin, xMax - xMin, yMax - yMin);
    }
    return null;
  }

  // ==================== 拖拽 Hover 逻辑 ====================

  /** 更新拖拽时房间/Layer 的高亮信息 */
  public updateDragRoomHover(
    dragDat: DragType,
    hoverDat: HoverType,
    hoverDrawer: any
  ): { hoverRoomName: string; hoverLayerName: string } {
    if (!dragDat) {
      return { hoverRoomName: "", hoverLayerName: "" };
    }

    const result = { hoverRoomName: "", hoverLayerName: "" };

    // 如果当前拖拽的是"房间"，则根据鼠标命中的 layer 容器高亮整个 layer
    const draggedRoom = dragDat.itemNode.getComponent(MapDrawRoom);
    if (draggedRoom) {
      dragDat.hoverRoomId = draggedRoom.getRoomCfgId();
      dragDat.hoverRoomName = draggedRoom.node.name;

      const box = draggedRoom.getHoverBoxSize();
      const worldPos = this.getNodeLeftBottomWorld(draggedRoom.node);
      const rect = new cc.Rect(worldPos.x, worldPos.y, box.width, box.height);
      const layerNd = this.findLayerAtWorldPos(rect);

      if (!layerNd) {
        dragDat.hoverLayerNode = undefined;
        dragDat.hoverLayerName = undefined;
        return result;
      }

      dragDat.hoverLayerNode = layerNd;
      dragDat.hoverLayerName = layerNd.name;
      result.hoverRoomName = layerNd.name;

      // 绘制 hover 框
      const mapScale = EditorSetting.Instance.getMapScale();
      const size = layerNd.getContentSize();
      const offset = cc.v2(
        layerNd.anchorX * size.width * mapScale,
        layerNd.anchorY * size.height * mapScale,
      );
      hoverDat.name = layerNd.name;
      hoverDat.worldPos = layerNd
        .convertToWorldSpaceAR(cc.Vec2.ZERO)
        .clone()
        .subtract(offset);
      hoverDat.width = size.width * mapScale;
      hoverDat.height = size.height * mapScale;
      hoverDrawer?.draw(hoverDat);
      return result;
    }

    // 非房间拖拽：按房间命中判断 hover 框
    dragDat.hoverLayerNode = undefined;
    dragDat.hoverLayerName = undefined;

    const base = dragDat.itemNode.getComponent(MapDrawUnitBase);
    if (!base) return result;

    const box = base.getHoverBoxSize();
    const worldPos = this.getNodeLeftBottomWorld(base.node);
    const rect = new cc.Rect(worldPos.x, worldPos.y, box.width, box.height);
    const room = this.findRoomAtWorldPos(rect);

    if (!room) return result;

    const roomNd = room.node;
    result.hoverRoomName = roomNd.name;
    dragDat.hoverRoomId = room.getRoomCfgId();
    dragDat.hoverRoomName = roomNd.name;

    const mapScale = EditorSetting.Instance.getMapScale();
    const size = roomNd.getContentSize();
    const offset = cc.v2(
      roomNd.anchorX * size.width * mapScale,
      roomNd.anchorY * size.height * mapScale,
    );
    hoverDat.name = roomNd.name;
    hoverDat.worldPos = roomNd
      .convertToWorldSpaceAR(cc.Vec2.ZERO)
      .clone()
      .subtract(offset);
    hoverDat.width = size.width * mapScale;
    hoverDat.height = size.height * mapScale;
    hoverDrawer?.draw(hoverDat);
    return result;
  }

  /** 清除拖拽高亮 */
  public clearDragHover(
    dragDat: DragType,
    hoverDat: HoverType,
    hoverDrawer: any
  ): string {
    if (dragDat) {
      dragDat.hoverRoomId = undefined;
      dragDat.hoverRoomName = undefined;
      dragDat.hoverLayerNode = undefined;
      dragDat.hoverLayerName = undefined;
    }
    hoverDat.name = "";
    hoverDrawer?.clear();
    return "";
  }

  // ==================== 梯子同步 ====================

  /** 设置节点世界坐标（保持世界位置不变） */
  private setNodeWorldPos(node: cc.Node, worldPos: cc.Vec2) {
    if (!node || !node.parent) return;
    node.setPosition(node.parent.convertToNodeSpaceAR(worldPos));
  }

  /** 根据梯子位置反推两个绑定点位置 */
  public syncBindPointsByLadder(ladderCom: MapDrawLadder) {
    if (!ladderCom || !cc.isValid(ladderCom.node)) return;
    const binds = ladderCom.bindPoints || [];
    if (binds.length < 2) return;
    const p0 = binds[0];
    const p1 = binds[1];
    if (!p0 || !p1 || !cc.isValid(p0) || !cc.isValid(p1)) return;

    const h = ladderCom.node.getContentSize().height;
    const anchorY = ladderCom.node.anchorY ?? 0;
    const bottomLocalY = -anchorY * h;
    const topLocalY = (1 - anchorY) * h;
    const w0 = ladderCom.node.convertToWorldSpaceAR(cc.v2(0, bottomLocalY));
    const w1 = ladderCom.node.convertToWorldSpaceAR(cc.v2(0, topLocalY));

    this.setNodeWorldPos(p0, w0);
    this.setNodeWorldPos(p1, w1);
    this._mapLoaderComp?.movePathPointToRoomByWorldPos(p0, w0, false);
    this._mapLoaderComp?.movePathPointToRoomByWorldPos(p1, w1, false);
    this._mapLoaderComp?.rebuildPointIdsByLayer();
  }

  /** 根据两个绑定点反推梯子位置和高度 */
  public syncLadderToBindPoints(ladderCom: MapDrawLadder) {
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
    const heightLocal = Math.max(1, heightWorld / Math.max(0.0001, mapScale));
    const anchorY = ladderCom.node.anchorY ?? 0;
    const anchorWorld = cc.v2(w0.x, w0.y + anchorY * heightWorld);

    this.setNodeWorldPos(ladderCom.node, anchorWorld);
    const curSize = ladderCom.node.getContentSize();
    ladderCom.node.setContentSize(curSize.width, heightLocal);
  }

  /** 拖拽时联动梯子和绑定点 */
  public syncLadderWithDraggedNode(draggedNode: cc.Node, isShiftDown: boolean) {
    if (!draggedNode || !cc.isValid(draggedNode)) return;

    const draggedLadder = draggedNode.getComponent(MapDrawLadder);
    if (draggedLadder) {
      this.syncBindPointsByLadder(draggedLadder);
      if (isShiftDown) {
        const binds = draggedLadder.bindPoints || [];
        if (binds[0]) this.trySnapDraggedPointY(binds[0]);
        if (binds[1]) this.trySnapDraggedPointY(binds[1]);
        this.syncLadderToBindPoints(draggedLadder);
      }
      return;
    }

    const draggedPoint = draggedNode.getComponent(MapDrawP);
    if (!draggedPoint || !this._mapLoader) return;

    const ladders = this._mapLoader.getComponentsInChildren(MapDrawLadder);
    ladders.forEach((ladderCom) => {
      const binds = ladderCom.bindPoints || [];
      if (binds.indexOf(draggedNode) >= 0) {
        this.syncLadderToBindPoints(ladderCom);
      }
    });
  }

  // ==================== Shift 吸附 ====================

  /** Shift 拖拽路径点：吸附同层左邻点 y */
  public trySnapDraggedPointY(draggedNode: cc.Node) {
    if (!draggedNode || !cc.isValid(draggedNode)) return;
    const draggedPointCom = draggedNode.getComponent(MapDrawP);
    if (!draggedPointCom) return;

    const layerNd = this.findLayerByRoomCfgId(draggedPointCom.getRoomId());
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

  /** 根据节点找到所属 Layer */
  public findLayerByNode(node: cc.Node): cc.Node | null {
    let cur = node;
    while (cur) {
      if (/^Layer\d+$/.test(cur.name || "")) return cur;
      cur = cur.parent;
    }
    return null;
  }

  /** 根据 roomId 找到所属 Layer */
  public findLayerByRoomCfgId(roomId: number): cc.Node | null {
    if (!isFinite(roomId) || !this._mapLoader) return null;
    const rooms = this._mapLoader.getComponentsInChildren(MapDrawRoom);
    const room = rooms.find((r) => r && r.getRoomId() === roomId);
    if (!room || !room.node) return null;
    return this.findLayerByNode(room.node);
  }

  // ==================== 路径连线数据 ====================

  /** 获取房间关联的路径线段（世界坐标） */
  public getPathLinkWorldSegmentsForRoom(roomCfgId: number): Array<{ p0: cc.Vec2; p1: cc.Vec2 }> {
    return this._mapLoaderComp?.getPathLinkWorldSegmentsForRoomOwner(roomCfgId) ?? [];
  }

  /** 获取路径点关联的线段（世界坐标） */
  public getPathLinkWorldSegmentsFromPoint(pointNode: cc.Node): Array<{ p0: cc.Vec2; p1: cc.Vec2 }> {
    return this._mapLoaderComp?.getPathLinkWorldSegmentsFromPoint(pointNode) ?? [];
  }

  // ==================== 拖拽落点计算 ====================

  /** 判断目标类型是否是房间外物品 */
  public isOutRoomUnitType(type: UnitType): boolean {
    return [UnitType.Portal, UnitType.Cable, UnitType.Stone].includes(type);
  }

  /** 获取拖拽落点的目标父节点 */
  public getDropTargetParent(
    dragDat: DragType,
    itemParent: cc.Node
  ): cc.Node | null {
    if (!dragDat) return null;

    const itemDat = dragDat.itemNode;
    const type = itemDat.getComponent(MapDrawUnitBase)?.getType();

    // 房间
    if (type === UnitType.Room) {
      if (dragDat.hoverLayerNode && cc.isValid(dragDat.hoverLayerNode)) {
        return dragDat.hoverLayerNode;
      } else {
        const roomWorldPos = itemDat.convertToWorldSpaceAR(cc.Vec2.ZERO);
        return this._mapLoaderComp?.createLayerForRoomDrop(roomWorldPos.y) ?? null;
      }
    }

    // 房间外物品
    if (this.isOutRoomUnitType(type)) {
      return this._mapLoaderComp?.getOutRoomUnitParent() ?? null;
    }

    // 出生点/出口点
    if (itemDat.name === "playerExit" || itemDat.name === "playerCreate") {
      return itemParent;
    }

    // 房间内物品
    return null;
  }
}
