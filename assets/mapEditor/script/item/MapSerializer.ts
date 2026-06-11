import MapBgPrefab from "../editor/MapBgPrefab";
import MapDrawItem from "../editor/mapDrawElement/MapDrawItem";
import MapTool from "../tool/MapTool";
import { UnitType } from "../type/mapTypes";
import { MapDrawDat, MapDrawDatType, MapDrawDatPathPoint, MapDrawDatRoom, MapDrawDatPortalData, MapDrawDatCableData, MapDrawDatStoneData } from "./MapDrawDat";
import MapDrawP from "./MapDrawP";
import MapDrawRoom from "./MapDrawRoom";
import { MapDrawTool } from "./MapDrawTool";


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
    const size = this.collectSize();
    const pathPoints = this.collectPathPoints();
    const rooms = this.collectRooms();
    const playerCreateNd = this._getPlayerCreate();
    const playerExitNd = this._getPlayerExit();
    const playerCreatePos = this.collectPlayerPos(playerCreateNd);
    const playerExitPos = this.collectPlayerPos(playerExitNd);
    const outDat = {
      "size": size,
      pathPoints,
      rooms,
      playerCreatePos,
      playerExitPos
    };
    //补充机制字段
    this.collectOutRoomUnits(outDat);
    //区域相关信息
    outDat["areaInfo"] = this.collectAreaInfo();
    outDat["areaOffset"] = this.collectAreaOffset();
    outDat["createArea"] = this.collectCreateArea(playerCreateNd);
    mapDat.setDat(outDat);
    return mapDat.createJson();
  }

  //导出excel配置
  public exportExcel(): {
    excelName: string;
    id: number;
    itemName: string;
    itemValue: any;
  }[][] {
    const excelSetingInfo = [];
    const roomNodeMap = this._getRoomNodes();
    roomNodeMap.forEach((room) => {
      const handler = room.addComponentSafe(MapDrawRoom);
      excelSetingInfo.push(handler.getExportExcelDat());
    });
    return excelSetingInfo;
  }

  // ==================== 收集方法 ====================
  //收集路径点
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

  //收集房间
  private collectRooms(): MapDrawDatRoom[] {
    const rooms = [];
    const roomNodeMap = this._getRoomNodes();
    roomNodeMap.forEach((room) => {
      const handler = room.addComponentSafe(MapDrawRoom);
      rooms.push(handler.getExportDat());
    });
    rooms.sort((a, b) => (a.cfgId || 0) - (b.cfgId || 0));
    return rooms;
  }

  //收集房间外物品
  private collectOutRoomUnits(outDat: any) {
    const outRoomUnits = this._getOutRoomUnits();
    outRoomUnits.children.forEach((unit) => {
      const controller = unit.getComponent(MapDrawItem);
      if (!controller) return;
      const exportName = controller.getExportName();
      if (!outDat[`${exportName}`]) outDat[`${exportName}`] = [];
      outDat[`${exportName}`].push(controller.getExportDat());
    });
  }

  //收集特殊节点
  private collectPlayerPos(playerNd: cc.Node): { x: number; y: number } {
    if (!playerNd) return { x: 0, y: 0 };
    return playerNd.addComponentSafe(MapDrawItem).getPos();
  }

  //收集地图size信息
  private collectSize() {
    let res = { width: 0, height: 0 };
    const prefab = MapDrawTool.instance.getMapBgPrefab()
    if (!prefab) return res;
    const handler = prefab.getComponent(MapBgPrefab);
    if (!handler) return res;
    const size = handler.getSize();
    res.width = size.width;
    res.height = size.height;
    return res;
  }

  //收集区域信息
  private collectAreaInfo(): number[] {
    let res = [];
    const prefab = MapDrawTool.instance.getMapBgPrefab()
    if (!prefab) return res;
    const handler = prefab.getComponent(MapBgPrefab);
    if (!handler) return res;
    const str = handler.getAreaInfo(this._getLayerMap());
    str.split("_").forEach(key => {
      res.push(Number(key));
    })
    return res;
  }

  //收集区域偏移信息
  private collectAreaOffset() {
    const prefab = MapDrawTool.instance.getMapBgPrefab()
    if (!prefab) return 0;
    const handler = prefab.getComponent(MapBgPrefab);
    if (!handler) return 0;
    return handler.getAreaOffset();
  }

  //收集创建区域信息
  private collectCreateArea(playerCreateNd: cc.Node) {
    const prefab = MapDrawTool.instance.getMapBgPrefab();
    if (!prefab) return 1;
    const handler = prefab.getComponent(MapBgPrefab);
    if (!handler) return 1;
    const worldPos = playerCreateNd.convertToWorldSpaceAR(cc.v2(0, 0));
    const areaNum = handler.getAreaNumberByWorldPos(worldPos);
    return areaNum;
  }
}
