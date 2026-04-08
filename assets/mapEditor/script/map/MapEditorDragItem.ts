import LevelScene, { MapEditorItemData, MapEditorItemType } from "./LevelScene";
import MapDrawer from "./MapDrawer";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapEditorDragItem extends cc.Component {

    @property(cc.Sprite)
    iconSp: cc.Sprite;

    @property(cc.Node)
    iconNd: cc.Node;

    @property(cc.Label)
    posLb: cc.Label;

    private _itemType: MapEditorItemType;
    private _isDrag = false;
    private _localPos: cc.Vec2 = cc.v2(0, 0);
    private _offset: cc.Vec2 = cc.v2(0, 0);
    private _dat: MapEditorItemData;

    protected onLoad(): void {
        this._offset = cc.v2(this.iconNd.getPosition().x, this.iconNd.getPosition().y);
    }

    protected update(dt: number): void {
        if (!this._isDrag) return;
        this.setPos(this._localPos);
        this.setPosLb();
    }


    setDat(dat: MapEditorItemData, worldPos: cc.Vec3) {
        if (!this.node.parent) {
            console.error("MapEditorDragItem setDat error: parent is null");
            return;
        }
        if (!dat) {
            return;
        }
        this._dat = dat;
        this._itemType = dat.itemType;
        this.iconSp.spriteFrame = MapDrawer.getIconSp(this._itemType);
        const localPos = this.node.parent.convertToNodeSpaceAR(worldPos);
        const scale = LevelScene.ins.getMapScale();
        this.iconNd.setScale(scale);
        this.setPos(cc.v2(localPos.x, localPos.y));
        this.setPosLb();
    }

    public setLocalPos(pos: cc.Vec2) {
        if (!this._isDrag) this._isDrag = true;
        this._localPos = pos;
    }

    private setPosLb() {
        const localPos = this.getMapLocalPos();
        this.posLb.string = `(${localPos.x.toFixed(1)}, ${localPos.y.toFixed(1)})`;
    }

    public destroyItem() {
        this.node.removeFromParent();
        this.node.destroy();
    }

    public getItemType() {
        return this._itemType;
    }

    //需要操作的刚好在icon上
    public setPos(pos: cc.Vec2) {
        this.node.setPosition(pos.sub(this._offset));
    }

    public getSize() {
        return this._dat.size;
    }

    public getName() {
        return this._dat.name;
    }

    public getMapLocalPos() {
        const worldPos = this.node.convertToWorldSpaceAR(this._offset);
        const pos = LevelScene.ins.getMapRoot().convertToNodeSpaceAR(worldPos);
        return pos;
    }
}
