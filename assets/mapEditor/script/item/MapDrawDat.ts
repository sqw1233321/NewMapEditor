/**
 * 地图数据
 */
export interface MapDrawDatType {
    size: MapDrawDatSize,
    pathPoints: MapDrawDatPathPoint[],
    rooms: MapDrawDatRoom[],
    playerCreatePos: MapDrawDatVec2,
    playerExitPos: MapDrawDatVec2,
    portalDatas?: MapDrawDatPortalData[],
    cableDatas: MapDrawDatCableData[];
    stoneDatas: MapDrawDatStoneData[];
    areaInfo?: number[]
}


export class MapDrawDat {
    private _jsonDat: MapDrawDatType;

    public setDat(dat: MapDrawDatType) {
        this._jsonDat = dat;
    }

    createJson() {
        return JSON.stringify(this._jsonDat);
    }

    public getSize() {
        return this._jsonDat.size;
    }

    public getPathPoints() {
        return this._jsonDat.pathPoints;
    }
}


//类型

export interface MapDrawDatVec2 {
    x: number;
    y: number;
}

export interface MapDrawDatSize {
    width: number;
    height: number;
}

/**
 * 路径点
 */
export interface MapDrawDatPathPoint {
    id: string;
    roomId: number;
    pos: MapDrawDatVec2;
    links: string[];
}

export interface MapDrawDatRoom {
    cfgId: number;
    layer: number;
    pos: MapDrawDatVec2;
    size: MapDrawDatSize;

    pathPointIds: string[];
    unlockPointIds: string[];

    doors: MapDrawDatDoor[];
    ladders: MapDrawDatLadder[];

    enemyRefreshDatas: MapDrawDatEnemyRefreshData[];
    enemyCreateDatas: MapDrawDatEnemyCreateData[];

    baseItemDatas: MapDrawDatBaseItemData[];
    searchItemDatas: MapDrawDatSearchItemData[];

    survivorDatas: MapDrawDatSurvivorData[];
}

export interface MapDrawDatDoor {
    roomId: number;
    hp: number;
    pos: MapDrawDatVec2;
}

export interface MapDrawDatLadder {
    roomId: number;
    unlockMethod: number;
    unlockCost: number;
    showType: number;
    isExitLadder: boolean;

    pos: MapDrawDatVec2;
    bindPointIds: string[];
}

export interface MapDrawDatEnemyRefreshData {
    roomId: number;
    refreshId: number;
    param: string;
    pos: MapDrawDatVec2;
}

export interface MapDrawDatEnemyCreateData {
    roomId: number;
    param?: string;
    pos?: MapDrawDatVec2;
}


export interface MapDrawDatBaseItemData {
    roomId?: number;
    param?: string;
    pos?: MapDrawDatVec2;
}

/**
 * 搜索点
 */
export interface MapDrawDatSearchItemData {
    roomId: number;
    param: string;
    pos: MapDrawDatVec2;
}

/**
 * 幸存者
 */
export interface MapDrawDatSurvivorData {
    roomId: number;
    weight: number;
    pos: MapDrawDatVec2;
}


/**
 * 传送门相关
 */
export interface MapDrawDatPortalData {
    linkId: string;
    pos: MapDrawDatVec2;
    offsetX: number;
    portalType: PortalType;
    //（除了起始点和终点外的）各个动画点
    animPIds: string[];
}

export enum PortalType {
    //普通转场
    Default = 0,
    //掉落
    Drop = 1,
    //船
    Ship = 2,
}

/**落石 */
export interface MapDrawDatStoneData {
    pos: MapDrawDatVec2;
}

/**缆车 */
export interface MapDrawDatCableData {
    pos: MapDrawDatVec2;
    startId: string;
    endId: string;
    speed: number;
}
