import { MapEditorEvent } from "../../event/eventTypes";
import { EventManager } from "../../frameWork/EventManager";
import { UnitType } from "../../type/mapTypes";
import { DragType } from "../../type/types";

const { ccclass, property } = cc._decorator;

@ccclass
export default class prefabPanelBase extends cc.Component {
    /** 面板里代表的预制体（拖拽时会实例化一个临时节点） */
    @property(cc.Prefab)
    prefab: cc.Prefab = null;

    protected onLoad(): void {
        this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
    }

    public getType(): UnitType {
        return UnitType.Default;
    }

    //事件操作（参考 MapDrawUnitBase 的拖拽结构）
    protected onMouseDown(event: cc.Event.EventMouse) {
        if (event.target !== this.node) return;
        event.stopPropagation();
        if (event.getButton() !== cc.Event.EventMouse.BUTTON_LEFT) return;
        if (!this.prefab) {
            cc.warn(`PrefabPanelBase: prefab 未绑定，node=${this.node.name}`);
            return;
        }
        if (!this.node.parent) {
            cc.warn(`PrefabPanelBase: parent 为 null，node=${this.node.name}`);
            return;
        }

        // 生成一个实例，放在面板同一父节点下，交给 LevelScene.startDrag 统一接管
        const itemNd = cc.instantiate(this.prefab);
        itemNd.parent = this.node.parent;
        itemNd.setPosition(this.node.getPosition());

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
}
