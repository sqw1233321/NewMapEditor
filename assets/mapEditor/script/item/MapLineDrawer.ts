import MapDrawP from "./MapDrawP";

/**
 * 路径连线绘制器
 * 负责：每帧更新路径点的连线显示
 */
export default class MapLineDrawer {
  private _getPointMap: () => Map<string, cc.Node>;
  private _getLineContainer: () => cc.Node;
  private _drawer: cc.Graphics = null;
  private _lineColor: cc.Color = new cc.Color(255, 220, 60, 220);
  private _lineWidth: number = 5;

  public init(
    getPointMap: () => Map<string, cc.Node>,
    getLineContainer: () => cc.Node
  ) {
    this._getPointMap = getPointMap;
    this._getLineContainer = getLineContainer;
  }

  public setLineStyle(color: cc.Color, width: number) {
    this._lineColor = color;
    this._lineWidth = width;
  }

  /**
   * 刷新路径连线（每帧调用）
   */
  public refresh() {
    const lineCont = this._getLineContainer();
    if (!lineCont || !cc.isValid(lineCont)) return;

    if (!this._drawer) {
      this._drawer = lineCont.getComponent(cc.Graphics);
      if (!this._drawer) {
        this._drawer = lineCont.addComponent(cc.Graphics);
      }
      this._drawer.lineWidth = this._lineWidth;
      this._drawer.strokeColor = this._lineColor;
    }

    this._drawer.clear();
    const pointMap = this._getPointMap();
    if (pointMap.size === 0) return;

    const drawn = new Set<string>();
    pointMap.forEach((pointNd) => {
      if (!pointNd || !cc.isValid(pointNd)) return;
      const pointCom = pointNd.getComponent(MapDrawP);
      if (!pointCom) return;

      const fromId = pointCom.getId();
      const fromWorld = pointNd.convertToWorldSpaceAR(cc.Vec2.ZERO);
      const fromLocal = lineCont.convertToNodeSpaceAR(fromWorld);

      const links = pointCom.links || [];
      links.forEach((toNd) => {
        if (!toNd || !cc.isValid(toNd)) return;
        const toCom = toNd.getComponent(MapDrawP);
        if (!toCom) return;

        const toId = toCom.getId();
        if (!fromId || !toId || fromId === toId) return;

        // 无向边去重
        const edgeKey = fromId < toId ? `${fromId}->${toId}` : `${toId}->${fromId}`;
        if (drawn.has(edgeKey)) return;
        drawn.add(edgeKey);

        const toWorld = toNd.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const toLocal = lineCont.convertToNodeSpaceAR(toWorld);

        this._drawer.moveTo(fromLocal.x, fromLocal.y);
        this._drawer.lineTo(toLocal.x, toLocal.y);
      });
    });

    this._drawer.stroke();
  }

  /**
   * 清除所有连线
   */
  public clear() {
    if (this._drawer) {
      this._drawer.clear();
    }
  }

  /**
   * 获取房间关联的路径线段（世界坐标）
   */
  public getPathLinkWorldSegmentsForRoom(
    ownerCfgId: number
  ): Array<{ p0: cc.Vec2; p1: cc.Vec2 }> {
    const out: Array<{ p0: cc.Vec2; p1: cc.Vec2 }> = [];
    const seen = new Set<string>();
    const pointMap = this._getPointMap();

    pointMap.forEach((nodeA) => {
      if (!nodeA || !cc.isValid(nodeA)) return;
      const compA = nodeA.getComponent(MapDrawP);
      if (!compA) return;

      const ra = compA.getRoomId();
      const links = compA.links || [];
      for (let i = 0; i < links.length; i++) {
        const nodeB = links[i];
        if (!nodeB || !cc.isValid(nodeB)) continue;

        const compB = nodeB.getComponent(MapDrawP);
        if (!compB) continue;

        const rb = compB.getRoomId();
        const owner = Math.min(ra, rb);
        if (owner !== ownerCfgId) continue;

        const ida = compA.getId();
        const idb = compB.getId();
        const key = ida < idb ? `${ida}_${idb}` : `${idb}_${ida}`;
        if (seen.has(key)) continue;
        seen.add(key);

        out.push({
          p0: nodeA.convertToWorldSpaceAR(cc.Vec2.ZERO),
          p1: nodeB.convertToWorldSpaceAR(cc.Vec2.ZERO),
        });
      }
    });

    return out;
  }

  /**
   * 获取路径点关联的线段（世界坐标）
   */
  public getPathLinkWorldSegmentsFromPoint(
    pointNode: cc.Node
  ): Array<{ p0: cc.Vec2; p1: cc.Vec2 }> {
    if (!pointNode || !cc.isValid(pointNode)) return [];
    const comp = pointNode.getComponent(MapDrawP);
    if (!comp) return [];

    const w0 = pointNode.convertToWorldSpaceAR(cc.Vec2.ZERO);
    const out: Array<{ p0: cc.Vec2; p1: cc.Vec2 }> = [];
    const links = comp.links || [];

    for (let i = 0; i < links.length; i++) {
      const nodeB = links[i];
      if (!nodeB || !cc.isValid(nodeB)) continue;
      out.push({
        p0: w0.clone(),
        p1: nodeB.convertToWorldSpaceAR(cc.Vec2.ZERO),
      });
    }

    return out;
  }
}
