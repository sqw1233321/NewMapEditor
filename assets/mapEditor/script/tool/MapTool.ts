import ModeMgr from "../editor/modes/ModeMgr";

//地图工具类
interface RoomLike {
    node: cc.Node;
    getId: () => number;
    refreshDat?: () => void;
}

export default class MapTool {

    static _mapLoader: cc.Node;
    static _size: cc.Vec2;
    static _modeMgr: ModeMgr;


    static init(mapLaoder: cc.Node, modeMgr: ModeMgr, size: cc.Vec2) {
        this._mapLoader = mapLaoder;
        this._size = size;
        this._modeMgr = modeMgr;
    }

    static getSize() {
        return this._size;
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

    /** 世界坐标是否落在指定节点的 world rect 内（节点为空则视为不命中） */
    static isWorldPosInNodeRect(
        worldPos: cc.Vec2,
        node: cc.Node | null,
    ): boolean {
        if (!node || !cc.isValid(node)) return false;
        const box = node.getBoundingBoxToWorld();
        return box.contains(worldPos);
    }


    static getLeftBottom(node: cc.Node) {
        const s = node.getContentSize();
        const leftBottom = cc.v2(
            -s.width * node.anchorX,
            -s.height * node.anchorY
        );
        return leftBottom;
    }

    static _getIntersection(a: cc.Rect, b: cc.Rect): cc.Rect | null {
        const xMin = Math.max(a.xMin, b.xMin);
        const yMin = Math.max(a.yMin, b.yMin);
        const xMax = Math.min(a.xMax, b.xMax);
        const yMax = Math.min(a.yMax, b.yMax);

        if (xMax >= xMin && yMax >= yMin) {
            return new cc.Rect(
                xMin,
                yMin,
                xMax - xMin,
                yMax - yMin
            );
        }

        return null;
    }


    /** 拖拽结束时，根据 hover 信息找到目标房间 */
    static findHoverRoomForDrag(hoverRoomId: number, hoverRoomName: string): RoomLike | null {
        if (!this._mapLoader) return null;
        const rooms = this._mapLoader.getComponentsInChildren("MapDrawRoom") as any as RoomLike[];
        for (let i = rooms.length - 1; i >= 0; i--) {
            const room = rooms[i];
            if (hoverRoomId !== undefined && room.getId() === hoverRoomId)
                return room;
            if (hoverRoomName && room.node.name === hoverRoomName) return room;
        }
        return null;
    }

    /** 非房间节点落到房间时，选择合适的容器（点进 pointCont，其它进 unitCont） */
    static getNonRoomDropParent(
        itemNd: cc.Node,
        hoverRoom: RoomLike,
    ): cc.Node {
        if (!itemNd || !hoverRoom) return null;
        if (itemNd.getComponent("MapDrawP")) {
            return hoverRoom.node.getChildByName("pointCont") || hoverRoom.node;
        }
        return hoverRoom.node.getChildByName("unitCont") || hoverRoom.node;
    }

    /** 根据任意子节点找到其所属房间 */
    static findOwnerRoomByNode(nd: cc.Node): RoomLike | null {
        let cur = nd;
        while (cur) {
            const room = cur.getComponent("MapDrawRoom") as any as RoomLike;
            if (room) return room;
            cur = cur.parent;
        }
        return null;
    }

    /**获取当前模式类型 */
    static getCurModeType() {
        return this._modeMgr.getCurModeType();
    }

}
