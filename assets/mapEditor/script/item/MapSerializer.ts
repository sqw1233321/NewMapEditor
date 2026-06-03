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
  private _getLayerMap: () => Map<number, cc.Node>;

  public init(config: {
    getPathPoints: () => Map<string, cc.Node>;
    getRoomNodes: () => Map<number, cc.Node>;
    getOutRoomUnits: () => cc.Node;
    getPlayerCreate: () => cc.Node;
    getPlayerExit: () => cc.Node;
    getLayerMap: () => Map<number, cc.Node>;
  }) {
    this._getPathPoints = config.getPathPoints;
    this._getRoomNodes = config.getRoomNodes;
    this._getOutRoomUnits = config.getOutRoomUnits;
    this._getPlayerCreate = config.getPlayerCreate;
    this._getPlayerExit = config.getPlayerExit;
    this._getLayerMap = config.getLayerMap;
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
    const playerCreatePos = this.collectPlayerPos(this._getPlayerCreate());
    const playerExitPos = this.collectPlayerPos(this._getPlayerExit());
    const areaInfo = this.collectAreaInfo();

    const outDat = {
      size,
      pathPoints,
      rooms,
      playerCreatePos,
      playerExitPos,
      areaInfo,
    };
    //补充机制字段
    this.collectOutRoomUnits(outDat);

    mapDat.setDat(outDat);
    return mapDat.createJson();
  }

  // ==================== 收集方法 ====================


  private collectPathPoints(): MapDrawDatPathPoint[] {
    const pathPoints = [];
    const pointMap = this._getPathPoints();

    pointMap.forEach((point) => {
      if (!point || !cc.isValid(point)) return;
      pathPoints.push(point.addComponentSafe(MapDrawP).getExportDat());
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
    const rooms = [];
    const roomNodeMap = this._getRoomNodes();

    roomNodeMap.forEach((room) => {
      rooms.push(room.addComponentSafe(MapDrawRoom).getExportDat());
    });

    rooms.sort((a, b) => (a.cfgId || 0) - (b.cfgId || 0));
    return rooms;
  }

  private collectOutRoomUnits(outDat: any): {} {
    const outRoomUnits = this._getOutRoomUnits();
    outRoomUnits.children.forEach((unit) => {
      const controller = unit.getComponent(MapDrawItem);
      if (!controller) return;
      const exportName = controller.getExportName();
      if (!outDat[`${exportName}`]) outDat[`${exportName}`] = [];
      outDat[`${exportName}`].push(controller.getExportDat());
    });
  }

  private collectPlayerPos(playerNd: cc.Node): { x: number; y: number } {
    if (!playerNd) return { x: 0, y: 0 };
    return playerNd.addComponentSafe(MapDrawItem).getPos();
  }

  //area信息（ex:5_8）
  private collectAreaInfo(): number[] {

  }
}
