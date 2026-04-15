//地图工具类
interface RoomLike {
    node: cc.Node;
    getId: () => number;
    refreshDat?: () => void;
}

export default class MapTool {

    static _mapLoader: cc.Node;
    static _size:cc.Vec2;


    static init(mapLaoder: cc.Node, size: cc.Vec2) {
        this._mapLoader = mapLaoder;
        this._size = size;
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

    /** 根据世界坐标命中房间（后遍历优先，尽量选上层叠放时更“靠上”的房间） */
    static findRoomAtWorldPos(worldPos: cc.Vec2, rooms?: RoomLike[]): RoomLike | null {
        if (!this._mapLoader) return null;
        const roomList = rooms || (this._mapLoader.getComponentsInChildren("MapDrawRoom") as any as RoomLike[]);
        const wp = cc.v2(worldPos.x, worldPos.y);
        for (let i = roomList.length - 1; i >= 0; i--) {
            const room = roomList[i];
            const box = room.node.getBoundingBoxToWorld();
            if (box.contains(wp)) return room;
        }
        return null;
    }

    /** 根据世界坐标命中 layer 容器（用于拖拽房间时，鼠标不在任意房间上也能高亮整个 layer） */
    static findLayerAtWorldPos(worldPos: cc.Vec2): cc.Node | null {
        if (!this._mapLoader) return null;
        const wp = cc.v2(worldPos.x, worldPos.y);
        const layerCont = this._mapLoader.getChildByName("LayerCont");
        if (!layerCont) return null;
        for (const layerNd of layerCont.children) {
            // 避免把 LayerCont 自己/其它非 Layer{n} 节点误判
            if (!layerNd || !/^Layer\d+$/.test(layerNd.name)) continue;
            const box = layerNd.getBoundingBoxToWorld();
            if (box.contains(wp)) return layerNd;
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

}
