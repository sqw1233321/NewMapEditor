import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import MapLoader from "../item/MapLoader";
import MapDrawRoom from "../item/MapDrawRoom";
import MapDrawUnitBase from "../item/MapDrawUnitBase";
import { MapEditorMapData } from "../map/LevelMapDat";
import MapDrawer from "../map/MapDrawer";
import MapTool from "../tool/MapTool";
import { UnitType } from "../type/mapTypes";
import { attrPanelType, attrPanelTypeBase, attrPanelTypeRoom, DragType, HoverType } from "../type/types";
import EditorSetting from "./EditorSetting";
import HoverDrawer from "./HoverDrawer";


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
    private _dragDat: DragType = null;
    private _hoverDat: HoverType = {
        name: "",
        worldPos: cc.Vec2.ZERO,
        width: 0,
        height: 0
    }
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
            if (box.contains(wp)) {
                return room;
            }
        }
        return null;
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
        //点击了左键
        if (this._isLeftDown) {
            if (this._dragDat) {
                const itemDat = this._dragDat.itemNode;
                const dragOffset = this._dragDat.dragOffset;
                if (itemDat && cc.isValid(itemDat)) {
                    const localPos = this.dragLayer.convertToNodeSpaceAR(event.getLocation());
                    itemDat.setPosition(localPos.add(cc.v2(dragOffset)));
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
                const fromPalette = this._dragDat.fromPalette;
                const paletteUnitType = this._dragDat.paletteUnitType;
                const paletteHomeLocalPos = this._dragDat.paletteHomeLocalPos;

                if (fromPalette) {
                    const worldPos = itemDat.convertToWorldSpaceAR(cc.Vec2.ZERO);
                    const room = this.findRoomAtWorldPos(worldPos);
                    if (
                        MapLoader.ins &&
                        room &&
                        (paletteUnitType === UnitType.PathPoint || paletteUnitType === UnitType.SearchItem)
                    ) {
                        if (paletteUnitType === UnitType.PathPoint) {
                            MapLoader.ins.spawnPathPointInRoom(room, worldPos);
                        } else {
                            MapLoader.ins.spawnSearchItemInRoom(room, worldPos);
                        }
                    }
                    if (itemDat && cc.isValid(itemDat) && itemParent && cc.isValid(itemParent)) {
                        itemDat.parent = itemParent;
                        if (paletteHomeLocalPos) {
                            itemDat.setPosition(paletteHomeLocalPos);
                        } else {
                            const localPos = itemParent.convertToNodeSpaceAR(event.getLocation());
                            itemDat.setPosition(localPos.add(cc.v2(dragOffset)));
                        }
                    }
                    this._dragDat = null;
                    return;
                }

                // 地图内已有节点：拖放回原父节点
                if (itemDat && cc.isValid(itemDat) && itemParent && cc.isValid(itemParent)) {
                    itemDat.parent = itemParent;
                    const localPos = itemParent.convertToNodeSpaceAR(event.getLocation());
                    itemDat.setPosition(localPos.add(cc.v2(dragOffset)));
                    this._dragDat = null;
                }
            }
        }
    }

    //属性面板相关
    private refreshAttrPanel() {
        if (!this._dragDat) return;
        this._trackNd = this._dragDat.itemNode;
        const itemDat = this._dragDat.itemNode;
        const controller = itemDat.getComponent(MapDrawUnitBase);
        if (!controller) return;
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
        let dat = {};
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
                break;
            case UnitType.PathPoint:
            case UnitType.Door:
            case UnitType.Ladder:
            case UnitType.EnemyRefresh:
            case UnitType.SearchItem:
            case UnitType.Portal:
        }
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
