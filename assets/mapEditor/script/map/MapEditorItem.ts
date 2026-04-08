import { EventManager } from "../frameWork/EventManager";
import { MapEditorEvent, MapEditorItemData, MapEditorItemType } from "./LevelScene";
import MapDrawer from "./MapDrawer";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapEditorItem extends cc.Component {

    private _isSelected: boolean = false;
    private _itemType: MapEditorItemType;

    @property(cc.Node)
    private iconNd: cc.Node = null;

    @property(cc.Node)
    private selectNd: cc.Node = null;

    private _dragging: boolean = false;
    private _dat: MapEditorItemData;

    protected onLoad(): void {
        this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.node.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.node.on(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
        EventManager.instance.on(MapEditorEvent.ClickMapItem, this.onClickMapItem, this);
    }

    protected onDestroy(): void {
        EventManager.instance.off(MapEditorEvent.ClickMapItem, this.onClickMapItem, this);
    }

    setDat(dat: MapEditorItemData) {
        if (!this.node.parent) {
            console.log("MapEditorItem setDat error: parent is null");
            return;
        }
        this._dat = dat;
        if (!dat) {
            return;
        }
        this._itemType = dat.itemType;
        this.iconNd.getComponent(cc.Sprite).spriteFrame = MapDrawer.getIconSp(this._itemType);
        // const scale = LevelScene.ins.getMapScale();
        // this.iconNd.setScale(scale);
        this.node.setPosition(dat.localPos);
        if (this._itemType === MapEditorItemType.PathPoint) this.setName(dat.name);
    }

    getDat(): MapEditorItemData {
        const dat: MapEditorItemData = {
            itemType: this._itemType,
            localPos: cc.v3(this.node.getPosition()),
            size: this.node.getContentSize(),
            name: this._dat.name,
        }
        return dat;
    }

    protected setName(...param) {

    }

    public onClickMapItem(uuid: string) {
        this._isSelected = uuid === this.node.uuid;
        this.selectNd.active = this._isSelected;
    }

    private onMouseDown(event: cc.Event.EventMouse) {
        this._dragging = true;
        EventManager.instance.emit(MapEditorEvent.ClickMapItem, this.node.uuid);
        EventManager.instance.emit(MapEditorEvent.OpenController, this.getDat());
    }

    private onMouseMove(event: cc.Event.EventMouse) {
        if (!this._dragging) return;
        if (!this._isSelected) return;
        EventManager.instance.emit(MapEditorEvent.DragItem, this.getDat(), this.node.parent);
        this.destroyItem();
    }

    private onMouseUp(event: cc.Event.EventMouse) {
        if (!this._dragging) return;
        this._dragging = false;
    }

    public destroyItem() {
        this.node.removeFromParent();
        this.node.destroy();
    }

    public getMapEditorDat() {
        return this.getDat();
    }
}

