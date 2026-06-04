import MapDrawP from "./MapDrawP";
import MapDrawRoom from "./MapDrawRoom";
import { MapDrawDatRoom, MapDrawDatPathPoint, } from "./MapDrawDat";
import MapLoader from "./MapLoader";
import MapTool from "../tool/MapTool";
import { UnitType } from "../type/mapTypes";
import MapDrawItem from "../editor/mapDrawElement/MapDrawItem";
import MapItemConvert from "./MapItemConvert";
import DynamicGetter from "../editor/DynamicGetter/DynamicGetter";
import { ReflectionMgr } from "../editor/ReflectionMgr";

const { ccclass, property } = cc._decorator;

/**
 * 地图构建器
 * 职责：从 JSON 数据实例化所有节点（房间、单位、路径点等）
 */
export default class MapBuilder {
  // ==================== Prefab 配置 ====================
  mapDrawItemPrefab: cc.Prefab = null;


  // ==================== 持有 MapLoader 引用 ====================
  private _mapLoader: MapLoader = null;

  // ==================== 回调接口 ====================
  public onBuildComplete?: () => void;

  // ==================== 初始化 ====================

  public init(mapLoader: MapLoader, prefabs: {
    mapDrawItemPrefab: cc.Prefab;
  }) {
    this._mapLoader = mapLoader;
    this.mapDrawItemPrefab = prefabs.mapDrawItemPrefab;
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

    //构建基础节点
    this.buildPlayerNodes(mapData, containers.playerCreate, containers.playerExit);

    //构建房间
    this.buildRooms(mapData, containers.layerCont);

    //构建路径点
    this.buildPathPoints(mapData);

    //构建房间内物品
    this.buildRommUnits(mapData);

    //初始化房间
    this.initRooms(mapData);

    //更新 Layer bounds
    this._mapLoader.updateAllLayerBounds();

    //构建房间外物品
    this.buildOutSideUnits(mapData, containers.outRoomUnitCont);

    this.onBuildComplete?.();
  }

  // ==================== 基础节点 ====================

  private buildPlayerNodes(mapData: any, playerCreate: cc.Node, playerExit: cc.Node) {
    [playerCreate, playerExit].forEach((nd, index) => {
      const isCreate = index === 0;
      nd.name = isCreate ? "playerCreate" : "playerExit";
      const sp = nd.addComponentSafe(cc.Sprite);
      sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
      sp.spriteFrame = DynamicGetter.Ins.getDefaultSp();
      nd.setContentSize(50, 50);
      nd.color = isCreate ? cc.Color.ORANGE : cc.Color.CYAN;

      const dat = isCreate ? mapData.playerCreatePos : mapData.playerExitPos;
      const localPos = this.applyOffset(dat, nd.parent);
      nd.setPosition(localPos);
      nd.addComponentSafe(MapDrawItem);
    });
  }

  // ==================== 房间 ====================

  private buildRooms(mapData: any, layerCont: cc.Node) {
    const rooms = mapData.rooms || [];

    rooms.forEach((room: MapDrawDatRoom) => {
      const roomNd = cc.instantiate(this.mapDrawItemPrefab);
      roomNd.parent = layerCont;
      const localPos = this.applyOffset(room.pos, roomNd.parent);
      roomNd.setPosition(localPos);

      this._mapLoader.addRoomToLayer(roomNd, room.layer);
      this._mapLoader.registerRoomNode(room.cfgId, roomNd);

      const roomCom = roomNd.addComponentSafe(ReflectionMgr.getMapDrawClass(UnitType.Room));
      //静态房间，名称已经修改过
      (roomCom as MapDrawRoom).setDefaultUI();
      (roomCom as MapDrawRoom).setManulSet(true);
    });
  }

  private initRooms(mapData: any) {
    const rooms = mapData.rooms || [];

    rooms.forEach((room: MapDrawDatRoom, index: number) => {
      this._mapLoader.initRoom(room.cfgId, room);
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
        const pointNd = cc.instantiate(this.mapDrawItemPrefab);
        pointNd.name = p.id;
        pointNd.parent = pointCont;
        const anchor = DynamicGetter.Ins.getItemAnchor(UnitType.PathPoint);
        pointNd.setAnchorPoint(anchor[0], anchor[1]);
        const localPos = this.applyOffset(p.pos, pointCont);
        pointNd.setPosition(localPos);
        pointNd.groupIndex = DynamicGetter.Ins.getGroupIndex(UnitType.PathPoint);

        const pointCom = pointNd.addComponentSafe(ReflectionMgr.getMapDrawClass(UnitType.PathPoint)) as MapDrawItem;
        pointCom.init(UnitType.PathPoint, -1, p);

        this._mapLoader.registerPoint(p.id, pointNd);
      });
    });

    // 第二遍：设置链接关系
    pathPoints.forEach((p: MapDrawDatPathPoint) => {
      if (!p.links || p.links.length === 0) return;

      const pointNd = this.getPointById(p.id);
      if (!pointNd) return;

      const pointCom = pointNd.addComponentSafe(ReflectionMgr.getMapDrawClass(UnitType.PathPoint)) as MapDrawItem;
      if (!pointCom) return;
      pointCom.updateMapDat();

      const linkedNodes = p.links
        .map((id: string) => this.getPointById(id))
        .filter((nd): nd is cc.Node => !!nd && cc.isValid(nd));

      (pointCom as MapDrawP).setLinks(linkedNodes);
    });
  }

  // ==================== 构建通用物品 ====================

  //绘制房间内物品
  private buildRommUnits(mapData: any) {
    const rooms = mapData.rooms || [];
    rooms.forEach((room: MapDrawDatRoom) => {
      const keys = Object.keys(room);
      keys.forEach((key: string) => {
        const isUnit = !!DynamicGetter.Ins.getUnitTypeByExportName(key);
        if (!isUnit) return;
        const roomNd = this.getRoomByCfgId(room.cfgId);
        if (!roomNd) return;
        const datArr = room[key] as any[];
        datArr.forEach(dat => {
          const type = DynamicGetter.Ins.getUnitTypeByExportName(key);
          if (!type) return;
          const classCtor = ReflectionMgr.getMapDrawClass(type);
          const uniqueType = classCtor["getUniqueType"]?.(dat) ?? -1;
          const itemNd = cc.instantiate(this.mapDrawItemPrefab);
          const anchor = DynamicGetter.Ins.getItemAnchor(type);
          const groupIndex = DynamicGetter.Ins.getGroupIndex(type);
          itemNd.setAnchorPoint(anchor[0], anchor[1]);
          itemNd.groupIndex = groupIndex;
          itemNd.name = `Item${key}`;
          itemNd.parent = roomNd.getChildByName("unitCont");
          const pos = dat["pos"];
          if (pos) {
            const adjustedPos = this.applyOffset(pos, itemNd.parent);
            itemNd.setPosition(adjustedPos.x, adjustedPos.y);
          }
          const control = itemNd.addComponentSafe(ReflectionMgr.getMapDrawClass(type)) as MapDrawItem;
          control.init(type, uniqueType, dat);
        })
      });
    });
  }

  //绘制房间外机制
  private buildOutSideUnits(mapData: any, outRoomUnitCont: cc.Node) {
    Object.keys(mapData ?? {}).forEach((key: any) => {
      //排除这两货和房间有关的·
      if (["pathPoints", "rooms"].includes(key)) return;
      const setting = DynamicGetter.Ins.getItemSettingByExportName(key);
      if (!setting) return;
      const datArr = mapData[key] as any[];
      datArr.forEach(dat => {
        const type = DynamicGetter.Ins.getUnitTypeByExportName(key);
        if (!type) return;
        const classCtor = ReflectionMgr.getMapDrawClass(type);
        const uniqueType = classCtor["getUniqueType"]?.(dat) ?? -1;
        const itemNd = cc.instantiate(this.mapDrawItemPrefab);
        const anchor = DynamicGetter.Ins.getItemAnchor(type);
        const groupIndex = DynamicGetter.Ins.getGroupIndex(type);
        itemNd.setAnchorPoint(anchor[0], anchor[1]);
        itemNd.groupIndex = groupIndex;
        itemNd.name = `${type}`;
        itemNd.parent = outRoomUnitCont;
        const pos = dat["pos"];
        if (pos) {
          const adjustedPos = this.applyOffset(pos, itemNd.parent);
          itemNd.setPosition(adjustedPos.x, adjustedPos.y);
        }
        const control = itemNd.addComponentSafe(ReflectionMgr.getMapDrawClass(type)) as MapDrawItem;
        control.init(type, uniqueType, dat);
      })
    });

  }


  // ==================== 房间外物品 ====================
  // private buildPortalUnits(mapData: any, outRoomUnitCont: cc.Node) {
  //   let nameId = 0;
  //   const portals: MapDrawDatPortal[] = mapData.portalDatas || [];

  //   portals.forEach((portal: MapDrawDatPortal) => {
  //     const type = portal.portalType ?? PortalType.Default;
  //     const prefab = this.getPortalPrefab(type);
  //     const itemNd = cc.instantiate(prefab);
  //     itemNd.name = `Portal${nameId++}`;
  //     itemNd.parent = outRoomUnitCont;

  //     const adjustedPos = this.applyOffset(portal.pos, itemNd.parent);
  //     itemNd.setPosition(adjustedPos.x, adjustedPos.y);

  //     const control = itemNd.addComponentSafe(MapDrawPortal);
  //     const linkP = this.getPointById(portal.linkId);
  //     const animPs = (portal.animPIds || [])
  //       .map((id: string) => this.getPointById(id))
  //       .filter(Boolean);
  //     control.init(portal, linkP, animPs);
  //   });
  // }

  // private getPortalPrefab(type: PortalType): cc.Prefab {
  //   switch (type) {
  //     case PortalType.Default:
  //       return this.defaultPortalPrefab;
  //     case PortalType.Drop:
  //       return this.portalPrefab;
  //     case PortalType.Ship:
  //       return this.shipPrefab;
  //     default:
  //       return this.defaultPortalPrefab;
  //   }
  // }

  // private buildStoneUnits(mapData: any, outRoomUnitCont: cc.Node) {
  //   let nameId = 0;
  //   const datArr: MapDrawDatStoneData[] = mapData.rockDatas || [];

  //   datArr.forEach((dat: MapDrawDatStoneData) => {
  //     const itemNd = cc.instantiate(this.stonePrefab);
  //     itemNd.name = `Stone${nameId++}`;
  //     itemNd.parent = outRoomUnitCont;

  //     const adjustedPos = this.applyOffset(dat.pos, itemNd.parent);
  //     itemNd.setPosition(adjustedPos.x, adjustedPos.y);

  //     const control = itemNd.addComponentSafe(MapDrawStone);
  //     control.init(dat);
  //   });
  // }

  // private buildCableUnits(mapData: any, outRoomUnitCont: cc.Node) {
  //   let nameId = 0;
  //   const datArr: MapDrawDatCableData[] = mapData.scooterDatas || [];

  //   datArr.forEach((dat: MapDrawDatCableData) => {
  //     const startP: cc.Node = this.getPointById(dat.point1);
  //     const endP: cc.Node = this.getPointById(dat.point2);
  //     if (!startP) return;

  //     const startCom = startP.getComponent(MapDrawP);
  //     if (!startCom) return;

  //     const itemNd = cc.instantiate(this.cablePrefab);
  //     itemNd.name = `Cable${nameId++}`;
  //     itemNd.parent = outRoomUnitCont;

  //     // 使用起始点的世界坐标转换为 outRoomUnitCont 的本地坐标
  //     const adjustedPos = this.applyOffset(startCom.getPos(), itemNd.parent);
  //     itemNd.setPosition(adjustedPos.x, adjustedPos.y);

  //     const points = (dat.points || [])
  //       .map((id: string) => this.getPointById(id))
  //       .filter(Boolean);

  //     const control = itemNd.addComponentSafe(MapDrawCable);
  //     control.init(startP, endP, points, dat);
  //   });
  // }
}
