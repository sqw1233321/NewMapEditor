// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { MapDrawDat, MapDrawDatEnemyRefreshData, MapDrawDatPathPoint, MapDrawDatPortalData as MapDrawDatPortal, MapDrawDatRoom, MapDrawDatSize } from "./MapDrawDat";
import MapDrawDoor from "./MapDrawDoor";
import MapDrawEnemyRefresh from "./MapDrawEnemyRefresh";
import MapDrawLadder from "./MapDrawLadder";
import MapDrawP from "./MapDrawP";
import MapDrawPortal from "./MapDrawPortal";
import MapDrawRoom from "./MapDrawRoom";
import MapDrawSearchItem from "./MapDrawSearchItem";
import MapDrawUnitBase from "./MapDrawUnitBase";

const { ccclass, property, executeInEditMode } = cc._decorator;

@ccclass
// @executeInEditMode
export default class MapLoader extends cc.Component {

    @property(cc.JsonAsset)
    mapJson: cc.JsonAsset = null;

    @property(cc.Vec2)
    size: cc.Vec2 = new cc.Vec2(0, 0);

    @property([cc.String])
    areaInfo: string[] = [];

    @property(cc.SpriteFrame)
    defaultSp: cc.SpriteFrame = null;

    @property
    generate = false;

    @property
    clearAll = false;

    @property
    save = false;

    @property(cc.Prefab)
    roomPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    pathPointPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    ladderPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    doorPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    searchItemPrefabPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    enemyRefreshPrefab: cc.Prefab = null;

    private _data;
    private _layerCont: cc.Node;
    private _layerNodeMap = new Map<number, cc.Node>();
    private _roomNodeMap = new Map<number, cc.Node>();
    private _pointMap = new Map<string, cc.Node>();
    private _playerCreateNd: cc.Node;
    private _playerExitNd: cc.Node;
    private _portalCont: cc.Node;

    private _fileName = "";

    static ins: MapLoader = null;

    private ROOM_COLORS = [
        new cc.Color(255, 80, 80),    // 红
        new cc.Color(80, 255, 80),    // 绿
        new cc.Color(80, 160, 255),   // 蓝
        new cc.Color(255, 200, 80),   // 黄
        new cc.Color(200, 80, 255),   // 紫
        new cc.Color(80, 255, 220),   // 青
    ];

    onLoad(): void {
        MapLoader.ins = this;
        this.build();
    }

    build() {
        if (!this.mapJson) return;
        this._fileName = this.mapJson.name;
        this._data = this.mapJson.json;
        this.node.removeAllChildren();
        this.areaInfo = [];
        this._data.areaInfo?.forEach(info => {
            this.areaInfo.push(`${info}`);
        })
        this.buildBaseNd();
        this.buildRooms();
        this.buildPathPoints();
        this.buildLadders();
        this.buildDoors();
        this.buildSearchItems();
        this.buildEnemyRefres();
        this.buildPortals();

        //所有节点创建完毕后，往Room中填数据
        this.initRooms();
    }

    private buildBaseNd() {
        this._portalCont = new cc.Node("portalCont");
        this._portalCont.parent = this.node;
        this._layerCont = new cc.Node("LayerCont");
        this._layerCont.parent = this.node;
        this._playerCreateNd = new cc.Node("playerCreate");
        this._playerCreateNd.parent = this.node;
        this._playerExitNd = new cc.Node("playerExit");
        this._playerExitNd.parent = this.node;
        [this._playerCreateNd, this._playerExitNd].forEach((nd, index) => {
            const isCreate = index == 0;
            nd.name = isCreate ? "playerCreate" : "playerExit";
            const sp = nd.addComponentSafe(cc.Sprite);
            sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            sp.spriteFrame = this.defaultSp;
            nd.setContentSize(50, 50);
            nd.color = isCreate ? cc.Color.ORANGE : cc.Color.CYAN;
            const dat = isCreate ? this._data.playerCreatePos : this._data.playerExitPos;
            const worldPos = cc.v2(dat.x, dat.y);
            const localPos = nd.parent.convertToNodeSpaceAR(worldPos);
            nd.setPosition(localPos);
            nd.addComponentSafe(MapDrawUnitBase);
        })
    }

    private buildRooms() {
        const rooms = this._data.rooms;
        rooms.forEach((room: MapDrawDatRoom, index) => {
            const roomNd = cc.instantiate(this.roomPrefab);
            roomNd.parent = this._layerCont;
            roomNd.setAnchorPoint(0, 0);
            const worldPos = cc.v2(room.pos.x, room.pos.y);
            const localPos = roomNd.parent.convertToNodeSpaceAR(worldPos);
            roomNd.setPosition(localPos);
            this.addRoomToLayer(roomNd, room.layer);
            this._roomNodeMap.set(room.cfgId, roomNd);
        })
    }

    //所有子节点创建完毕后再来初始化房间
    private initRooms() {
        const rooms = this._data.rooms;
        rooms.forEach((room: MapDrawDatRoom, index: number) => {
            const cfgId = room.cfgId;
            const roomNd = this._roomNodeMap.get(cfgId);
            const mapDrawRoom = roomNd.addComponentSafe(MapDrawRoom);
            mapDrawRoom.init(room, this.ROOM_COLORS[index % this.ROOM_COLORS.length]);
            mapDrawRoom.unLockPoints = room.unlockPointIds.map(id => this._pointMap.get(id));
        })

        // 此时 room 的 contentSize 已由 MapDrawRoom.init 设置完成，重新计算每个 Layer 的 bounds
        this.updateAllLayerBounds();
    }

    private updateAllLayerBounds() {
        if (!this._layerCont) return;
        this._layerCont.children.forEach((layerNd) => {
            this.updateLayerBounds(layerNd);
        });
    }

    private buildPathPoints() {
        const pathPoints = this._data.pathPoints;
        pathPoints.forEach((p: MapDrawDatPathPoint) => {
            const pointNd = cc.instantiate(this.pathPointPrefab);
            pointNd.name = `${p.id}`;
            const pointCom = pointNd.addComponentSafe(MapDrawP);
            pointCom.init(p);
            this.addPathPointToRoom(p, pointNd);
        });
        pathPoints.forEach((p: MapDrawDatPathPoint) => {
            const node = this._pointMap.get(p.id);
            const comp = node.addComponentSafe(MapDrawP);
            comp.setLinks(p.links.map(id => {
                return this._pointMap.get(id);
            }))
        });
    }

    private buildLadders() {
        let ladderId = 0;
        const rooms = this._data.rooms;
        rooms.forEach((room: MapDrawDatRoom) => {
            const ladders = room.ladders;
            ladders.forEach(ladder => {
                const roomNd = this._roomNodeMap.get(ladder.roomId);
                if (!roomNd) {
                    console.log(`roomId ${ladder.roomId} not found`);
                    return;
                }
                const ladderNd = new cc.Node(`Ladder${ladderId++}`);
                ladderNd.parent = roomNd.getChildByName("unitCont");
                ladderNd.setAnchorPoint(0.5, 0);
                const worldPos = cc.v2(ladder.pos.x, ladder.pos.y);
                const localPos = ladderNd.parent.convertToNodeSpaceAR(worldPos);
                ladderNd.setPosition(localPos);
                const startNd = this._pointMap.get(ladder.bindPointIds[0])?.addComponentSafe(MapDrawP);
                const endNd = this._pointMap.get(ladder.bindPointIds[1])?.addComponentSafe(MapDrawP);
                const height = endNd.getPos().y - startNd.getPos().y;
                ladderNd.setContentSize(20, height);
                const sp = ladderNd.addComponentSafe(cc.Sprite);
                sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                sp.spriteFrame = this.defaultSp;
                ladderNd.color = cc.Color.GREEN;

                const control = ladderNd.addComponentSafe(MapDrawLadder);
                const bindPoint: cc.Node[] = ladder.bindPointIds.map(id => this._pointMap.get(id));
                control.init(ladder.roomId, bindPoint);
            })
        })
    }

    private buildDoors() {
        let doorId = 0;
        const rooms = this._data.rooms;
        rooms.forEach((room: MapDrawDatRoom) => {
            const doors = room.doors;
            doors.forEach(door => {
                const roomNd = this._roomNodeMap.get(door.roomId);
                if (!roomNd) {
                    console.log(`roomId ${door.roomId} not found`);
                    return;
                }
                const doorNd = new cc.Node(`Door${doorId++}`);
                doorNd.parent = roomNd.getChildByName("unitCont");
                doorNd.setAnchorPoint(0.5, 0);
                const worldPos = cc.v2(door.pos.x, door.pos.y);
                const localPos = doorNd.parent.convertToNodeSpaceAR(worldPos);
                doorNd.setPosition(localPos);
                doorNd.setContentSize(30, 300);
                const sp = doorNd.addComponentSafe(cc.Sprite);
                sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                sp.spriteFrame = this.defaultSp;
                doorNd.color = new cc.Color(0, 150, 255); // 蓝色

                const control = doorNd.addComponentSafe(MapDrawDoor);
                control.init(door.roomId, door.hp);
            })
        })
    }

    private buildSearchItems() {
        let nameId = 0;
        const rooms = this._data.rooms;
        rooms.forEach((room: MapDrawDatRoom) => {
            const searchItems = room.searchItemDatas;
            searchItems.forEach(item => {
                const roomNd = this._roomNodeMap.get(item.roomId);
                if (!roomNd) {
                    console.log(`roomId ${item.roomId} not found`);
                    return;
                }
                const itemNd = new cc.Node(`SearchItem${nameId++}`);
                itemNd.parent = roomNd.getChildByName("unitCont");
                itemNd.setAnchorPoint(0.5, 0.5);
                const worldPos = cc.v2(item.pos.x, item.pos.y);
                const localPos = itemNd.parent.convertToNodeSpaceAR(worldPos);
                itemNd.setPosition(localPos);
                itemNd.setContentSize(50, 50);
                const sp = itemNd.addComponentSafe(cc.Sprite);
                sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                sp.spriteFrame = this.defaultSp;
                itemNd.color = cc.Color.YELLOW;

                const control = itemNd.addComponentSafe(MapDrawSearchItem);
                control.init(item.roomId);
            })
        })
    }

    private buildEnemyRefres() {
        let nameId = 0;
        const rooms = this._data.rooms;
        const enemyRefreshDatas: MapDrawDatEnemyRefreshData[] = rooms.flatMap((room: MapDrawDatRoom) => room.enemyRefreshDatas);
        enemyRefreshDatas.forEach(refreshDat => {
            const roomNd = this._roomNodeMap.get(refreshDat.roomId);
            if (!roomNd) {
                console.log(`roomId ${refreshDat.roomId} not found`);
                return;
            }
            const itemNd = new cc.Node(`EnemyRefresh${nameId++}`);
            itemNd.parent = roomNd.getChildByName("unitCont");
            itemNd.setAnchorPoint(0.5, 0.5);
            const worldPos = cc.v2(refreshDat.pos.x, refreshDat.pos.y);
            const localPos = itemNd.parent.convertToNodeSpaceAR(worldPos);
            itemNd.setPosition(localPos);
            itemNd.setContentSize(50, 50);
            const sp = itemNd.addComponentSafe(cc.Sprite);
            sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            sp.spriteFrame = this.defaultSp;
            itemNd.color = cc.Color.BLACK;

            const control = itemNd.addComponentSafe(MapDrawEnemyRefresh);
            control.init(refreshDat.roomId, refreshDat.refreshId, refreshDat.param);

        })

    }

    private buildPortals() {
        let nameId = 0;
        const portals = this._data.portalDatas;
        portals?.forEach((portal: MapDrawDatPortal) => {
            const itemNd = new cc.Node(`Portal${nameId++}`);
            itemNd.parent = this._portalCont;
            itemNd.setAnchorPoint(0.5, 0.5);
            const worldPos = cc.v2(portal.pos.x, portal.pos.y);
            const localPos = itemNd.parent.convertToNodeSpaceAR(worldPos);
            itemNd.setPosition(localPos);
            itemNd.setContentSize(100, 50);
            const sp = itemNd.addComponentSafe(cc.Sprite);
            sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            sp.spriteFrame = this.defaultSp;
            itemNd.color = cc.Color.GREEN;

            const control = itemNd.addComponentSafe(MapDrawPortal);
            control.linkId = portal.linkId;
            console.log(`portal ${portal.linkId} offsetX ${portal.offsetX}`);
            const offsetX = portal.offsetX || 0;
            control.offsetX = offsetX;
        })
    }

    //节点结构可能变化，刷新一下最新的layer信息(父节点，或者新建节点)
    private refreshDat() {
        this._layerCont.children.forEach((layer) => {
            const roomNds = layer.children;
            roomNds.forEach((roomNd) => {
                const mapDrawRoom = roomNd.addComponentSafe(MapDrawRoom);
                mapDrawRoom.refreshDat();
            })
        })
    }


    private getJson() {
        const mapDat = new MapDrawDat();
        const size: MapDrawDatSize = {
            width: this.size.x,
            height: this.size.y,
        }

        console.log(`getJson`);
        const pathPoints: MapDrawDatPathPoint[] = [];
        this._pointMap.forEach((point) => {
            pathPoints.push(point.addComponentSafe(MapDrawP).getDat());
        })

        const rooms: MapDrawDatRoom[] = [];
        this._roomNodeMap.forEach((room) => {
            rooms.push(room.addComponentSafe(MapDrawRoom).getDat());
        })

        const portals: MapDrawDatPortal[] = [];
        this._portalCont.children.forEach((portal) => {
            portals.push(portal.addComponentSafe(MapDrawPortal).getDat());
        })

        //TODO: 玩家创建位置和出口位置
        const playerCreatePos = this._playerCreateNd.addComponentSafe(MapDrawUnitBase).getPos();
        const exitPos = this._playerExitNd.addComponentSafe(MapDrawUnitBase).getPos();

        const areaInfo: number[] = [];
        this.areaInfo.forEach(info => {
            areaInfo.push(Number(info));
        })

        mapDat.setDat(size, pathPoints, rooms, playerCreatePos, exitPos, portals, areaInfo);
        return mapDat.createJson();
    }

    public updatePointMap(pointId: string, pointNd: cc.Node) {
        if (this._pointMap.has(pointId)) return;
        this._pointMap.set(pointId, pointNd);
    }


    //数据操作

    public addRoomToLayer(roomNd: cc.Node, layer: number) {
        let layerNd = this._layerNodeMap.get(layer);
        if (!layerNd) {
            layerNd = new cc.Node(`Layer${layer}`);
            layerNd.parent = this._layerCont;
            this._layerNodeMap.set(layer, layerNd);
        }

        // 换父节点前先缓存世界坐标，避免因为 layer 自身 transform 改变导致 room 漂移
        const worldAnchor = roomNd.convertToWorldSpaceAR(cc.Vec2.ZERO);
        roomNd.parent = layerNd;
        roomNd.setPosition(layerNd.convertToNodeSpaceAR(worldAnchor));
    }

    //刷新layer的bounds
    private updateLayerBounds(layerNd: cc.Node) {
        if (!layerNd || !/^Layer\d+$/.test(layerNd.name)) return;

        const roomNds = layerNd.children;
        if (!roomNds || roomNds.length === 0) return;

        let xMin = Number.POSITIVE_INFINITY;
        let yMin = Number.POSITIVE_INFINITY;
        let xMax = Number.NEGATIVE_INFINITY;
        let yMax = Number.NEGATIVE_INFINITY;

        // 先缓存每个子节点的世界锚点位置，避免调整 layer 后子节点整体漂移
        const childWorldPosMap = new Map<cc.Node, cc.Vec2>();

        roomNds.forEach((roomNd) => {
            if (!roomNd) return;

            // 仅用 room 自身 contentSize 计算 bounds，避免 room 子节点（点/门/单位等）超出背景导致 layer 高度不一致
            const worldAnchor = roomNd.convertToWorldSpaceAR(cc.Vec2.ZERO); // room 左下角世界坐标（room anchor=0,0）
            const size = roomNd.getContentSize();
            xMin = Math.min(xMin, worldAnchor.x);
            yMin = Math.min(yMin, worldAnchor.y);
            xMax = Math.max(xMax, worldAnchor.x + size.width);
            yMax = Math.max(yMax, worldAnchor.y + size.height);

            childWorldPosMap.set(roomNd, worldAnchor);
        });

        const width = Math.max(1, xMax - xMin);
        const height = Math.max(1, yMax - yMin);

        // 让 layer 的本地原点(0,0) 对齐到 children bounds 的最小角
        layerNd.setAnchorPoint(0, 0);
        layerNd.setContentSize(width, height);
        const newLayerWorldAnchor = cc.v2(xMin, yMin);
        const newLayerLocalPos = this._layerCont.convertToNodeSpaceAR(newLayerWorldAnchor);
        layerNd.setPosition(newLayerLocalPos);

        // 把子节点本地坐标重新算回去，保证世界位置不变
        childWorldPosMap.forEach((worldAnchorPos, childNd) => {
            const newLocal = layerNd.convertToNodeSpaceAR(worldAnchorPos);
            childNd.setPosition(newLocal);
        });
    }


    public addPathPointToRoom(pData: MapDrawDatPathPoint, pointNd: cc.Node) {
        this._pointMap.set(pData.id, pointNd);
        const roomNd = this._roomNodeMap.get(pData.roomId);
        if (!roomNd) {
            console.log(`roomId ${pData.roomId} not found`);
            return;
        }
        pointNd.parent = roomNd.getChildByName("pointCont");
        const worldPos = cc.v2(pData.pos.x, pData.pos.y);
        const localPos = pointNd.parent.convertToNodeSpaceAR(worldPos);
        pointNd.setPosition(localPos);
    }

    //编辑器操作

    public clear() {
        const children = this.node.children.slice();
        children.forEach(n => n.destroy());
    }


    public saveDat() {
        this.refreshDat();
        const json = this.getJson();
        if (CC_EDITOR) {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(Editor.projectInfo.path, `${this._fileName}.json`);
            fs.writeFileSync(filePath, json, 'utf8');
            console.log('JSON 导出完成：', filePath);
        }
    }


}

declare var require: any;
