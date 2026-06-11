import { MapEditorEvent } from "../../event/eventTypes";
import { EventManager } from "../../frameWork/EventManager";
import { ModeMgr } from "../../frameWork/ModeMgr";
import MapTool from "../../tool/MapTool";
import { UnitType } from "../../type/mapTypes";
import { ModeType, DragType } from "../../type/types";
import DynamicGetter from "../DynamicGetter/DynamicGetter";
import EditorSetting from "../EditorSetting";

const { ccclass, property } = cc._decorator;

//绘制item基础逻辑操作层
@ccclass
export default class MapDrawItemBase extends cc.Component {
    public itemSp: cc.Sprite = null;
    public itemSpine: sp.Skeleton;
    protected _uniqueType: number = -1;

    protected onLoad(): void {
        this.itemSp = this.node.getComponent(cc.Sprite);
        this.itemSpine = this.node.children[0]?.getComponent(sp.Skeleton);
        this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
    }

    protected update(dt: number): void {
        this.onUpdate();
    }

    public getPos() {
        const worldPos = this.node
            .convertToWorldSpaceAR(cc.Vec2.ZERO)
            .subtract(cc.Vec2.ZERO);
        const pos = MapTool.converWorldPosToMapPos(worldPos);
        // 规整浮点误差，避免导出/回填时抖动（如 99.999999 -> 100）
        const norm = (v: number) => Math.round(v * 100) / 100;
        return { x: norm(pos.x), y: norm(pos.y) };
    }

    /**
     * 左键按下时优先处理（如路径点连线模式）。
     * @returns true
     */
    protected onUnitLeftMouseDownForLink(_event: cc.Event.EventMouse): boolean {
        return false;
    }

    //事件操作
    private onMouseDown(event: cc.Event.EventMouse) {
        if (event.target !== this.node) return;
        event.stopPropagation();
        if (event.getButton() === cc.Event.EventMouse.BUTTON_LEFT) {
            if (this.onUnitLeftMouseDownForLink(event)) {
                return;
            }
            if (ModeMgr.instance.curModeType == ModeType.PathPointLink || ModeMgr.instance.curModeType == ModeType.SelectPoint) {
                return;
            }
            // console.log("onMouseDown", this.node.name, event);
            const mousePos = cc.v3(event.getLocation()); // 屏幕坐标（世界UI坐标）
            const dragOffset = this.node.position.sub(
                this.node.parent.convertToNodeSpaceAR(mousePos),
            );
            const dragDat: DragType = {
                parent: this.node.parent,
                dragOffset: dragOffset,
                itemNode: this.node,
                mousePos: event.getLocation(),
            };
            EventManager.instance.emit(MapEditorEvent.DragItem, dragDat);
        }
    }

    public getHoverBoxSize() {
        const size = this.node.getContentSize();
        const mapScale = EditorSetting.Instance.getMapScale();
        return { width: size.width * mapScale, height: size.height * mapScale };
    }

    //================渲染层==============
    //设置初始UI
    public setDefaultUI() { }

    protected async setSprite(type: UnitType, icName?: string) {
        const setting = DynamicGetter.Ins.getItemSettingByUnitType(type, this._uniqueType);
        if (!setting) return;
        let iconPath = "";
        if (!icName && !setting.Texture) {
            this.setItemSize(setting);
            const hexColor = setting.Color.replace('#', '');
            const r = parseInt(hexColor.substring(0, 2), 16);
            const g = parseInt(hexColor.substring(2, 4), 16);
            const b = parseInt(hexColor.substring(4, 6), 16);
            const a = hexColor.length === 8 ? parseInt(hexColor.substring(6, 8), 16) : 255;
            this.itemSp.node.color = new cc.Color(r, g, b, a);
            return;
        }
        if (icName) {
            iconPath = icName;
        }
        if (setting.Texture) {
            iconPath = setting.Texture;
        }
        if (!iconPath) return;
        const path = `texture/item/drawItem/${iconPath}`;
        const frame = await DynamicGetter.Ins.getSprite(path);
        if (!frame) return;
        this.itemSp.spriteFrame = frame;
        this.setItemSize(setting);
    }

    private setItemSize(setting: any) {
        if (setting.itemSize) {
            this.itemSp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            this.itemSp.node.setContentSize(setting.itemSize[0], setting.itemSize[1]);
        } else {
            this.itemSp.sizeMode = cc.Sprite.SizeMode.RAW;
            if (setting.itemScale) {
                const oldSize = this.itemSp.node.getContentSize();
                this.itemSp.node.setContentSize(oldSize.width * setting.itemScale, oldSize.height * setting.itemScale);
            }
        }
    }

    protected async setSpine(type: UnitType, spName?: string) {
        if (!this.itemSpine) return;
        const setting = DynamicGetter.Ins.getItemSettingByUnitType(type, this._uniqueType);
        if (!setting) return;
        let spineName = "";
        if (!spName && !setting.spine) return;
        if (spName) {
            spineName = spName;
        }
        if (setting.spine) {
            spineName = setting.spine;
        }
        if (!spineName) return;
        this.itemSp.enabled = false;
        const path = `texture/spine/${spineName}`;
        const spineData = await DynamicGetter.Ins.getSpineData(path);
        if (!spineData) return;
        this.itemSpine.skeletonData = spineData;
        this.itemSpine.setToSetupPose();
    }

    //=============生命周期=================

    protected onBeforeInit() { }

    protected onAfterInit() { }

    protected onAttrChange() { }

    protected onDragMove() { }

    protected onDragEnd() { }

    protected onUpdate() { }
}
