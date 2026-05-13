import MapDrawCable from "./MapDrawCable";
import MapDrawDoor from "./MapDrawDoor";
import MapDrawEnemyRefresh from "./MapDrawEnemyRefresh";
import MapDrawFightSoul from "./MapDrawFightSoul";
import MapDrawLadder from "./MapDrawLadder";
import MapDrawP from "./MapDrawP";
import MapDrawPortal from "./MapDrawPortal";
import MapDrawRoom from "./MapDrawRoom";
import MapDrawSearchItem from "./MapDrawSearchItem";
import MapDrawStone from "./MapDrawStone";
import MapDrawSurvive from "./MapDrawSurvive";
import MapDrawUnitBase from "./MapDrawUnitBase";
import {
  MapDrawDatRoom,
  MapDrawDatPathPoint,
  MapDrawDatEnemyRefreshData,
  MapDrawDatPortalData as MapDrawDatPortal,
  PortalType,
  MapDrawDatCableData,
  MapDrawDatStoneData,
} from "./MapDrawDat";
import MapLoader from "./MapLoader";
import MapTool from "../tool/MapTool";
import { MechanismInstance } from "../type/MechanismDefine";
import { MechanismMgr } from "../frameWork/MechanismMgr";
import MechanismItem from "./MechanismItem";

const { ccclass, property } = cc._decorator;

/**
 * 地图构建器
 * 职责：从 JSON 数据实例化所有节点（房间、单位、路径点等）
 */
export default class MapBuilder {
  // ==================== Prefab 配置 ====================
  @property(cc.SpriteFrame) defaultSp: cc.SpriteFrame = null;
  @property(cc.Prefab) roomPrefab: cc.Prefab = null;
  @property(cc.Prefab) pathPointPrefab: cc.Prefab = null;
  @property(cc.Prefab) ladderPrefab: cc.Prefab = null;
  @property(cc.Prefab) doorPrefab: cc.Prefab = null;
  @property(cc.Prefab) searchItemPrefab: cc.Prefab = null;
  @property(cc.Prefab) enemyRefreshPrefab: cc.Prefab = null;
  @property(cc.Prefab) survivePrefab: cc.Prefab = null;
  @property(cc.Prefab) fightSoulPrefab: cc.Prefab = null;
  @property(cc.Prefab) defaultPortalPrefab: cc.Prefab = null;
  @property(cc.Prefab) portalPrefab: cc.Prefab = null;
  @property(cc.Prefab) shipPrefab: cc.Prefab = null;
  @property(cc.Prefab) cablePrefab: cc.Prefab = null;
  @property(cc.Prefab) stonePrefab: cc.Prefab = null;

  // ==================== 持有 MapLoader 引用 ====================
  private _mapLoader: MapLoader = null;

  // ==================== 回调接口 ====================
  public onBuildComplete?: () => void;

  // ==================== 私有变量 ====================
  private _roomColors = [
    new cc.Color(255, 80, 80),   // 红
    new cc.Color(80, 255, 80),   // 绿
    new cc.Color(80, 160, 255),  // 蓝
    new cc.Color(255, 200, 80),  // 黄
    new cc.Color(200, 80, 255),  // 紫
    new cc.Color(80, 255, 220),  // 青
  ];

  // ==================== 初始化 ====================

  public init(mapLoader: MapLoader, prefabs: {
    defaultSp: cc.SpriteFrame;
    roomPrefab: cc.Prefab;
    pathPointPrefab: cc.Prefab;
    ladderPrefab: cc.Prefab;
    doorPrefab: cc.Prefab;
    searchItemPrefab: cc.Prefab;
    enemyRefreshPrefab: cc.Prefab;
    survivePrefab: cc.Prefab;
    fightSoulPrefab: cc.Prefab;
    defaultPortalPrefab: cc.Prefab;
    portalPrefab: cc.Prefab;
    shipPrefab: cc.Prefab;
    cablePrefab: cc.Prefab;
    stonePrefab: cc.Prefab;
  }) {
    this._mapLoader = mapLoader;
    this.defaultSp = prefabs.defaultSp;
    this.roomPrefab = prefabs.roomPrefab;
    this.pathPointPrefab = prefabs.pathPointPrefab;
    this.ladderPrefab = prefabs.ladderPrefab;
    this.doorPrefab = prefabs.doorPrefab;
    this.searchItemPrefab = prefabs.searchItemPrefab;
    this.enemyRefreshPrefab = prefabs.enemyRefreshPrefab;
    this.survivePrefab = prefabs.survivePrefab;
    this.fightSoulPrefab = prefabs.fightSoulPrefab;
    this.defaultPortalPrefab = prefabs.defaultPortalPrefab;
    this.portalPrefab = prefabs.portalPrefab;
    this.shipPrefab = prefabs.shipPrefab;
    this.cablePrefab = prefabs.cablePrefab;
    this.stonePrefab = prefabs.stonePrefab;
  }

  // ==================== 辅助方法 ====================

  private getPointById(id: string): cc.Node | null {
    return this._mapLoader.getPathPointById(id);
  }

  private getRoomByCfgId(cfgId: number): cc.Node | null {
    return this._mapLoader.getRoomNode(cfgId);
  }

  private applyOffset(pos: { x: number; y: number }, parentNd: cc.Node): cc.Vec2 {
    return parentNd?.convertToNodeSpaceAR(cc.v2(MapTool.converMapPosToWorldPos(cc.v2(pos.x, pos.y))));
  }

  // ==================== 构建 ====================

  public build(
    json: any,
    containers: {
      layerCont: cc.Node;
      outRoomUnitCont: cc.Node;
      playerCreate: cc.Node;
      playerExit: cc.Node;
    }
  ) {
    if (!json) return;

    const mapData = json.json;

    // 1. 设置区域信息
    this._mapLoader.setAreaInfo(mapData.areaInfo || []);

    // 2. 构建基础节点
    this.buildPlayerNodes(mapData, containers.playerCreate, containers.playerExit);

    // 3. 构建房间
    this.buildRooms(mapData, containers.layerCont);

    // 4. 构建路径点
    this.buildPathPoints(mapData);

    // 5. 构建房间内物品
    this.buildLadders(mapData);
    this.buildDoors(mapData);
    this.buildSearchItems(mapData);
    this.buildEnemyRefresh(mapData);
    this.buildSurvives(mapData);
    this.buildFightSoul(mapData);

    // 6. 初始化房间
    this.initRooms(mapData);

    // 7. 更新 Layer bounds
    this._mapLoader.updateAllLayerBounds();

    // 8. 构建房间外物品
    this.buildPortalUnits(mapData, containers.outRoomUnitCont);
    this.buildStoneUnits(mapData, containers.outRoomUnitCont);
    this.buildCableUnits(mapData, containers.outRoomUnitCont);

    // 9. 构建机制实例
    this.buildMechanisms(mapData, containers.outRoomUnitCont);

    this.onBuildComplete?.();
  }

  // ==================== 基础节点 ====================

  private buildPlayerNodes(mapData: any, playerCreate: cc.Node, playerExit: cc.Node) {
    [playerCreate, playerExit].forEach((nd, index) => {
      const isCreate = index === 0;
      nd.name = isCreate ? "playerCreate" : "playerExit";
      const sp = nd.addComponentSafe(cc.Sprite);
      sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
      sp.spriteFrame = this.defaultSp;
      nd.setContentSize(50, 50);
      nd.color = isCreate ? cc.Color.ORANGE : cc.Color.CYAN;

      const dat = isCreate ? mapData.playerCreatePos : mapData.playerExitPos;
      const localPos = this.applyOffset(dat, nd.parent);
      nd.setPosition(localPos);
      nd.addComponentSafe(MapDrawUnitBase);
    });
  }

  // ==================== 房间 ====================

  private buildRooms(mapData: any, layerCont: cc.Node) {
    const rooms = mapData.rooms || [];

    rooms.forEach((room: MapDrawDatRoom) => {
      const roomNd = cc.instantiate(this.roomPrefab);
      roomNd.parent = layerCont;
      roomNd.setAnchorPoint(0, 0);

      const localPos = this.applyOffset(room.pos, roomNd.parent);
      roomNd.setPosition(localPos);

      this._mapLoader.addRoomToLayer(roomNd, room.layer);
      this._mapLoader.registerRoomNode(room.cfgId, roomNd);

      const roomCom = roomNd.getComponent(MapDrawRoom);
      //静态房间，名称已经修改过
      roomCom.setManulSet(true);
    });
  }

  private initRooms(mapData: any) {
    const rooms = mapData.rooms || [];

    rooms.forEach((room: MapDrawDatRoom, index: number) => {
      const color = this._roomColors[index % this._roomColors.length];
      this._mapLoader.initRoom(room.cfgId, room, color,room.unlockPointIds || []);
    });
  }

  // ==================== 路径点 ====================

  private buildPathPoints(mapData: any) {
    const pathPoints = mapData.pathPoints || [];
    const rooms = mapData.rooms || [];

    // 预处理：建立 roomId -> 路径点列表的映射
    const roomPointsMap = new Map<number, MapDrawDatPathPoint[]>();
    pathPoints.forEach((p: MapDrawDatPathPoint) => {
      const list = roomPointsMap.get(p.roomId) || [];
      list.push(p);
      roomPointsMap.set(p.roomId, list);
    });

    // 遍历每个房间，为房间内的路径点创建节点
    rooms.forEach((room: MapDrawDatRoom) => {
      const roomNd = this.getRoomByCfgId(room.cfgId);
      if (!roomNd) return;

      const pointCont = roomNd.getChildByName("pointCont");
      if (!pointCont) return;

      const points = roomPointsMap.get(room.cfgId) || [];
      points.forEach((p: MapDrawDatPathPoint) => {
        const pointNd = cc.instantiate(this.pathPointPrefab);
        pointNd.name = p.id;
        pointNd.parent = pointCont;

        const localPos = this.applyOffset(p.pos, pointCont);
        pointNd.setPosition(localPos);

        const pointCom = pointNd.addComponentSafe(MapDrawP);
        pointCom.init(p);

        this._mapLoader.registerPoint(p.id, pointNd);
      });
    });

    // 第二遍：设置链接关系
    pathPoints.forEach((p: MapDrawDatPathPoint) => {
      if (!p.links || p.links.length === 0) return;

      const pointNd = this.getPointById(p.id);
      if (!pointNd) return;

      const pointCom = pointNd.getComponent(MapDrawP);
      if (!pointCom) return;

      const linkedNodes = p.links
        .map((id: string) => this.getPointById(id))
        .filter((nd): nd is cc.Node => !!nd && cc.isValid(nd));

      pointCom.setLinks(linkedNodes);
    });
  }

  // ==================== 房间内物品 ====================

  private buildLadders(mapData: any) {
    let ladderId = 0;
    const rooms = mapData.rooms || [];

    rooms.forEach((room: MapDrawDatRoom) => {
      const ladders = room.ladders || [];
      ladders.forEach((ladder: any) => {
        const roomNd = this.getRoomByCfgId(room.cfgId);
        if (!roomNd) return;

        const ladderNd = cc.instantiate(this.ladderPrefab);
        ladderNd.name = `Ladder${ladderId++}`;
        ladderNd.parent = roomNd.getChildByName("unitCont");
        ladderNd.setAnchorPoint(0.5, 0);

        const adjustedPos = this.applyOffset(ladder.pos, ladderNd.parent);
        ladderNd.setPosition(adjustedPos.x, adjustedPos.y);

        // 设置高度
        const startNd = this.getPointById(ladder.bindPointIds?.[0]);
        const endNd = this.getPointById(ladder.bindPointIds?.[1]);
        if (endNd && startNd) {
          const startCom = startNd?.getComponent(MapDrawP);
          const endCom = endNd?.getComponent(MapDrawP);
          if (startCom && endCom) {
            const height = endCom.getPos().y - startCom.getPos().y;
            ladderNd.setContentSize(ladderNd.width, height);
          }
        }

        const bindPoint: cc.Node[] = (ladder.bindPointIds || [])
          .map((id: string) => this.getPointById(id))
          .filter(Boolean);

        const control = ladderNd.addComponentSafe(MapDrawLadder);
        control.init(ladder.roomId, bindPoint, ladder.isExitLadder);
      });
    });
  }

  private buildDoors(mapData: any) {
    let doorId = 0;
    const rooms = mapData.rooms || [];

    rooms.forEach((room: MapDrawDatRoom) => {
      const doors = room.doors || [];
      doors.forEach((door: any) => {
        const roomNd = this.getRoomByCfgId(room.cfgId);
        if (!roomNd) return;

        const doorNd = cc.instantiate(this.doorPrefab);
        doorNd.name = `Door${doorId++}`;
        doorNd.parent = roomNd.getChildByName("unitCont");

        const adjustedPos = this.applyOffset(door.pos, doorNd.parent);
        doorNd.setPosition(adjustedPos.x, adjustedPos.y);

        const control = doorNd.addComponentSafe(MapDrawDoor);
        control.init(door.roomId, door.hp);
      });
    });
  }

  private buildSearchItems(mapData: any) {
    let nameId = 0;
    const rooms = mapData.rooms || [];

    rooms.forEach((room: MapDrawDatRoom) => {
      const searchItems = room.searchItemDatas || [];
      searchItems.forEach((item: any) => {
        const roomNd = this.getRoomByCfgId(room.cfgId);
        if (!roomNd) return;

        const itemNd = cc.instantiate(this.searchItemPrefab);
        itemNd.name = `SearchItem${nameId++}`;
        itemNd.parent = roomNd.getChildByName("unitCont");

        const adjustedPos = this.applyOffset(item.pos, itemNd.parent);
        itemNd.setPosition(adjustedPos.x, adjustedPos.y);

        const control = itemNd.addComponentSafe(MapDrawSearchItem);
        control.init(item.roomId);
      });
    });
  }

  private buildEnemyRefresh(mapData: any) {
    let nameId = 0;
    const rooms = mapData.rooms || [];
    const enemyRefreshDatas: MapDrawDatEnemyRefreshData[] = rooms.flatMap(
      (room: MapDrawDatRoom) => room.enemyRefreshDatas || []
    );

    enemyRefreshDatas.forEach((refreshDat: MapDrawDatEnemyRefreshData) => {
      const roomNd = this.getRoomByCfgId(refreshDat.roomId);
      if (!roomNd) return;

      const itemNd = cc.instantiate(this.enemyRefreshPrefab);
      itemNd.name = `EnemyRefresh${nameId++}`;
      itemNd.parent = roomNd.getChildByName("unitCont");

      const adjustedPos = this.applyOffset(refreshDat.pos, itemNd.parent);
      itemNd.setPosition(adjustedPos.x, adjustedPos.y);

      const control = itemNd.addComponentSafe(MapDrawEnemyRefresh);
      control.init(refreshDat.roomId, refreshDat.refreshId, refreshDat.param);
    });
  }

  private buildSurvives(mapData: any) {
    let nameId = 0;
    const rooms = mapData.rooms || [];

    rooms.forEach((room: MapDrawDatRoom) => {
      const surviveDatas = room.survivorDatas || [];
      surviveDatas.forEach((survive: any) => {
        const roomNd = this.getRoomByCfgId(room.cfgId);
        if (!roomNd) return;

        const itemNd = cc.instantiate(this.survivePrefab);
        itemNd.name = `Survive${nameId++}`;
        itemNd.parent = roomNd.getChildByName("unitCont");

        const adjustedPos = this.applyOffset(survive.pos, itemNd.parent);
        itemNd.setPosition(adjustedPos.x, adjustedPos.y);

        const control = itemNd.addComponentSafe(MapDrawSurvive);
        control.init(survive);
      });
    });
  }

  private buildFightSoul(mapData: any) {
    let nameId = 0;
    const rooms = mapData.rooms || [];

    rooms.forEach((room: MapDrawDatRoom) => {
      const fightSoulDatas = room.fightSoulDatas || [];
      fightSoulDatas.forEach((fightSoul: any) => {
        const roomNd = this.getRoomByCfgId(room.cfgId);
        if (!roomNd) return;

        const itemNd = cc.instantiate(this.fightSoulPrefab);
        itemNd.name = `FightSoul${nameId++}`;
        itemNd.parent = roomNd.getChildByName("unitCont");

        const adjustedPos = this.applyOffset(fightSoul.pos, itemNd.parent);
        itemNd.setPosition(adjustedPos.x, adjustedPos.y);

        const control = itemNd.addComponentSafe(MapDrawFightSoul);
        control.init(fightSoul);
      });
    });
  }

  // ==================== 房间外物品 ====================

  private buildPortalUnits(mapData: any, outRoomUnitCont: cc.Node) {
    let nameId = 0;
    const portals: MapDrawDatPortal[] = mapData.portalDatas || [];

    portals.forEach((portal: MapDrawDatPortal) => {
      const type = portal.portalType ?? PortalType.Default;
      const prefab = this.getPortalPrefab(type);
      const itemNd = cc.instantiate(prefab);
      itemNd.name = `Portal${nameId++}`;
      itemNd.parent = outRoomUnitCont;

      const adjustedPos = this.applyOffset(portal.pos, itemNd.parent);
      itemNd.setPosition(adjustedPos.x, adjustedPos.y);

      const control = itemNd.addComponentSafe(MapDrawPortal);
      const linkP = this.getPointById(portal.linkId);
      const animPs = (portal.animPIds || [])
        .map((id: string) => this.getPointById(id))
        .filter(Boolean);
      control.init(portal, linkP, animPs);
    });
  }

  private getPortalPrefab(type: PortalType): cc.Prefab {
    switch (type) {
      case PortalType.Default:
        return this.defaultPortalPrefab;
      case PortalType.Drop:
        return this.portalPrefab;
      case PortalType.Ship:
        return this.shipPrefab;
      default:
        return this.defaultPortalPrefab;
    }
  }

  private buildStoneUnits(mapData: any, outRoomUnitCont: cc.Node) {
    let nameId = 0;
    const datArr: MapDrawDatStoneData[] = mapData.rockDatas || [];

    datArr.forEach((dat: MapDrawDatStoneData) => {
      const itemNd = cc.instantiate(this.stonePrefab);
      itemNd.name = `Stone${nameId++}`;
      itemNd.parent = outRoomUnitCont;

      const adjustedPos = this.applyOffset(dat.pos, itemNd.parent);
      itemNd.setPosition(adjustedPos.x, adjustedPos.y);

      const control = itemNd.addComponentSafe(MapDrawStone);
      control.init(dat);
    });
  }

  private buildCableUnits(mapData: any, outRoomUnitCont: cc.Node) {
    let nameId = 0;
    const datArr: MapDrawDatCableData[] = mapData.scooterDatas || [];

    datArr.forEach((dat: MapDrawDatCableData) => {
      const startP: cc.Node = this.getPointById(dat.point1);
      const endP: cc.Node = this.getPointById(dat.point2);
      if (!startP) return;

      const startCom = startP.getComponent(MapDrawP);
      if (!startCom) return;

      const itemNd = cc.instantiate(this.cablePrefab);
      itemNd.name = `Cable${nameId++}`;
      itemNd.parent = outRoomUnitCont;

      // 使用起始点的世界坐标转换为 outRoomUnitCont 的本地坐标
      const adjustedPos = this.applyOffset(startCom.getPos(), itemNd.parent);
      itemNd.setPosition(adjustedPos.x, adjustedPos.y);

      const points = (dat.points || [])
        .map((id: string) => this.getPointById(id))
        .filter(Boolean);

      const control = itemNd.addComponentSafe(MapDrawCable);
      control.init(startP, endP, points, dat);
    });
  }

  // ==================== 机制实例 ====================

  /**
   * 构建机制实例
   * @param mapData 地图数据
   * @param outRoomUnitCont 房间外物品容器
   */
  private buildMechanisms(mapData: any, outRoomUnitCont: cc.Node) {
    const mechanisms: MechanismInstance[] = mapData.mechanismInstances || [];
    
    mechanisms.forEach((mechanismDat: MechanismInstance, index: number) => {
      const def = MechanismMgr.instance.getDefine(mechanismDat.mechanismId);
      if (!def) {
        console.warn(`[MapBuilder] Unknown mechanism id: ${mechanismDat.mechanismId}`);
        return;
      }

      // 根据机制定义获取对应的 prefab
      const prefab = this.getMechanismPrefab(def.prefabPath);
      if (!prefab) {
        console.warn(`[MapBuilder] No prefab for mechanism: ${mechanismDat.mechanismId}`);
        return;
      }

      const itemNd = cc.instantiate(prefab);
      itemNd.name = `${mechanismDat.mechanismId}_${index}`;
      itemNd.parent = outRoomUnitCont;

      const adjustedPos = this.applyOffset(mechanismDat.pos, itemNd.parent);
      itemNd.setPosition(adjustedPos.x, adjustedPos.y);

      // 初始化机制组件
      const mechanismCom = itemNd.getComponent(MechanismItem);
      if (mechanismCom) {
        mechanismCom.fromDat(mechanismDat);
      } else {
        // 如果没有 MechanismItem 组件，添加并初始化
        const newCom = itemNd.addComponentSafe(MechanismItem);
        newCom.fromDat(mechanismDat);
      }
    });
  }

  /** 机制 Prefab 缓存 */
  private _mechanismPrefabCache: Map<string, cc.Prefab> = new Map();

  /**
   * 获取机制 prefab
   * @param prefabPath prefab 资源路径
   */
  private getMechanismPrefab(prefabPath: string): cc.Prefab {
    if (this._mechanismPrefabCache.has(prefabPath)) {
      return this._mechanismPrefabCache.get(prefabPath);
    }

    // 动态加载 prefab
    return new Promise<cc.Prefab>((resolve) => {
      cc.resources.load(prefabPath, cc.Prefab, (err, prefab) => {
        if (err) {
          console.error(`[MapBuilder] Failed to load prefab: ${prefabPath}`, err);
          resolve(null);
          return;
        }
        this._mechanismPrefabCache.set(prefabPath, prefab as cc.Prefab);
        resolve(prefab as cc.Prefab);
      });
    }) as any;
  }

  /**
   * 同步获取机制 prefab（需要先预加载）
   */
  public preloadMechanismPrefab(prefabPath: string, prefab: cc.Prefab): void {
    this._mechanismPrefabCache.set(prefabPath, prefab);
  }
}
