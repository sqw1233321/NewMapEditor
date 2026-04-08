//地图工具类
export default class MapTool {

    static _mapLoader: cc.Node;

    static init(mapLaoder: cc.Node) {
        this._mapLoader = mapLaoder;
    }


    /**
     * 世界坐标转地图坐标
     */
    static converWorldPosToMapPos(worldPos: cc.Vec2) {
        return this._mapLoader.convertToNodeSpaceAR(worldPos);
    }

    /**
     * 世界坐标转地图坐标
     */
    static converMapPosToWorldPos(mapPos: cc.Vec2) {
        return this._mapLoader.convertToWorldSpaceAR(mapPos);
    }

}
