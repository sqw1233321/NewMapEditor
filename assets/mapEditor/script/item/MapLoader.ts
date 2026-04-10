// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import EditorSetting from "../editor/EditorSetting";
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
    private _pointLineCont: cc.Node;
    private _pointLineDrawer: cc.Graphics;

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
        this._pointLineCont = new cc.Node("pointLineCont");
        this._pointLineCont.parent = this.node;
        this._pointLineDrawer = this._pointLineCont.addComponent(cc.Graphics);
        this._pointLineDrawer.lineWidth = 5;
        this._pointLineDrawer.strokeColor = new cc.Color(255, 220, 60, 220);
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
        this.refreshPointLinkDrawer();
    }

    private refreshPointLinkDrawer() {
        if (!this._pointLineDrawer || !cc.isValid(this._pointLineDrawer)) return;
        this._pointLineDrawer.clear();
        if (this._pointMap.size === 0) return;

        const drawn = new Set<string>();
        this._pointMap.forEach((pointNd) => {
            if (!pointNd || !cc.isValid(pointNd)) return;
            const pointCom = pointNd.getComponent(MapDrawP);
            if (!pointCom) return;
            const fromId = pointCom.getId();
            const fromWorld = pointNd.convertToWorldSpaceAR(cc.Vec2.ZERO);
            const fromLocal = this._pointLineCont.convertToNodeSpaceAR(fromWorld);
            pointCom.links?.forEach((toNd) => {
                if (!toNd || !cc.isValid(toNd)) return;
                const toCom = toNd.getComponent(MapDrawP);
                if (!toCom) return;
                const toId = toCom.getId();
                if (!fromId || !toId || fromId === toId) return;
                const edgeKey = fromId < toId ? `${fromId}->${toId}` : `${toId}->${fromId}`;
                if (drawn.has(edgeKey)) return;
                drawn.add(edgeKey);
                const toWorld = toNd.convertToWorldSpaceAR(cc.Vec2.ZERO);
                const toLocal = this._pointLineCont.convertToNodeSpaceAR(toWorld);
                this._pointLineDrawer.moveTo(fromLocal.x, fromLocal.y);
                this._pointLineDrawer.lineTo(toLocal.x, toLocal.y);
            });
        });
        this._pointLineDrawer.stroke();
    }

    update() {
        this.refreshPointLinkDrawer();
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

    /**
     * 路径边归属房间 = 两端点 roomId（cfgId）的较小值。
     * 返回世界坐标线段（无向边去重），用于悬停高亮。
     */
    public getPathLinkWorldSegmentsForRoomOwner(ownerCfgId: number): Array<{ p0: cc.Vec2; p1: cc.Vec2 }> {
        const out: Array<{ p0: cc.Vec2; p1: cc.Vec2 }> = [];
        const seen = new Set<string>();
        this._pointMap.forEach((nodeA) => {
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

    /** 悬停单个路径点时，画出其所有连边（世界坐标） */
    public getPathLinkWorldSegmentsFromPoint(pointNode: cc.Node): Array<{ p0: cc.Vec2; p1: cc.Vec2 }> {
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

    /** 新建房间时，注册到 _roomNodeMap，确保导出 getJson() 包含该房间 */
    public registerRoomNode(cfgId: number, roomNd: cc.Node) {
        if (!roomNd) return;
        this._roomNodeMap.set(cfgId, roomNd);
    }

    /** 房间 cfgId 变更时：更新 _roomNodeMap 键，避免导出重复/旧房间残留 */
    public renameRoomNode(oldCfgId: number, newCfgId: number, roomNd: cc.Node) {
        if (!roomNd) return;
        if (oldCfgId !== newCfgId) {
            this._roomNodeMap.delete(oldCfgId);
        }
        this._roomNodeMap.set(newCfgId, roomNd);
    }

    /** 外部刷新某个 Layer{n} 的 bounds（contentSize/position） */
    public refreshLayerBoundsByNode(layerNd: cc.Node) {
        this.updateLayerBounds(layerNd);
    }

    /**
     * 按层号重排路径点ID：
     * 规则：P(layer-1)_id，每个layer内id从0递增
     */
    public rebuildPointIdsByLayer() {
        if (!this._layerCont) return;
        const layerItems: Array<{ no: number; node: cc.Node }> = [];
        this._layerCont.children.forEach((layerNd) => {
            if (!layerNd || !cc.isValid(layerNd)) return;
            const m = /^Layer(\d+)$/.exec(layerNd.name || "");
            if (!m) return;
            const no = Number(m[1]);
            if (!isFinite(no)) return;
            layerItems.push({ no, node: layerNd });
        });
        layerItems.sort((a, b) => a.no - b.no);

        const nextPointMap = new Map<string, cc.Node>();
        layerItems.forEach(({ no, node: layerNd }) => {
            const layerIndex = Math.max(0, no - 1);
            let localId = 0;
            layerNd.children.forEach((roomNd) => {
                if (!roomNd || !cc.isValid(roomNd)) return;
                const roomCom = roomNd.getComponent(MapDrawRoom);
                if (!roomCom) return;
                const points = roomCom.getPoints() || [];
                points.forEach((pointCom) => {
                    if (!pointCom || !cc.isValid(pointCom.node)) return;
                    const newPid = `P${layerIndex}_${localId++}`;
                    pointCom.setId(newPid);
                    nextPointMap.set(newPid, pointCom.node);
                });
                roomCom.refreshDat();
            });
        });
        this._pointMap = nextPointMap;
    }

    /** 新增空 Layer：宽度=整图宽度，高度=默认高度；返回新建的 layer 节点 */
    public addLayer(defaultHeight: number = 320): cc.Node {
        if (!this._layerCont) return null;

        // 找到当前最大层号，新增 max+1
        let maxLayerNo = 0;
        this._layerNodeMap.forEach((_, layerNo) => {
            maxLayerNo = Math.max(maxLayerNo, layerNo);
        });
        const newLayerNo = maxLayerNo + 1;

        const layerNd = new cc.Node(`Layer${newLayerNo}`);
        layerNd.parent = this._layerCont;
        layerNd.setAnchorPoint(0, 0);
        this._layerNodeMap.set(newLayerNo, layerNd);

        // 宽度固定为整图宽度
        const jsonWidth = Number(this._data?.size?.width || 0);
        const inspectorWidth = Number(this.size?.x || 0);
        const mapWidth = jsonWidth > 0 ? jsonWidth : inspectorWidth;
        const width = Math.max(1, mapWidth);
        const height = Math.max(1, defaultHeight);
        layerNd.setContentSize(width, height);

        // 新层放在当前最高层的上方
        let maxTopY = Number.NEGATIVE_INFINITY;
        this._layerNodeMap.forEach((nd, layerNo) => {
            if (!nd || nd === layerNd || !cc.isValid(nd)) return;
            const worldAnchor = nd.convertToWorldSpaceAR(cc.Vec2.ZERO);
            const topY = worldAnchor.y + nd.getContentSize().height;
            maxTopY = Math.max(maxTopY, topY);
        });
        const targetBottomY = isFinite(maxTopY) ? maxTopY : 0;
        const mapLeftWorld = mapWidth > 0
            ? this.node.convertToWorldSpaceAR(cc.v2(-mapWidth / 2, 0)).x
            : 0;
        const layerWorldAnchor = cc.v2(mapLeftWorld, targetBottomY);
        const layerLocalPos = this._layerCont.convertToNodeSpaceAR(layerWorldAnchor);
        layerNd.setPosition(layerLocalPos);
        return layerNd;
    }

    /**
     * 拖拽房间落点不在现有 layer 上时，按 worldY 相对位置插入新 layer
     * - 会把插入位置及其上方层号顺延（LayerN -> LayerN+1）
     * - 会同步更新这些层中房间的 roomId/layer
     */
    public createLayerForRoomDrop(worldY: number, defaultHeight: number = 320): cc.Node {
        if (!this._layerCont) return null;

        const existing = Array.from(this._layerNodeMap.entries())
            .map(([no, node]) => ({ no, node }))
            .filter((it) => it.node && cc.isValid(it.node));

        // 根据当前层的底边 worldY 计算插入层号（越上层号越大）
        let insertNo = 1;
        if (existing.length > 0) {
            const byBottom = existing
                .map((it) => ({ ...it, bottomY: it.node.convertToWorldSpaceAR(cc.Vec2.ZERO).y }))
                .sort((a, b) => a.bottomY - b.bottomY);

            insertNo = byBottom.length + 1;
            for (let i = 0; i < byBottom.length; i++) {
                if (worldY < byBottom[i].bottomY) {
                    insertNo = i + 1;
                    break;
                }
            }
        }

        // 先把 >= insertNo 的层号整体上移一位（倒序避免覆盖）
        existing
            .sort((a, b) => b.no - a.no)
            .forEach(({ no, node }) => {
                if (no < insertNo) return;
                const newNo = no + 1;
                node.name = `Layer${newNo}`;
                this._layerNodeMap.delete(no);
                this._layerNodeMap.set(newNo, node);

                // 同步该层房间的 roomId/layer
                node.children.forEach((roomNd) => {
                    if (!roomNd) return;
                    const roomCom = roomNd.getComponent(MapDrawRoom);
                    if (!roomCom) return;
                    const oldId = roomCom.getId();
                    const oldMapNo = Math.floor(oldId / 100);
                    const roomNo = oldId - oldMapNo * 100 - (no - 1) * 10;
                    const newCfgId = oldMapNo * 100 + (newNo - 1) * 10 + roomNo;
                    roomCom.changeLayer(newCfgId, newNo);
                    roomCom.refreshDat();
                    this.renameRoomNode(oldId, newCfgId, roomNd);
                });
            });

        // 创建新 layer 并放到对应 y 位置
        const layerNd = new cc.Node(`Layer${insertNo}`);
        layerNd.parent = this._layerCont;
        layerNd.setAnchorPoint(0, 0);
        this._layerNodeMap.set(insertNo, layerNd);

        const jsonWidth = Number(this._data?.size?.width || 0);
        const inspectorWidth = Number(this.size?.x || 0);
        const mapWidth = jsonWidth > 0 ? jsonWidth : inspectorWidth;
        const width = Math.max(1, mapWidth);
        const height = Math.max(1, defaultHeight);
        layerNd.setContentSize(width, height);

        const mapLeftWorld = mapWidth > 0
            ? this.node.convertToWorldSpaceAR(cc.v2(-mapWidth / 2, 0)).x
            : layerNd.convertToWorldSpaceAR(cc.Vec2.ZERO).x;
        const targetBottomY = worldY - height * 0.5;
        const worldAnchor = cc.v2(mapLeftWorld, targetBottomY);
        const localPos = this._layerCont.convertToNodeSpaceAR(worldAnchor);
        layerNd.setPosition(localPos);
        this.rebuildPointIdsByLayer();
        return layerNd;
    }

    /** 删除一个房间节点（以及其下所有内容），同时维护内部 room / point 映射与 layer 大小 */
    public deleteRoom(roomNode: cc.Node) {
        if (!roomNode) return;
        const roomComp = roomNode.getComponent(MapDrawRoom);
        if (!roomComp) return;

        const cfgId = roomComp.getId();
        this._roomNodeMap.delete(cfgId);

        // 清理该房间下的路径点映射
        const pointCont = roomNode.getChildByName("pointCont");
        if (pointCont) {
            pointCont.children.forEach((pNd) => {
                const pComp = pNd.getComponent(MapDrawP);
                if (!pComp) return;
                const pid = pComp.getId();
                this._pointMap.delete(pid);
            });
        }

        const parentLayer = roomNode.parent;
        // 先从层级树摘除，再销毁；后续逻辑统一放到下一帧执行
        roomNode.removeFromParent();
        roomNode.destroy();

        if (parentLayer && cc.isValid(parentLayer)) {
            if (!cc.isValid(parentLayer)) return;
            if (parentLayer.childrenCount === 0) {
                const m = /^Layer(\d+)$/.exec(parentLayer.name || "");
                if (m) this._layerNodeMap.delete(Number(m[1]));
                parentLayer.removeFromParent();
                parentLayer.destroy();
                // layer 销毁同样是延迟生效，层级重排再延后一帧
                this.scheduleOnce(() => {
                    this.compactLayersAfterDelete();
                }, 0);
            } else {
                this.updateLayerBounds(parentLayer);
            }
        }
    }

    /** 房间移动后，清理空 Layer（childrenCount==0），并在下一帧重排层级编号 */
    public cleanupEmptyLayersAfterMove() {
        if (!this._layerCont) return;
        let hasDelete = false;
        this._layerCont.children.forEach((layerNd) => {
            if (!layerNd || !cc.isValid(layerNd)) return;
            if (!/^Layer\d+$/.test(layerNd.name || "")) return;
            if (layerNd.childrenCount > 0) return;
            const m = /^Layer(\d+)$/.exec(layerNd.name || "");
            if (m) this._layerNodeMap.delete(Number(m[1]));
            layerNd.removeFromParent();
            layerNd.destroy();
            hasDelete = true;
        });

        if (hasDelete) {
            this.scheduleOnce(() => {
                this.compactLayersAfterDelete();
            }, 0);
        }
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

    /** 删除某个 layer 后，把上层顺次下移并重建 layer 编号映射 */
    private compactLayersAfterDelete() {
        if (!this._layerCont) return;

        // 收集现有 Layer{n}
        const layerList: Array<{ no: number; node: cc.Node }> = [];
        this._layerCont.children.forEach((nd) => {
            if (!nd || !cc.isValid(nd)) return;
            const m = /^Layer(\d+)$/.exec(nd.name || "");
            if (!m) return;
            const no = Number(m[1]);
            if (isNaN(no)) return;
            layerList.push({ no, node: nd });
        });
        if (layerList.length === 0) {
            this._layerNodeMap.clear();
            return;
        }

        // 按旧层号排序，重命名为连续层号 Layer1..LayerN
        layerList.sort((a, b) => a.no - b.no);
        this._layerNodeMap.clear();
        layerList.forEach((item, idx) => {
            const newNo = idx + 1;
            item.node.name = `Layer${newNo}`;
            this._layerNodeMap.set(newNo, item.node);

            // 同步房间内 layer 字段与显示（避免导出 layer 号不一致）
            item.node.children.forEach((roomNd) => {
                if (!roomNd) return;
                const roomCom = roomNd.getComponent(MapDrawRoom);
                if (!roomCom) return;
                const oldId = roomCom.getId();
                const oldMapNo = Math.floor(oldId / 100);
                const oldRoomNo = oldId - oldMapNo * 100 - (item.no - 1) * 10;
                const newCfgId = oldMapNo * 100 + (newNo - 1) * 10 + oldRoomNo;
                const newLayer = newNo;
                roomCom.changeLayer(newCfgId, newLayer);
                roomCom.refreshDat();
                this.renameRoomNode(oldId, newCfgId, roomNd);
            });
        });

        // 重新按内容计算每个 layer 的 bounds
        this._layerNodeMap.forEach((layerNd) => {
            this.updateLayerBounds(layerNd);
        });
        this.rebuildPointIdsByLayer();
    }

    //刷新layer的bounds
    private updateLayerBounds(layerNd: cc.Node) {
        if (!layerNd || !/^Layer\d+$/.test(layerNd.name)) return;

        const roomNds = layerNd.children;
        if (!roomNds || roomNds.length === 0) return;

        let yMin = Number.POSITIVE_INFINITY;
        let yMax = Number.NEGATIVE_INFINITY;

        // 先缓存每个子节点的世界锚点位置，避免调整 layer 后子节点整体漂移
        const childWorldPosMap = new Map<cc.Node, cc.Vec2>();
        const mapScale = EditorSetting.Instance.getMapScale();
        roomNds.forEach((roomNd) => {
            if (!roomNd) return;

            // 仅用 room 自身 contentSize 计算 bounds，避免 room 子节点（点/门/单位等）超出背景导致 layer 高度不一致
            const worldAnchor = roomNd.convertToWorldSpaceAR(cc.Vec2.ZERO); // room 左下角世界坐标（room anchor=0,0）
            const size = roomNd.getContentSize();
            yMin = Math.min(yMin, worldAnchor.y);
            yMax = Math.max(yMax, worldAnchor.y + size.height * mapScale);

            childWorldPosMap.set(roomNd, worldAnchor);
        });

        // 宽度固定为整张地图宽度（不随子节点变化）
        // 取值优先级：json.size.width > inspector.size.x > 当前layer宽度（兜底）
        const jsonWidth = Number(this._data?.size?.width || 0);
        const inspectorWidth = Number(this.size?.x || 0);
        const prevWidth = Number(layerNd.getContentSize()?.width || 0);
        const mapWidth = jsonWidth > 0 ? jsonWidth : (inspectorWidth > 0 ? inspectorWidth : prevWidth);
        const width = Math.max(1, mapWidth);
        const height = Math.max(1, (yMax - yMin) / mapScale);

        // 让 layer 的本地原点(0,0) 对齐到 children bounds 的最小角
        layerNd.setAnchorPoint(0, 0);
        layerNd.setContentSize(width, height);
        // 地图坐标系以中心为原点，左边界 = -mapWidth/2（先转世界坐标，避免与 yMin 的世界坐标混用）
        const prevWorldAnchor = layerNd.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const mapLeftWorld = mapWidth > 0
            ? this.node.convertToWorldSpaceAR(cc.v2(-mapWidth / 2, 0)).x
            : prevWorldAnchor.x;
        const newLayerWorldAnchor = cc.v2(mapLeftWorld, yMin);
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
