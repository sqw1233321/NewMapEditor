import { EventManager } from "../frameWork/EventManager";
import { MapEditorEvent, MapEditorItemData, MapEditorItemType, MapEditorItemTypeEnum } from "./LevelScene";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapEditorPrefab extends cc.Component {

    // private selectNd: cc.Node;

    // private _dragging: boolean = false;
    // private _offset: cc.Vec2;
    // private _isSelected: boolean = false;

    // protected onLoad(): void {
    //     this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
    //     this.node.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
    //     this.node.on(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
    //     this.node.on(cc.Node.EventType.MOUSE_LEAVE, this.onMouseUp, this);
    //     EventManager.instance.on(MapEditorEvent.ClickPrefab, this.clickPrefab, this);
    //     this.selectNd = this.node.children[0];
    //     this.selectNd.active = this._isSelected;
    // }

    // protected onDestroy(): void {
    //     EventManager.instance.off(MapEditorEvent.ClickPrefab, this.clickPrefab, this);
    // }

    // private clickPrefab(type: MapEditorItemType) {
    //     this._isSelected = type == this.itemType;
    //     this.selectNd.active = this._isSelected;
    // }

    // private onMouseDown(event: cc.Event.EventMouse) {
    //     this._dragging = true;
    //     EventManager.instance.emit(MapEditorEvent.ClickPrefab, this.itemType);
    // }

    // private onMouseMove(event: cc.Event.EventMouse) {
    //     if (!this._dragging) return;
    //     if (!this._isSelected) return;
    //     const worldPos = event.getLocation();
    //     const dat: MapEditorItemData = {
    //         itemType: MapEditorItemType.PathPoint,
    //         localPos: cc.v3(this.node.convertToNodeSpaceAR(worldPos)),
    //         size: new cc.Size(100, 100),
    //         name: `newPoint:${this.node.uuid}`,
    //     }
    //     EventManager.instance.emit(MapEditorEvent.DragItem, dat, this.node.parent);
    //     this._isSelected = false;
    //     this.selectNd.active = this._isSelected;
    // }

    // private onMouseUp(event: cc.Event.EventMouse) {
    //     if (!this._dragging) return;
    //     this._dragging = false;
    // }
}

