import EditorSetting from "../editor/EditorSetting";
import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import { UnitType } from "../type/mapTypes";
import { DragType } from "../type/types";
const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawUnitBase extends cc.Component {
    protected _roomId: number = 0;

    protected onLoad(): void {
        this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
    }


    public init(...params) {

    }


    public getType() {
        return UnitType.Default;
    }

    public getPos() {
        const pos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO).subtract(cc.Vec2.ZERO);
        return { x: pos.x, y: pos.y };
    }

    public updateRoomId(roomId: number) {
        this._roomId = roomId;
    }


    //事件操作
    private onMouseDown(event: cc.Event.EventMouse) {
        if (event.target !== this.node) return;
        event.stopPropagation();
        if (event.getButton() === cc.Event.EventMouse.BUTTON_LEFT) {
            // console.log("onMouseDown", this.node.name, event);
            const mousePos = cc.v3(event.getLocation()); // 屏幕坐标（世界UI坐标）
            const dragOffset = this.node.position.sub(
                this.node.parent.convertToNodeSpaceAR(mousePos)
            );
            const dragDat: DragType = {
                parent: this.node.parent,
                dragOffset: dragOffset,
                itemNode: this.node,
                mousePos: event.getLocation()
            }
            EventManager.instance.emit(MapEditorEvent.DragItem, dragDat);
        }
    }

    public getHoverBoxSize() {
        const size = this.node.getContentSize();
        const mapScale = EditorSetting.Instance.getMapScale();
        return { width: size.width * mapScale, height: size.height * mapScale };
    }
}
