import { MapEditorEvent } from "../../event/eventTypes";
import { EventManager } from "../../frameWork/EventManager";
import MapLoader from "../../item/MapLoader";
import { UnitType } from "../../type/mapTypes";
import { DragType } from "../../type/types";
import DynamicGetter from "../DynamicGetter/DynamicGetter";
import MapDrawItem from "../mapDrawElement/MapDrawItem";
import MapDrawItemBase from "../mapDrawElement/MapDrawItemBase";
import { ReflectionMgr } from "../ReflectionMgr";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PrefabPanelItem extends cc.Component {
    @property(cc.Node)
    selectNd: cc.Node;

    @property(cc.Sprite)
    itemSp: cc.Sprite;

    @property(cc.Label)
    itemName: cc.Label;

    @property(cc.SpriteFrame)
    defaultSprite: cc.SpriteFrame;

    @property(cc.Prefab)
    mapDrawPrefab: cc.Prefab = null;

    _type: UnitType = UnitType.Default;

    private _dat;

    protected onLoad(): void {
        this.selectNd.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
    }

    public async init(dat) {
        this._dat = dat;
        this._type = dat.ClassName as UnitType;
        this.itemName.string = dat.Name;

        if (dat.iconSize) {
            this.itemSp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            this.itemSp.node.setContentSize(dat.iconSize[0], dat.iconSize[1]);
            this.itemSp.node.scale = 1;
        }
        else {
            this.itemSp.sizeMode = cc.Sprite.SizeMode.RAW;
            this.itemSp.node.scale = dat.iconScale ?? 1;
        }

        if (dat.Texture) {
            const path = `texture/item/prefabIcon/${dat.Texture}`;
            this.itemSp.spriteFrame = await DynamicGetter.Ins.getSprite(path);
        } else {
            this.itemSp.spriteFrame = this.defaultSprite;
            const hexColor = dat.Color.replace('#', '');
            const r = parseInt(hexColor.substring(0, 2), 16);
            const g = parseInt(hexColor.substring(2, 4), 16);
            const b = parseInt(hexColor.substring(4, 6), 16);
            const a = hexColor.length === 8 ? parseInt(hexColor.substring(6, 8), 16) : 255;
            this.itemSp.node.color = new cc.Color(r, g, b, a);
        }
    }

    public getType(): UnitType {
        return this._type;
    }

    //事件操作（参考 MapDrawUnitBase 的拖拽结构）
    protected onMouseDown(event: cc.Event.EventMouse) {
        if (event.target !== this.selectNd) return;
        const scrollView = this._findScrollViewInParents(this.node);
        if (scrollView) {
            scrollView.enabled = false;
            this.scheduleOnce(() => {
                scrollView.enabled = true;
            })
        }
        event.stopPropagation();
        if (event.getButton() !== cc.Event.EventMouse.BUTTON_LEFT) return;
        // 生成一个实例，放在面板同一父节点下，交给 LevelScene.startDrag 统一接管
        const itemNd = cc.instantiate(this.mapDrawPrefab);
        itemNd.name = this._dat.Name;
        itemNd.parent = this.node.parent;
        const anchorInfo = DynamicGetter.Ins.getItemAnchor(this._type);
        itemNd.setAnchorPoint(anchorInfo[0], anchorInfo[1]);
        itemNd.setPosition(this.node.getPosition());
        itemNd.groupIndex = this._dat.cameraGroupIndex;
        const classCtor = ReflectionMgr.getMapDrawClass(this._type);
        //这直接从配置里拿出
        const uniqueType = this._dat.uniqueType ?? -1;
        const controller = itemNd.addComponentSafe(classCtor) as MapDrawItem;
        (controller as MapDrawItemBase).setDefaultUI();
        controller.init(this._type, uniqueType);

        const mousePos = cc.v3(event.getLocation()); // 世界 UI 坐标
        const dragOffset = itemNd.position.sub(
            itemNd.parent.convertToNodeSpaceAR(mousePos)
        );
        const dragDat: DragType = {
            parent: itemNd.parent,
            dragOffset: dragOffset,
            itemNode: itemNd,
            mousePos: event.getLocation()
        };
        EventManager.instance.emit(MapEditorEvent.DragItem, dragDat);
    }

    // 向上找到最近的 ScrollView 祖先节点
    private _findScrollViewInParents(node: cc.Node): cc.ScrollView | null {
        let parent = node.parent;
        while (parent) {
            const sv = parent.getComponent(cc.ScrollView);
            if (sv) return sv;
            parent = parent.parent;
        }
        return null;
    }

}
