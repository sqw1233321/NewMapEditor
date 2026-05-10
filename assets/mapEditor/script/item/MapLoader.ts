import EditorSetting from "../editor/EditorSetting";
import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import MapDrawLadder from "./MapDrawLadder";
import MapDrawP from "./MapDrawP";
import MapDrawPortal from "./MapDrawPortal";
import MapDrawRoom from "./MapDrawRoom";
import MapDrawUnitBase from "./MapDrawUnitBase";
import MapTool from "../tool/MapTool";
import { UnitType } from "../type/mapTypes";
import MapSerializer from "./MapSerializer";
import MapLineDrawer from "./MapLineDrawer";
import MapBuilder from "./MapBuilder";
import { MapDrawDatRoom } from "./MapDrawDat";

const { ccclass, property } = cc._decorator;

/**
 * 地图数据加载器
 * 核心职责：
 * - 节点映射管理（room/point/layer）
 * - Layer CRUD
 * - 节点查询
 * - 删除操作
 */
@ccclass
export default class MapLoader extends cc.Component {
  // ==================== Prefab 属性 ====================
  @property(cc.SpriteFrame)
  defaultSp: cc.SpriteFrame = null;

  @property(cc.Prefab)
  roomPrefab: cc.Prefab = null;

  @property(cc.Prefab)
  pathPointPrefab: cc.Prefab = null;

  @property(cc.Prefab)
  ladderPrefab: cc.Prefab = null;

  @property(cc.Prefab)
  doorPrefab: cc.Prefab = null;

  @property(cc.Prefab)
  searchItemPrefab: cc.Prefab = null;

  @property(cc.Prefab)
  enemyRefreshPrefab: cc.Prefab = null;

  @property(cc.Prefab)
  survivePrefab: cc.Prefab = null;

  @property(cc.Prefab)
  fightSoulPrefab: cc.Prefab = null;

  @property(cc.Prefab)
  defaultPortalPrefab: cc.Prefab = null;

  @property(cc.Prefab)
  portalPrefab: cc.Prefab = null;

  @property(cc.Prefab)
  shipPrefab: cc.Prefab = null;

  @property(cc.Prefab)
  cablePrefab: cc.Prefab = null;

  @property(cc.Prefab)
  stonePrefab: cc.Prefab = null;

  // ==================== 容器节点 ====================
  private _layerCont: cc.Node = null;
  private _outRoomUnitCont: cc.Node = null;
  private _playerCreateNd: cc.Node = null;
  private _playerExitNd: cc.Node = null;
  private _pointLineCont: cc.Node = null;

  // ==================== 节点映射 ====================
  private _layerNodeMap = new Map<number, cc.Node>();
  private _roomNodeMap = new Map<number, cc.Node>();
  private _roomUidMap = new Map<string, cc.Node>();
  private _pointMap = new Map<string, cc.Node>();

  // ==================== 其他数据 ====================
  private _size: cc.Vec2 = null;
  private _areaInfo: number[] = [];
  private _fileName: string = "";

  static ins: MapLoader = null;

  // ==================== 子模块 ====================
  private _mapSerializer: MapSerializer = null;
  private _mapLineDrawer: MapLineDrawer = null;
  private _mapBuilder: MapBuilder = null;

  // ==================== 生命周期 ====================

  onLoad(): void {
    MapLoader.ins = this;

    // 初始化子模块
    this._mapSerializer = new MapSerializer();
    this._mapSerializer.init({
      getPathPoints: () => this._pointMap,
      getRoomNodes: () => this._roomNodeMap,
      getOutRoomUnits: () => this._outRoomUnitCont,
      getPlayerCreate: () => this._playerCreateNd,
      getPlayerExit: () => this._playerExitNd,
      getAreaInfo: () => this._areaInfo,
      getSize: () => this._size,
    });

    this._mapLineDrawer = new MapLineDrawer();
    this._mapLineDrawer.init(
      () => this._pointMap,
      () => this._pointLineCont
    );

    this._mapBuilder = new MapBuilder();
    this._mapBuilder.init(this, {
      defaultSp: this.defaultSp,
      roomPrefab: this.roomPrefab,
      pathPointPrefab: this.pathPointPrefab,
      ladderPrefab: this.ladderPrefab,
      doorPrefab: this.doorPrefab,
      searchItemPrefab: this.searchItemPrefab,
      enemyRefreshPrefab: this.enemyRefreshPrefab,
      survivePrefab: this.survivePrefab,
      fightSoulPrefab: this.fightSoulPrefab,
      defaultPortalPrefab: this.defaultPortalPrefab,
      portalPrefab: this.portalPrefab,
      shipPrefab: this.shipPrefab,
      cablePrefab: this.cablePrefab,
      stonePrefab: this.stonePrefab,
    });
  }

  /**
   * 构建地图
   */
  build(json: any, size: cc.Vec2) {
    if (!json) return;

    this._size = size;
    this._fileName = json.name;
    this.node.removeAllChildren();
    this.clearMaps();

    // 创建基础容器
    this.createContainers();

    // 构建地图
    this._mapBuilder.build(
      json,
      {
        layerCont: this._layerCont,
        outRoomUnitCont: this._outRoomUnitCont,
        playerCreate: this._playerCreateNd,
        playerExit: this._playerExitNd,
      }
    );
  }

  private createContainers() {
    this._layerCont = new cc.Node("LayerCont");
    this._layerCont.parent = this.node;

    this._outRoomUnitCont = new cc.Node("outRoomUnitCont");
    this._outRoomUnitCont.parent = this.node;

    this._playerCreateNd = new cc.Node("playerCreate");
    this._playerCreateNd.parent = this.node;

    this._playerExitNd = new cc.Node("playerExit");
    this._playerExitNd.parent = this.node;

    this._pointLineCont = new cc.Node("pointLineCont");
    this._pointLineCont.group = "pathPoint";
    this._pointLineCont.parent = this.node;
  }

  private clearMaps() {
    this._roomNodeMap.clear();
    this._roomUidMap.clear();
    this._pointMap.clear();
    this._layerNodeMap.clear();
    this._areaInfo = [];
  }

  public initRoom(
    cfgId: number,
    roomDat: any,
    color: cc.Color,
    uid: string,
    unlockPointIds: string[]
  ) {
    const roomNd = this._roomNodeMap.get(cfgId);
    if (!roomNd) return;

    const mapDrawRoom = roomNd.addComponentSafe(MapDrawRoom);
    mapDrawRoom.init(roomDat, color);

    // 注册 uid
    if (uid) {
      this._roomUidMap.set(uid, roomNd);
    }

    // 设置解锁点
    mapDrawRoom.unLockPoints = unlockPointIds
      .map((id) => this._pointMap.get(id))
      .filter(Boolean);
  }

  // ==================== 每帧更新 ====================

  update() {
    this._mapLineDrawer?.refresh();
  }

  // ==================== 节点注册 ====================

  public registerRoomNode(cfgId: number, roomNd: cc.Node) {
    if (!roomNd) return;
    this._roomNodeMap.set(cfgId, roomNd);
    const roomCom = roomNd.getComponent(MapDrawRoom);
    if (roomCom) {
      const uid = roomCom.getUid();
      if (uid) this._roomUidMap.set(uid, roomNd);
    }
  }

  public registerRoomUid(uid: string, roomNd: cc.Node) {
    this._roomUidMap.set(uid, roomNd);
  }

  public registerPoint(id: string, pointNd: cc.Node) {
    this._pointMap.set(id, pointNd);
  }

  public getRoomNodeByUid(uid: string): cc.Node {
    return this._roomUidMap.get(uid);
  }

  public renameRoomNode(oldCfgId: number, newCfgId: number, roomNd: cc.Node) {
    if (!roomNd) return;
    if (oldCfgId !== newCfgId) {
      this._roomNodeMap.delete(oldCfgId);
    }
    this._roomNodeMap.set(newCfgId, roomNd);
  }

  public updatePointMap(pointId: string, pointNd: cc.Node) {
    if (this._pointMap.has(pointId)) return;
    this._pointMap.set(pointId, pointNd);
  }

  // ==================== Layer 管理 ====================

  public addRoomToLayer(roomNd: cc.Node, layer: number) {
    let layerNd = this._layerNodeMap.get(layer);
    if (!layerNd) {
      layerNd = new cc.Node(`Layer${layer}`);
      layerNd.parent = this._layerCont;
      this._layerNodeMap.set(layer, layerNd);
    }

    const worldAnchor = roomNd.convertToWorldSpaceAR(cc.Vec2.ZERO);
    roomNd.parent = layerNd;
    roomNd.setPosition(layerNd.convertToNodeSpaceAR(worldAnchor));
  }

  //重命名layer中的所有房间id
  private reorderLayerNames(mapNo: number, layerNd: cc.Node): MapDrawRoom[] {
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
        this.renameRoomNode(controller.getRoomId(), renamedId, r.node);
        controller.updateRoomId(renamedId);
      }
    });
    return rooms;
  };

  /**
   * 创建新 Layer（拖拽房间落点不在现有 layer 上时）
   */
  public createLayerForRoomDrop(worldY: number, defaultHeight: number = 320): cc.Node {
    if (!this._layerCont) return null;

    const existing = Array.from(this._layerNodeMap.entries())
      .map(([no, node]) => ({ no, node }))
      .filter((it) => it.node && cc.isValid(it.node));

    // 计算插入层号
    let insertNo = 1;
    if (existing.length > 0) {
      const byBottom = existing
        .map((it) => ({
          ...it,
          bottomY: it.node.convertToWorldSpaceAR(cc.Vec2.ZERO).y,
        }))
        .sort((a, b) => a.bottomY - b.bottomY);

      insertNo = byBottom.length + 1;
      for (let i = 0; i < byBottom.length; i++) {
        if (worldY < byBottom[i].bottomY) {
          insertNo = i + 1;
          break;
        }
      }
    }

    // 上移 >= insertNo 的层号
    existing
      .sort((a, b) => b.no - a.no)
      .forEach(({ no, node }) => {
        if (no < insertNo) return;
        const newNo = no + 1;
        node.name = `Layer${newNo}`;
        this._layerNodeMap.delete(no);
        this._layerNodeMap.set(newNo, node);
        this.syncLayerRoomIds(node, newNo);
      });

    // 创建新 layer
    const layerNd = new cc.Node(`Layer${insertNo}`);
    layerNd.parent = this._layerCont;
    layerNd.setAnchorPoint(0, 0);
    this._layerNodeMap.set(insertNo, layerNd);

    const mapWidth = MapTool.getSize().x;
    layerNd.setContentSize(Math.max(1, mapWidth), Math.max(1, defaultHeight));

    const mapLeftWorld =
      mapWidth > 0
        ? this.node.convertToWorldSpaceAR(cc.v2(-mapWidth / 2, 0)).x
        : layerNd.convertToWorldSpaceAR(cc.Vec2.ZERO).x;
    const targetBottomY = worldY - defaultHeight * 0.5;
    const worldAnchor = cc.v2(mapLeftWorld, targetBottomY);
    const localPos = this._layerCont.convertToNodeSpaceAR(worldAnchor);
    layerNd.setPosition(localPos);

    this.rebuildPointIdsByLayer();
    return layerNd;
  }

  //同步layer的所有房间id
  private syncLayerRoomIds(layerNd: cc.Node, newLayerNo: number) {
    layerNd.children.forEach((roomNd) => {
      if (!roomNd) return;
      const roomCom = roomNd.getComponent(MapDrawRoom);
      if (!roomCom) return;
      //更新层级
      roomCom.changeLayer(newLayerNo);

      //自动命名功能，当层级变化时，自动更新房间id
      if (EditorSetting.Instance.getAutoRename()) {
        const oldId = roomCom.getRoomCfgId();
        const oldMapNo = Math.floor(oldId / 100);
        const roomNo = oldId - oldMapNo * 100 - (newLayerNo - 1) * 10;
        const newCfgId = oldMapNo * 100 + (newLayerNo - 1) * 10 + roomNo;
        roomCom.updateRoomId(newCfgId);
        this.renameRoomNode(oldId, newCfgId, roomNd);
      }
    });
  }

  public refreshLayerBoundsByNode(layerNd: cc.Node) {
    this.updateLayerBounds(layerNd);
  }

  public updateAllLayerBounds() {
    if (!this._layerCont) return;
    this._layerCont.children.forEach((layerNd) => {
      this.updateLayerBounds(layerNd);
    });
  }

  //刷新layer的大小
  private updateLayerBounds(layerNd: cc.Node) {
    if (!layerNd || !/^Layer\d+$/.test(layerNd.name)) return;

    const roomNds = layerNd.children;
    if (!roomNds || roomNds.length === 0) return;

    let yMin = Number.POSITIVE_INFINITY;
    let yMax = Number.NEGATIVE_INFINITY;

    const childWorldPosMap = new Map<cc.Node, cc.Vec2>();
    const mapScale = EditorSetting.Instance.getMapScale();

    roomNds.forEach((roomNd) => {
      if (!roomNd) return;
      const worldAnchor = roomNd.convertToWorldSpaceAR(cc.Vec2.ZERO);
      const size = roomNd.getContentSize();
      yMin = Math.min(yMin, worldAnchor.y);
      yMax = Math.max(yMax, worldAnchor.y + size.height * mapScale);
      childWorldPosMap.set(roomNd, worldAnchor);
    });

    const mapWidth = MapTool.getSize().x;
    const width = Math.max(1, mapWidth);
    const height = Math.max(1, (yMax - yMin) / mapScale);

    layerNd.setAnchorPoint(0, 0);
    layerNd.setContentSize(width, height);

    const prevWorldAnchor = layerNd.convertToWorldSpaceAR(cc.Vec2.ZERO);
    const mapLeftWorld =
      mapWidth > 0
        ? this.node.convertToWorldSpaceAR(cc.v2(-mapWidth / 2, 0)).x
        : prevWorldAnchor.x;
    const newLayerWorldAnchor = cc.v2(mapLeftWorld, yMin);
    const newLayerLocalPos = this._layerCont.convertToNodeSpaceAR(newLayerWorldAnchor);
    layerNd.setPosition(newLayerLocalPos);

    childWorldPosMap.forEach((worldAnchorPos, childNd) => {
      const newLocal = layerNd.convertToNodeSpaceAR(worldAnchorPos);
      childNd.setPosition(newLocal);
    });
  }

  //删除空的layer
  public cleanupEmptyLayersAfterMove() {
    if (!this._layerCont) return;
    let hasDelete = false;

    this._layerCont.children.forEach((layerNd) => {
      if (!layerNd || !cc.isValid(layerNd)) return;
      if (!/^Layer\d+$/.test(layerNd.name || "")) return;
      if (layerNd.childrenCount > 0) return;

      const m = /^Layer(\d+)$/.exec(layerNd.name || "");
      if (m) this._layerNodeMap.delete(Number(m[1]));
      layerNd.removeFromParent();
      layerNd.destroy();
      hasDelete = true;
    });

    if (hasDelete) {
      this.scheduleOnce(() => this.compactLayersAfterDelete(), 0);
    }
  }

  //删除空的layer后，重新排序layer
  private compactLayersAfterDelete() {
    if (!this._layerCont) return;

    const layerList: Array<{ no: number; node: cc.Node }> = [];
    this._layerCont.children.forEach((nd) => {
      if (!nd || !cc.isValid(nd)) return;
      const m = /^Layer(\d+)$/.exec(nd.name || "");
      if (!m) return;
      const no = Number(m[1]);
      if (isNaN(no)) return;
      layerList.push({ no, node: nd });
    });

    if (layerList.length === 0) {
      this._layerNodeMap.clear();
      return;
    }

    layerList.sort((a, b) => a.no - b.no);
    this._layerNodeMap.clear();

    layerList.forEach((item, idx) => {
      const newNo = idx + 1;
      item.node.name = `Layer${newNo}`;
      this._layerNodeMap.set(newNo, item.node);
      this.syncLayerRoomIds(item.node, newNo);
    });

    this._layerNodeMap.forEach((layerNd) => this.updateLayerBounds(layerNd));
    this.rebuildPointIdsByLayer();
  }

  // ==================== 房间命名同步 ====================

  //房间拖拽结束后的命名规则
  public syncRoomNameAndIdForLayer(
    roomCom: MapDrawRoom,
    newLayerNd: cc.Node,
    oldLayerNd: cc.Node,
    mapName: string,
  ) {
    if (!roomCom || !newLayerNd) return;
    const mapNoMatch = /(\d+)$/.exec(mapName);
    const mapNo = mapNoMatch ? Number(mapNoMatch[1]) : 0;
    const layerMatch = /^Layer(\d+)$/.exec(newLayerNd.name);
    if (!layerMatch) return;
    const layer = Number(layerMatch[1]);
    if (!isFinite(layer)) return;

    const oldCfgId = roomCom.getRoomCfgId();
    const isNewRoom = oldCfgId == 0;
    const uid = roomCom.getUid();
    let newCfgId = Number(uid.split("_")[0]);

    //自动命名
    if (EditorSetting.Instance.getAutoRename()) {
      //自动命名时，需要重新排序新旧两个layer的所有房间id
      const newLayerRooms = this.reorderLayerNames(mapNo, newLayerNd);
      if (oldLayerNd && oldLayerNd !== newLayerNd) {
        this.reorderLayerNames(mapNo, oldLayerNd);
      }
      const idx = newLayerRooms.findIndex((r) => r === roomCom);
      if (idx < 0) return;
      const newRoomNo = idx + 1;
      //自动命名后的roomId
      newCfgId = mapNo * 100 + (layer - 1) * 10 + newRoomNo;
    }

    // 新房间重新 init
    if (isNewRoom) {
      const worldPos = roomCom.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
      const size = roomCom.node.getContentSize();
      const roomDat: MapDrawDatRoom = {
        uid: uid,
        isManualSet: false,
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
      // 颜色
      let color = cc.Color.WHITE;
      const bgNd = roomCom.node.getChildByName("bg");
      if (bgNd) color = bgNd.color;
      roomCom.init(roomDat, color);
    }
    //旧房间
    else {
      const isManuallySet = roomCom.getManulSet();
      //没有手动改过，刷新id以及所有房间内id
      if (!isManuallySet) roomCom.updateRoomId(newCfgId);
    }
    this.renameRoomNode(oldCfgId, newCfgId, roomCom.node);
  }


  // ==================== 路径点管理 ====================

  public addPathPointToRoom(pData: any, pointNd: cc.Node) {
    this._pointMap.set(pData.id, pointNd);
    const roomNd = this._roomNodeMap.get(pData.roomId);
    if (!roomNd) {
      console.log(`roomId ${pData.roomId} not found`);
      return;
    }
    pointNd.parent = roomNd.getChildByName("pointCont");
    const worldPos = cc.v2(pData.pos.x, pData.pos.y);
    const localPos = pointNd.parent.convertToNodeSpaceAR(worldPos);
    pointNd.setPosition(localPos);
  }

  /**
   * 按层号重排路径点ID
   */
  public rebuildPointIdsByLayer() {
    if (!this._layerCont) return;

    const layerItems: Array<{ no: number; node: cc.Node }> = [];
    this._layerCont.children.forEach((layerNd) => {
      if (!layerNd || !cc.isValid(layerNd)) return;
      const m = /^Layer(\d+)$/.exec(layerNd.name || "");
      if (!m) return;
      const no = Number(m[1]);
      if (!isFinite(no)) return;
      layerItems.push({ no, node: layerNd });
    });
    layerItems.sort((a, b) => a.no - b.no);

    const nextPointMap = new Map<string, cc.Node>();
    layerItems.forEach(({ no, node: layerNd }) => {
      const layerIndex = Math.max(0, no - 1);
      let localId = 0;

      const sortedRooms = layerNd.children
        .filter((roomNd) => !!roomNd && cc.isValid(roomNd))
        .sort((a, b) => {
          const ax = a.convertToWorldSpaceAR(cc.Vec2.ZERO).x;
          const bx = b.convertToWorldSpaceAR(cc.Vec2.ZERO).x;
          return ax - bx;
        });

      sortedRooms.forEach((roomNd) => {
        if (!roomNd || !cc.isValid(roomNd)) return;
        const roomCom = roomNd.getComponent(MapDrawRoom);
        if (!roomCom) return;

        const points = (roomCom.getPoints() || [])
          .filter((pointCom) => !!pointCom && cc.isValid(pointCom.node))
          .sort((a, b) => {
            const ax = a.node.convertToWorldSpaceAR(cc.Vec2.ZERO).x;
            const bx = b.node.convertToWorldSpaceAR(cc.Vec2.ZERO).x;
            return ax - bx;
          });

        points.forEach((pointCom) => {
          if (!pointCom || !cc.isValid(pointCom.node)) return;
          const newPid = `P${layerIndex}_${localId++}`;
          pointCom.setId(newPid);
          nextPointMap.set(newPid, pointCom.node);
        });

        roomCom.refreshDat();
      });
    });

    this._pointMap = nextPointMap;
  }

  // ==================== 节点移动 ====================

  public resolvePathPointNodes(ids: string[] | string): cc.Node[] {
    if (Array.isArray(ids)) {
      return (ids || [])
        .map((id) => this._pointMap.get(id))
        .filter((nd) => !!nd && cc.isValid(nd));
    } else {
      const point = this._pointMap.get(ids);
      return point ? [point] : [];
    }
  }

  //移动item到房间内（区分了路径点和普通房间内item）
  public moveUnitToRoom(
    unitNode: cc.Node,
    targetRoomId: number,
    rebuildIds: boolean = true
  ): boolean {
    if (!unitNode || !cc.isValid(unitNode)) return false;
    if (!isFinite(targetRoomId)) return false;

    const unitCom = unitNode.getComponent(MapDrawUnitBase);
    if (!unitCom) return false;

    const targetRoomNd = this._roomNodeMap.get(targetRoomId);
    if (!targetRoomNd || !cc.isValid(targetRoomNd)) return false;

    const isPoint = unitCom.getType() == UnitType.PathPoint;
    const parentName = isPoint ? "pointCont" : "unitCont";
    const targetPointCont = targetRoomNd.getChildByName(parentName);
    if (!targetPointCont || !cc.isValid(targetPointCont)) return false;

    const prevParent = unitNode.parent;
    unitCom.updateRoomId(targetRoomId);

    if (prevParent === targetPointCont) {
      const targetRoomCom = targetRoomNd.getComponent(MapDrawRoom);
      targetRoomCom?.refreshDat();
      return true;
    }

    const prevWorldPos = unitNode.convertToWorldSpaceAR(cc.Vec2.ZERO);
    const oldOwnerRoom = this.findOwnerRoomByNode(prevParent);
    unitNode.parent = targetPointCont;
    unitNode.setPosition(targetPointCont.convertToNodeSpaceAR(prevWorldPos));

    oldOwnerRoom?.refreshDat();
    targetRoomNd.getComponent(MapDrawRoom)?.refreshDat();

    if (rebuildIds) {
      this.rebuildPointIdsByLayer();
    }

    return true;
  }

  //移动路径点到房间内，通过世界坐标
  public movePathPointToRoomByWorldPos(
    pointNode: cc.Node,
    worldPos: cc.Vec2,
    rebuildIds: boolean = true
  ): boolean {
    if (!pointNode || !cc.isValid(pointNode) || !worldPos) return false;
    let hitRoomId: number = null;

    this._roomNodeMap.forEach((roomNd, cfgId) => {
      if (hitRoomId !== null) return;
      if (!roomNd || !cc.isValid(roomNd)) return;

      const local = roomNd.convertToNodeSpaceAR(worldPos);
      const size = roomNd.getContentSize();
      const left = -roomNd.anchorX * size.width;
      const right = left + size.width;
      const bottom = -roomNd.anchorY * size.height;
      const top = bottom + size.height;

      if (local.x >= left && local.x <= right && local.y >= bottom && local.y <= top) {
        hitRoomId = cfgId;
      }
    });

    if (hitRoomId === null) return false;
    return this.moveUnitToRoom(pointNode, hitRoomId, rebuildIds);
  }

  private findOwnerRoomByNode(nd: cc.Node): MapDrawRoom | null {
    let cur = nd;
    while (cur) {
      const room = cur.getComponent(MapDrawRoom);
      if (room) return room;
      cur = cur.parent;
    }
    return null;
  }

  // ==================== 删除操作 ====================

  public deleteRoom(roomNode: cc.Node) {
    if (!roomNode) return;
    const roomComp = roomNode.getComponent(MapDrawRoom);
    if (!roomComp) return;

    const cfgId = roomComp.getRoomCfgId();
    const uid = roomComp.getUid();
    this._roomNodeMap.delete(cfgId);
    if (uid) this._roomUidMap.delete(uid);

    // 清理路径点
    const pointCont = roomNode.getChildByName("pointCont");
    if (pointCont) {
      pointCont.children.slice().forEach((pNd) => {
        this.deletePathPoint(pNd, false);
      });
    }

    const parentLayer = roomNode.parent;
    roomNode.removeFromParent();
    roomNode.destroy();

    if (parentLayer && cc.isValid(parentLayer)) {
      if (parentLayer.childrenCount === 0) {
        const m = /^Layer(\d+)$/.exec(parentLayer.name || "");
        if (m) this._layerNodeMap.delete(Number(m[1]));
        parentLayer.removeFromParent();
        parentLayer.destroy();
        this.scheduleOnce(() => this.compactLayersAfterDelete(), 0);
      } else {
        this.updateLayerBounds(parentLayer);
      }
    }

    this.scheduleOnce(() => this.rebuildPointIdsByLayer(), 0);
  }

  public deletePathPoint(pointNd: cc.Node, rebuildIds: boolean = true) {
    if (!pointNd || !cc.isValid(pointNd)) return;
    const pointCom = pointNd.getComponent(MapDrawP);
    if (!pointCom) return;

    const oldId = pointCom.getId();

    // 1) 清理链接
    const linked = (pointCom.links || []).slice();
    linked.forEach((toNd) => {
      if (!toNd || !cc.isValid(toNd)) return;
      toNd.getComponent(MapDrawP)?.removeLink(pointNd);
    });

    this._pointMap.forEach((otherNd) => {
      if (!otherNd || !cc.isValid(otherNd)) return;
      if (otherNd === pointNd) return;
      otherNd.getComponent(MapDrawP)?.removeLink(pointNd);
    });

    // 2) 清理梯子绑定
    this._roomNodeMap.forEach((roomNd) => {
      if (!roomNd || !cc.isValid(roomNd)) return;
      const unitCont = roomNd.getChildByName("unitCont");
      if (!unitCont) return;

      const ladders = unitCont.getComponentsInChildren(MapDrawLadder);
      ladders.forEach((ladder) => {
        const binds = (ladder.bindPoints || []).filter(
          (n) => n && cc.isValid(n) && n !== pointNd
        );
        if (binds.length !== (ladder.bindPoints || []).length) {
          ladder.setBinds(binds);
        }
      });
    });

    // 3) 清理房间 unlockPoints
    this._roomNodeMap.forEach((roomNd) => {
      if (!roomNd || !cc.isValid(roomNd)) return;
      const roomCom = roomNd.getComponent(MapDrawRoom);
      if (!roomCom) return;

      const prev = roomCom.unLockPoints || [];
      const next = prev.filter((p) => p && cc.isValid(p) && p !== pointNd);
      if (next.length !== prev.length) {
        roomCom.unLockPoints = next;
        roomCom.refreshDat();
      }
    });

    // 4) 删除节点
    if (oldId) this._pointMap.delete(oldId);
    pointNd.removeFromParent();
    pointNd.destroy();

    // 5) 重排 ID
    if (rebuildIds) {
      this.scheduleOnce(() => this.rebuildPointIdsByLayer(), 0);
    }
  }

  public deletePortal(portalNd: cc.Node) {
    if (!portalNd || !cc.isValid(portalNd)) return;
    portalNd.removeFromParent();
    portalNd.destroy();
  }

  // ==================== 清空 & 导出 ====================

  public clear() {
    this._pointLineCont?.destroyAllChildren();
    this._layerCont?.destroyAllChildren();
    this._outRoomUnitCont?.destroyAllChildren();
    this._mapLineDrawer?.clear();
    this.clearMaps();
    EventManager.instance.emit(MapEditorEvent.ClearEditPanel);
    EventManager.instance.emit(MapEditorEvent.RefreshAreaInfo, this._areaInfo);
  }

  public saveDat(): string {
    this.refreshDat();
    return this._mapSerializer.export();
  }

  /**
   * 从 JSON 创建地图
   * @param jsonStr JSON 字符串
   */
  public restoreFromJson(jsonStr: string): void {
    if (!jsonStr) return;

    try {
      const json = JSON.parse(jsonStr);
      if (!json) return;

      // 1. 清空当前地图
      this.clear();

      // 2. 重新构建地图
      this._mapBuilder.build({ json: json }, {
        layerCont: this._layerCont,
        outRoomUnitCont: this._outRoomUnitCont,
        playerCreate: this._playerCreateNd,
        playerExit: this._playerExitNd,
      });
    } catch (e) {
      console.error("[MapLoader] restoreFromJson failed:", e);
    }
  }

  private refreshDat() {
    this._layerCont?.children.forEach((layer) => {
      layer.children.forEach((roomNd) => {
        const mapDrawRoom = roomNd.addComponentSafe(MapDrawRoom);
        mapDrawRoom.refreshDat();
      });
    });
  }

  // ==================== Getter ====================

  public getRoomNode(cfgId: number): cc.Node {
    return this._roomNodeMap.get(cfgId);
  }

  public getPathPointById(id: string): cc.Node {
    return this._pointMap.get(id);
  }

  public getOutRoomUnitParent(): cc.Node {
    return this._outRoomUnitCont;
  }

  public setAreaInfo(areaInfo: number[]) {
    this._areaInfo = areaInfo;
  }

  public getPathLinkWorldSegmentsForRoom(ownerCfgId: number): Array<{ p0: cc.Vec2; p1: cc.Vec2 }> {
    return this._mapLineDrawer?.getPathLinkWorldSegmentsForRoom(ownerCfgId) ?? [];
  }

  public getPathLinkWorldSegmentsFromPoint(pointNode: cc.Node): Array<{ p0: cc.Vec2; p1: cc.Vec2 }> {
    return this._mapLineDrawer?.getPathLinkWorldSegmentsFromPoint(pointNode) ?? [];
  }
}
