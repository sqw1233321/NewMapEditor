import EditorSetting from "../editor/EditorSetting";
import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import MapTool from "../tool/MapTool";
import { UnitType } from "../type/mapTypes";
import { DragType } from "../type/types";
const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawUnitBase extends cc.Component {
  protected _roomId: number = 0;

  protected onLoad(): void {
    this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
  }

  public init(...params) { }

  public getType() {
    return UnitType.Default;
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

  public updateRoomId(roomId: number) {
    this._roomId = roomId;
  }

  public getRoomId(): number {
    return this._roomId;
  }

  /**
   * 左键按下时优先处理（如路径点连线模式）。
   * @returns true 表示已消费，不再发起拖拽
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

  protected getDat() {

  }
}
