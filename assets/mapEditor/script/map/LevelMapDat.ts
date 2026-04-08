/**
 * 地图数据
 */
export class MapEditorMapData {
    private _size: MapEditor_Size;
    private _pathPoints: MapEditor_PathPoint[] = [];
    private _rooms: MapEditor_Room[] = [];

    private _searchItemDatas: MapEditor_SearchItemData[] = [];
    private _enemyCreateDatas: MapEditor_EnemyCreateData[] = [];
    private _doorDatas: MapEditor_Door[] = [];
    private _ladderDatas: MapEditor_Ladder[] = [];

    private _playerCreatePos: cc.Vec2;
    private _playerExitPos: cc.Vec2;

    private _json

    constructor(jsonAsset: cc.JsonAsset) {
        const json = jsonAsset?.json;
        if (!json) {
            console.error("MapEditorMapData init error: json is null");
            return;
        }
        this._json = json;
        this._size = json.size;
        this._pathPoints = json.pathPoints;
        this._rooms = json.rooms;
        this._playerCreatePos = json.playerCreatePos;
        this._playerExitPos = json.playerExitPos;
        this._rooms.forEach((room: MapEditor_Room) => {
            this._searchItemDatas.push(...room.searchItemDatas);
            this._enemyCreateDatas.push(...room.enemyCreateDatas);
            this._doorDatas.push(...room.doors);
            this._ladderDatas.push(...room.ladders);
        })
    }

    public getSize() {
        return this._size;
    }

    public getPathPoints() {
        return this._pathPoints;
    }

    public getRooms() {
        return this._rooms;
    }

    public getSearchItemDatas() {
        return this._searchItemDatas;
    }

    public getEnemyCreateDatas() {
        return this._enemyCreateDatas;
    }

    public getDoorDatas() {
        return this._doorDatas;
    }

    public getLadderDatas() {
        return this._ladderDatas;
    }

    public parseToJson() {
        return JSON.stringify(this._json);
    }


}




//类型

export interface MapEditor_Size {
    width: number;
    height: number;
}

/**
 * 路径点
 */
export interface MapEditor_PathPoint {
    id: string;
    roomId: number;
    pos: cc.Vec2;
    links: string[];
}

export interface MapEditor_Room {
    cfgId: number;
    layer: number;
    pos: cc.Vec2;
    size: MapEditor_Size;

    pathPointIds: string[];
    unlockPointIds: string[];

    doors: MapEditor_Door[];
    ladders: MapEditor_Ladder[];

    enemyRefreshDatas: MapEditor_EnemyRefreshData[];
    enemyCreateDatas: MapEditor_EnemyCreateData[];

    baseItemDatas: MapEditor_BaseItemData[];
    searchItemDatas: MapEditor_SearchItemData[];

    survivorDatas: MapEditor_SurvivorData[];
}

export interface MapEditor_Door {
    roomId: number;
    hp: number;
    pos: cc.Vec2;
}

export interface MapEditor_Ladder {
    roomId: number;
    unlockMethod: number;
    unlockCost: number;
    showType: number;
    isExitLadder: boolean;

    pos: cc.Vec2;
    bindPointIds: string[];
}

export interface MapEditor_EnemyRefreshData {
    roomId: number;
    refreshId: number;
    param: string;
    pos: cc.Vec2;
}

export interface MapEditor_EnemyCreateData {
    roomId: number;
    param?: string;
    pos?: cc.Vec2;
}


export interface MapEditor_BaseItemData {
    roomId?: number;
    param?: string;
    pos?: cc.Vec2;
}

/**
 * 搜索点
 */
export interface MapEditor_SearchItemData {
    roomId: number;
    param: string;
    pos: cc.Vec2;
}

/**
 * 幸存者
 */
export interface MapEditor_SurvivorData {
    roomId: number;
    weight: number;
    pos: cc.Vec2;
}