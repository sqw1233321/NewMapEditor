import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import MapDrawRoom from "../item/MapDrawRoom";
import MapDrawUnitBase from "../item/MapDrawUnitBase";
import { MapEditorMapData } from "../map/LevelMapDat";
import MapDrawer from "../map/MapDrawer";
import MapTool from "../tool/MapTool";
import { UnitType } from "../type/mapTypes";
import { attrPanelType, attrPanelTypeBase, attrPanelTypeRoom, DragType, HoverType } from "../type/types";
import EditorSetting from "./EditorSetting";
import HoverDrawer from "./HoverDrawer";
import MapLoader from "../item/MapLoader";
import { MapDrawDatRoom } from "../item/MapDrawDat";


const { ccclass, property } = cc._decorator;


@ccclass
export default class LevelScene extends cc.Component {
    @property(cc.Node)
    editorRoot: cc.Node = null;

    @property(cc.Camera)
    camera: cc.Camera = null;

    //TODO:后续动态获取
    @property(cc.JsonAsset)
    levelJson: cc.JsonAsset = null;

    @property(MapDrawer)
    mapDrawer: MapDrawer = null;

    @property(cc.Node)
    mapLoader: cc.Node;

    @property(cc.Node)
    dragLayer: cc.Node = null;

    @property(cc.Vec2)
    mapSize: cc.Vec2 = new cc.Vec2(0, 0);

    @property(cc.Node)
    itemPanelNd: cc.Node = null;

    @property(HoverDrawer)
    hoverDrawer: HoverDrawer;

    private _isRightDown: boolean = false;
    private _isLeftDown: boolean = false;
    private _mapData: MapEditorMapData;
    private _isDrag: boolean = false;
    private _dragDat: DragType = null;
    private _hoverDat: HoverType = {
        name: "",
        worldPos: cc.Vec2.ZERO,
        width: 0,
        height: 0
    }
    //拖拽时命中的房间（用于高亮）
    private _dragHoverRoomName: string = "";
    //属性面板追踪的节点(注意删除节点时的问题)
    private _trackNd: cc.Node;

    protected onLoad(): void {
        this.node.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this, true);
        this.node.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.node.on(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
        EventManager.instance.on(MapEditorEvent.DragItem, this.startDrag, this);
        EventManager.instance.on(MapEditorEvent.UpdateFromAttrPanel, this.refreshNdAttr, this);

        MapTool.init(this.mapLoader);
        this.createLevel();
    }

    protected onDestroy(): void {
        EventManager.instance.off(MapEditorEvent.DragItem, this.startDrag, this);
        EventManager.instance.off(MapEditorEvent.UpdateFromAttrPanel, this.refreshNdAttr, this);
    }

    private async createLevel() {
        await this.getLevelJson()
        this.parseLevelJson();
        this.mapDrawer.init(this._mapData);
        const graphSize = this.mapDrawer.node.getContentSize();
        const scaleX = graphSize.width / this.mapSize.x;
        const scaleY = graphSize.height / this.mapSize.y;
        EditorSetting.Instance.setMinScale(Math.max(scaleX, scaleY));
    }

    async getLevelJson() {
        const json = this.levelJson.json;
        return json;
    }

    parseLevelJson() {
        this._mapData = new MapEditorMapData(this.levelJson);
    }

    /** 根据世界坐标命中房间（后遍历优先，尽量选上层叠放时更“靠上”的房间） */
    private findRoomAtWorldPos(worldPos: cc.Vec2): MapDrawRoom | null {
        if (!this.mapLoader) return null;
        const rooms = this.mapLoader.getComponentsInChildren(MapDrawRoom);
        const wp = cc.v2(worldPos.x, worldPos.y);
        for (let i = rooms.length - 1; i >= 0; i--) {
            const room = rooms[i];
            const box = room.node.getBoundingBoxToWorld();
            if (box.contains(wp)) return room;
        }
        return null;
    }

    /** 根据世界坐标命中 layer 容器（用于拖拽房间时，鼠标不在任意房间上也能高亮整个 layer） */
    private findLayerAtWorldPos(worldPos: cc.Vec2): cc.Node | null {
        if (!this.mapLoader) return null;
        const wp = cc.v2(worldPos.x, worldPos.y);

        // mapLoader.buildBaseNd() 里会创建名为 "LayerCont" 的容器，实际的层节点命名为 "Layer{n}"
        const layerCont = this.mapLoader.getChildByName("LayerCont");
        if (!layerCont) return null;

        for (const layerNd of layerCont.children) {
            // 避免把 LayerCont 自己/其它非 Layer{n} 节点误判
            if (!layerNd || !/^Layer\d+$/.test(layerNd.name)) continue;
            const box = layerNd.getBoundingBoxToWorld();
            if (box.contains(wp)) return layerNd;
        }
        return null;
    }

    private clearDragRoomHover() {
        this._dragHoverRoomName = "";
        if (this._dragDat) {
            this._dragDat.hoverRoomId = undefined;
            this._dragDat.hoverRoomName = undefined;
            this._dragDat.hoverLayerNode = undefined;
            this._dragDat.hoverLayerName = undefined;
        }
        this.clearHoverDat();
        this.hoverDrawer?.clear();
    }

    private updateDragRoomHover(worldMousePos: cc.Vec2) {
        if (!this._dragDat) return;
        // 如果当前拖拽的是“房间”，则根据鼠标命中的 layer 容器高亮整个 layer
        const draggedRoom = this._dragDat.itemNode.getComponent(MapDrawRoom);
        if (draggedRoom) {
            // 没有命中其它房间时，也需要让 dragDat 里有当前拖拽房间的信息
            this._dragDat.hoverRoomId = draggedRoom.getId();
            this._dragDat.hoverRoomName = draggedRoom.node.name;

            const layerNd = this.findLayerAtWorldPos(worldMousePos);
            if (!layerNd) {
                this._dragDat.hoverLayerNode = undefined;
                this._dragDat.hoverLayerName = undefined;
                // 只清空 hover 框，不清空 hoverRoomId/hoverRoomName
                this._dragHoverRoomName = "";
                this.clearHoverDat();
                this.hoverDrawer?.clear();
                return;
            }
            this._dragDat.hoverLayerNode = layerNd;
            this._dragDat.hoverLayerName = layerNd.name;
            if (layerNd.name === this._dragHoverRoomName) return;
            this._dragHoverRoomName = layerNd.name;
            this._hoverDat.name = layerNd.name;
            const mapScale = EditorSetting.Instance.getMapScale();
            const size = layerNd.getContentSize();
            const offset = cc.v2(
                layerNd.anchorX * size.width * mapScale,
                layerNd.anchorY * size.height * mapScale
            );
            this._hoverDat.worldPos = layerNd
                .convertToWorldSpaceAR(cc.Vec2.ZERO)
                .clone()
                .subtract(offset);
            this._hoverDat.width = size.width * mapScale;
            this._hoverDat.height = size.height * mapScale;
            this.hoverDrawer?.draw(this._hoverDat);
            return;
        }

        // 非房间拖拽：按房间命中判断 hover 框
        this._dragDat.hoverLayerNode = undefined;
        this._dragDat.hoverLayerName = undefined;

        const room = this.findRoomAtWorldPos(worldMousePos);
        if (!room) {
            this.clearDragRoomHover();
            return;
        }

        const roomNd = room.node;
        if (roomNd.name === this._dragHoverRoomName) return;
        this._dragHoverRoomName = roomNd.name;

        this._dragDat.hoverRoomId = room.getId();
        this._dragDat.hoverRoomName = roomNd.name;

        this._hoverDat.name = roomNd.name;
        const mapScale = EditorSetting.Instance.getMapScale();
        const size = roomNd.getContentSize();
        const offset = cc.v2(
            roomNd.anchorX * size.width * mapScale,
            roomNd.anchorY * size.height * mapScale
        );
        this._hoverDat.worldPos = roomNd
            .convertToWorldSpaceAR(cc.Vec2.ZERO)
            .clone()
            .subtract(offset);
        this._hoverDat.width = size.width * mapScale;
        this._hoverDat.height = size.height * mapScale;
        this.hoverDrawer?.draw(this._hoverDat);
    }

    //操作事件
    public startDrag(dragDat: DragType) {
        if (!dragDat) {
            console.log("not has dargDat")
            return;
        }
        this._dragDat = dragDat;
        this.dragLayer.removeAllChildren();
        const itemDat = this._dragDat.itemNode;
        itemDat.parent = this.dragLayer;
        const localPos = this.dragLayer.convertToNodeSpaceAR(this._dragDat.mousePos);
        const dragOffset = this._dragDat.dragOffset;
        itemDat.setPosition(localPos.add(cc.v2(dragOffset)));
        this.clearDragRoomHover();
        //刷新属性面板
        this.refreshAttrPanel();
    }


    private onMouseWheel(event: cc.Event.EventMouse) {
        this.clearHoverDat();
        this.hoverDrawer.clear();
        const delta = event.getScrollY();
        const prescale = EditorSetting.Instance.getMapScale();
        const scale = prescale + delta * 0.001;
        this.setMapScale(scale);
    }

    private onMouseDown(event: cc.Event.EventMouse) {
        this._isDrag = false;
        if (event.getButton() === cc.Event.EventMouse.BUTTON_LEFT) {
            this._isLeftDown = true;
            this.clearHoverDat();
            this.hoverDrawer?.clear();
        }
        else if (event.getButton() === cc.Event.EventMouse.BUTTON_RIGHT) {
            this._isRightDown = true;
            this.clearHoverDat();
            this.hoverDrawer?.clear();
        }
    }



    private onMouseMove(event: cc.Event.EventMouse) {
        this._isDrag = true;
        //点击了左键
        if (this._isLeftDown) {
            if (this._dragDat) {
                const itemDat = this._dragDat.itemNode;
                const dragOffset = this._dragDat.dragOffset;
                if (itemDat && cc.isValid(itemDat)) {
                    const localPos = this.dragLayer.convertToNodeSpaceAR(event.getLocation());
                    itemDat.setPosition(localPos.add(cc.v2(dragOffset)));
                    //拖拽过程中：判断鼠标是否覆盖到某个房间或者Layer上
                    this.updateDragRoomHover(event.getLocation());
                    //刷新属性面板
                    this.refreshAttrPanel();
                }
            }
        }
        //点击了右键
        else if (this._isRightDown) {
            let delta = event.getDelta();
            this.editorRoot.x += delta.x;
            this.editorRoot.y += delta.y;
        }
        //什么都没点击,框选节点
        else {
            if (event.target instanceof cc.Node) {
                const hoverNd = event.target;
                if (hoverNd.name == this._hoverDat?.name) return;
                this._hoverDat.name = hoverNd.name;
                const controller = hoverNd.getComponent(MapDrawUnitBase);
                if (!controller) {
                    this.clearHoverDat();
                    this.hoverDrawer.clear();
                    return;
                }
                this._hoverDat.name = hoverNd.name;
                const mapScale = EditorSetting.Instance.getMapScale();
                const offset = cc.v2(hoverNd.anchorX * hoverNd.getContentSize().width * mapScale, hoverNd.anchorY * hoverNd.getContentSize().height * mapScale);
                this._hoverDat.worldPos = hoverNd.convertToWorldSpaceAR(cc.Vec2.ZERO).clone().subtract(offset);
                this._hoverDat.height = controller.getHoverBoxSize().height;
                this._hoverDat.width = controller.getHoverBoxSize().width;
                this.hoverDrawer.draw(this._hoverDat);
            }
        }
    }

    private onMouseUp(event: cc.Event.EventMouse) {
        if (event.getButton() === cc.Event.EventMouse.BUTTON_RIGHT) {
            this._isRightDown = false;
        }
        else if (event.getButton() === cc.Event.EventMouse.BUTTON_LEFT) {
            this._isLeftDown = false;
            if (this._dragDat) {
                const itemDat = this._dragDat.itemNode;
                const itemParent = this._dragDat.parent;
                const dragOffset = this._dragDat.dragOffset;
                //放回原位
                if (itemDat && cc.isValid(itemDat) && itemParent && cc.isValid(itemParent)) {
                    const draggedRoom = itemDat.getComponent(MapDrawRoom);
                    let targetParent = itemParent;
                    if (this._isDrag && draggedRoom) {
                        if (this._dragDat.hoverLayerNode && cc.isValid(this._dragDat.hoverLayerNode)) {
                            targetParent = this._dragDat.hoverLayerNode;
                        } else {
                            // 拖到非 layer 区域：按相对 y 位置先创建新 layer，再放入房间
                            const mapLoaderComp = this.mapLoader?.getComponent(MapLoader) ?? null;
                            if (mapLoaderComp) {
                                const roomWorldPos = itemDat.convertToWorldSpaceAR(cc.Vec2.ZERO);
                                const newLayer = mapLoaderComp.createLayerForRoomDrop(roomWorldPos.y);
                                if (newLayer) targetParent = newLayer;
                            }
                        }
                    }
                    if (targetParent !== itemParent) {
                        // 更换父节点（从 panel/旧 layer 到当前 layer）时，使用“世界坐标->新父节点局部坐标”定位，避免 dragOffset 失效
                        const worldPos = itemDat.convertToWorldSpaceAR(cc.Vec2.ZERO);
                        itemDat.parent = targetParent;
                        const localPos = targetParent.convertToNodeSpaceAR(worldPos);
                        itemDat.setPosition(localPos);
                    } else {
                        itemDat.parent = itemParent;
                        const localPos = itemParent.convertToNodeSpaceAR(event.getLocation());
                        itemDat.setPosition(localPos.add(cc.v2(dragOffset)));
                    }
                    // Room 只要落到某个 Layer{n} 上，就按命名规则重新计算（包括从其它 layer 拖入）
                    if (draggedRoom && targetParent && /^Layer\d+$/.test(targetParent.name)) {
                        const oldLayerMatch = /^Layer(\d+)$/.exec(itemParent.name);
                        const newLayerMatch = /^Layer(\d+)$/.exec(targetParent.name);
                        const oldLayerNo = oldLayerMatch ? Number(oldLayerMatch[1]) : null;
                        const newLayerNo = newLayerMatch ? Number(newLayerMatch[1]) : null;

                        // layer 不变时不执行切换/改名/cfgId
                        if (oldLayerNo === null || newLayerNo === null || oldLayerNo !== newLayerNo) {
                            this.syncRoomNameAndIdForLayer(draggedRoom, targetParent);
                        }

                        // 父节点发生变化（从旧 layer 到新 layer）后，需要重新计算两个 layer 的尺寸
                        const mapLoaderComp = this.mapLoader?.getComponent(MapLoader) ?? null;
                        if (mapLoaderComp) {
                            if (itemParent && /^Layer\d+$/.test(itemParent.name)) {
                                mapLoaderComp.refreshLayerBoundsByNode(itemParent);
                            }
                            if (targetParent && /^Layer\d+$/.test(targetParent.name)) {
                                mapLoaderComp.refreshLayerBoundsByNode(targetParent);
                            }
                            // 房间迁移后，旧层可能被搬空，统一清理空 layer
                            mapLoaderComp.cleanupEmptyLayersAfterMove();
                        }
                    }
                    this._dragDat = null;
                }
            }
            this.clearDragRoomHover();
        }
    }

    /** 拖拽后把 Room 落到 Layer{n}：命名规则：地图编号_layer-1_房间号 */
    private syncRoomNameAndIdForLayer(roomCom: MapDrawRoom, layerNd: cc.Node) {
        if (!roomCom || !layerNd) return;
        const layerMatch = /^Layer(\d+)$/.exec(layerNd.name);
        if (!layerMatch) return;
        const layer = Number(layerMatch[1]);
        if (!isFinite(layer)) return;

        // 地图编号：从 levelJson.name 末尾提取数字（如 Level1 => 1）
        const mapName = this.levelJson?.name ?? "";
        const mapNoMatch = /(\d+)$/.exec(mapName);
        const mapNo = mapNoMatch ? Number(mapNoMatch[1]) : 0;
        const oldCfgId = roomCom.getId();

        // 计算目标 layer 下的最大房间号（按 cfgId 推导：cfgId = mapNo*100 + (layer-1)*10 + roomNo）
        let maxRoomNo = 0;
        layerNd.children.forEach((child) => {
            if (!child) return;
            if (child === roomCom.node) return; // 排除自身（无论是否新建）
            const r = child.getComponent(MapDrawRoom);
            if (!r) return;
            const cfgId = r.getId();
            const roomNo = cfgId - mapNo * 100 - (layer - 1) * 10;
            if (roomNo > maxRoomNo) maxRoomNo = roomNo;
        });
        const newRoomNo = maxRoomNo + 1;
        const newCfgId = mapNo * 100 + (layer - 1) * 10 + newRoomNo;

        // 当前拖拽后的世界坐标/尺寸
        const worldPos = roomCom.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const size = roomCom.node.getContentSize();

        const roomDat: MapDrawDatRoom = {
            cfgId: newCfgId,
            layer: layer,
            pos: { x: worldPos.x, y: worldPos.y },
            size: { width: size.width, height: size.height },
            pathPointIds: [],
            unlockPointIds: [],
            doors: [],
            ladders: [],
            enemyRefreshDatas: [],
            enemyCreateDatas: [],
            baseItemDatas: [],
            searchItemDatas: [],
            survivorDatas: [],
        };

        // 如果是“未初始化/占位”的新房间（cfgId=0 常见），清理 prefab 里可能残留的解锁点
        if (oldCfgId === 0) {
            roomCom.unLockPoints = [];
        }

        // 保留当前 bg 颜色（初始化时会用到）
        let color = cc.Color.WHITE;
        const bgNd = roomCom.node.getChildByName("bg");
        if (bgNd) color = bgNd.color;

        // 重新 init + refresh，确保内部 roomId（给 door/ladder/点等）也同步
        roomCom.init(roomDat, color);
        roomCom.refreshDat();

        // 更新到 MapLoader（避免导出时同时存在旧 cfgId）
        const mapLoaderComp = this.mapLoader?.getComponent(MapLoader) ?? null;
        if (mapLoaderComp) {
            mapLoaderComp.renameRoomNode(oldCfgId, newCfgId, roomCom.node);
        }
    }

    //属性面板相关
    private refreshAttrPanel() {
        if (!this._dragDat) return;
        this._trackNd = this._dragDat.itemNode;
        const itemDat = this._dragDat.itemNode;
        const controller = itemDat.getComponent(MapDrawUnitBase);
        const type = controller.getType();

        //基础属性的同步
        const worldPos = this._dragDat.itemNode.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const pos = MapTool.converWorldPosToMapPos(worldPos);
        const baseDat: attrPanelTypeBase = {
            name: this._trackNd.name,
            pos: pos
        }
        const basePanelDat: attrPanelType = {
            type: UnitType.Default,
            dat: baseDat
        }
        EventManager.instance.emit(MapEditorEvent.RefreshAttrPanel, basePanelDat);
        if (type == UnitType.Default) return;

        //特殊属性的同步
        let dat: any = {};
        switch (type) {
            case UnitType.Room:
                (dat as attrPanelTypeRoom).size = this._trackNd.getContentSize();
                (dat as attrPanelTypeRoom).unLockPoints = [];
                break;
            case UnitType.PathPoint:
            case UnitType.Door:
            case UnitType.Ladder:
            case UnitType.EnemyRefresh:
            case UnitType.SearchItem:
            case UnitType.Portal:
        }
        const panelDat: attrPanelType = {
            type: type,
            dat: dat
        }
        EventManager.instance.emit(MapEditorEvent.RefreshAttrPanel, panelDat);
    }

    private refreshNdAttr(attrDat: attrPanelType) {
        if (!this._trackNd) return;
        const type = attrDat.type;
        let dat;
        switch (type) {
            case UnitType.Default:
                dat = attrDat.dat as attrPanelTypeBase;
                const worldPos = MapTool.converMapPosToWorldPos(dat.pos);
                const localPos = this._trackNd.parent.convertToNodeSpaceAR(worldPos);
                this._trackNd.setPosition(localPos);
                break;
            case UnitType.Room:
                dat = attrDat.dat as attrPanelTypeRoom;
                const size = dat.size;
                this._trackNd.getComponent(MapDrawRoom).setSize(size);
                const mapLoaderComp = this.mapLoader?.getComponent(MapLoader) ?? null;
                if (mapLoaderComp) {
                    mapLoaderComp.refreshLayerBoundsByNode(this._trackNd.parent);
                }
                break;
            case UnitType.PathPoint:
            case UnitType.Door:
            case UnitType.Ladder:
            case UnitType.EnemyRefresh:
            case UnitType.SearchItem:
            case UnitType.Portal:
        }
    }

    //删除节点
    public deleteNd(nd: cc.Node) {
        if (!this._trackNd || !cc.isValid(this._trackNd)) return;
        const type = this._trackNd.getComponent(MapDrawUnitBase).getType();
        switch (type) {
            case UnitType.Room:
                this.mapLoader.getComponent(MapLoader).deleteRoom(this._trackNd);
                break;
            case UnitType.PathPoint:
            case UnitType.Door:
            case UnitType.Ladder:
            case UnitType.EnemyRefresh:
        }
        this._trackNd = null;
        EventManager.instance.emit(MapEditorEvent.ClearEditPanel);
    }

    //增加layer
    public addLayer() {
        const loader = this.mapLoader?.getComponent(MapLoader);
        if (!loader) return;
        loader.addLayer();
    }



    //保存，导出
    public onClickSave() {
        //TODO:现在只有pathPoint
        this.mapDrawer.getPathPoints();
        this.downloadJson();
    }

    public downloadJson(filename = "mapData.json") {
        // 假设 json 是字符串
        const json = this._mapData.parseToJson(); // 已经是 JSON 字符串

        // 1️⃣ 创建 Blob
        const blob = new Blob([json], { type: "application/json" });

        // 2️⃣ 创建临时 URL
        const url = URL.createObjectURL(blob);

        // 3️⃣ 创建 a 标签并点击下载
        const a = document.createElement("a");
        a.href = url;
        a.download = filename; // 文件名
        a.click();

        // 4️⃣ 释放 URL
        URL.revokeObjectURL(url);
    }

    //设置相关
    private setMapScale(scale: number) {
        EditorSetting.Instance.setMapScale(scale);
        const realScale = EditorSetting.Instance.getMapScale();
        this.editorRoot.scale = realScale;
    }

    private clearHoverDat() {
        this._hoverDat.name = ""
    }
}
