import MapDrawItem from "../editor/mapDrawElement/MapDrawItem";
import MapTool from "../tool/MapTool";
import { UnitType } from "../type/mapTypes";
import { MapDrawDat, MapDrawDatType, MapDrawDatPathPoint, MapDrawDatRoom, MapDrawDatPortalData, MapDrawDatCableData, MapDrawDatStoneData } from "./MapDrawDat";
import MapDrawP from "./MapDrawP";
import MapDrawRoom from "./MapDrawRoom";


/**
 * 地图数据序列化器
 * 负责：从 MapLoader 收集数据，导出为 JSON
 */
export default class MapSerializer {
  private _getPathPoints: () => Map<string, cc.Node>;
  private _getRoomNodes: () => Map<number, cc.Node>;
  private _getOutRoomUnits: () => cc.Node;
  private _getPlayerCreate: () => cc.Node;
  private _getPlayerExit: () => cc.Node;
  private _getAreaInfo: () => number[];

  public init(config: {
    getPathPoints: () => Map<string, cc.Node>;
    getRoomNodes: () => Map<number, cc.Node>;
    getOutRoomUnits: () => cc.Node;
    getPlayerCreate: () => cc.Node;
    getPlayerExit: () => cc.Node;
    getAreaInfo: () => number[];
  }) {
    this._getPathPoints = config.getPathPoints;
    this._getRoomNodes = config.getRoomNodes;
    this._getOutRoomUnits = config.getOutRoomUnits;
    this._getPlayerCreate = config.getPlayerCreate;
    this._getPlayerExit = config.getPlayerExit;
    this._getAreaInfo = config.getAreaInfo;
  }

  /**
   * 导出地图数据为 JSON 字符串
   */
  public export(): string {
    const mapDat = new MapDrawDat();
    const s = MapTool.getSize();
    const size = { width: s.x, height: s.y };
    const pathPoints = this.collectPathPoints();
    const rooms = this.collectRooms();
    const { portalDatas, cableDatas, stoneDatas } = this.collectOutRoomUnits();
    const playerCreatePos = this.collectPlayerPos(this._getPlayerCreate());
    const playerExitPos = this.collectPlayerPos(this._getPlayerExit());
    const areaInfo = this.collectAreaInfo();

    const outDat: MapDrawDatType = {
      size,
      pathPoints,
      rooms,
      playerCreatePos,
      playerExitPos,
      portalDatas,
      scooterDatas: cableDatas,
      rockDatas: stoneDatas,
      areaInfo,
    };

    mapDat.setDat(outDat);
    return mapDat.createJson();
  }

  // ==================== 收集方法 ====================


  private collectPathPoints(): MapDrawDatPathPoint[] {
    const pathPoints: MapDrawDatPathPoint[] = [];
    const pointMap = this._getPathPoints();

    pointMap.forEach((point) => {
      if (!point || !cc.isValid(point)) return;
      pathPoints.push(point.addComponentSafe(MapDrawP).getDat());
    });

    // 按层号和本地ID排序
    pathPoints.sort((a, b) => {
      const ma = /^P(\d+)_(\d+)$/.exec(a.id || "");
      const mb = /^P(\d+)_(\d+)$/.exec(b.id || "");
      if (ma && mb) {
        const la = Number(ma[1]);
        const lb = Number(mb[1]);
        if (la !== lb) return la - lb;
        const na = Number(ma[2]);
        const nb = Number(mb[2]);
        return na - nb;
      }
      return String(a.id || "").localeCompare(String(b.id || ""));
    });

    return pathPoints;
  }

  private collectRooms(): MapDrawDatRoom[] {
    const rooms: MapDrawDatRoom[] = [];
    const roomNodeMap = this._getRoomNodes();

    roomNodeMap.forEach((room) => {
      rooms.push(room.addComponentSafe(MapDrawRoom).getDat());
    });

    rooms.sort((a, b) => (a.cfgId || 0) - (b.cfgId || 0));
    return rooms;
  }

  private collectOutRoomUnits(): {
    portalDatas: MapDrawDatPortalData[];
    cableDatas: MapDrawDatCableData[];
    stoneDatas: MapDrawDatStoneData[];
  } {
    const portalDatas: MapDrawDatPortalData[] = [];
    const cableDatas: MapDrawDatCableData[] = [];
    const stoneDatas: MapDrawDatStoneData[] = [];

    const outRoomUnits = this._getOutRoomUnits();
    outRoomUnits.children.forEach((unit) => {
      const controller = unit.getComponent(MapDrawItem);
      if (!controller) return;
      switch (controller.getType()) {
        case UnitType.Portal:
          portalDatas.push(controller.getExportDat() as unknown as MapDrawDatPortalData);
          break;
        case UnitType.Cable:
          cableDatas.push(controller.getExportDat() as unknown as MapDrawDatCableData);
          break;
        case UnitType.Stone:
          stoneDatas.push(controller.getExportDat() as unknown as MapDrawDatStoneData);
          break;
      }
    });

    return { portalDatas, cableDatas, stoneDatas };
  }

  private collectPlayerPos(playerNd: cc.Node): { x: number; y: number } {
    if (!playerNd) return { x: 0, y: 0 };
    return playerNd.addComponentSafe(MapDrawItem).getPos();
  }

  private collectAreaInfo(): number[] {
    return this._getAreaInfo().map((info) => Number(info));
  }
}
