import MapDrawP from "../../item/MapDrawP";
import MapDrawRoom from "../../item/MapDrawRoom";
import { MapEditorEvent } from "../../event/eventTypes";
import { EventManager } from "../../frameWork/EventManager";
import ModeBase from "./ModeBase";
import EditorSetting from "../EditorSetting";
import { ModeType } from "../../type/types";

type RoomUnlockModeDeps = {
  onChanged: () => void;
};

export default class RoomUnlockBindMode extends ModeBase {
  private _room: cc.Node = null;
  constructor(
    deactivateOthers: () => void,
    private readonly deps: RoomUnlockModeDeps,
  ) {
    super(deactivateOthers);
    this._modeType = ModeType.RoomUnlockBind;
  }

  protected onDisabled(): void {
    this.cancelPick();
  }

  public mount() {
    EventManager.instance.on(MapEditorEvent.RoomUnlockBindRoomClick, this.onRoomClick, this);
    EventManager.instance.on(MapEditorEvent.RoomUnlockBindPointClick, this.onPointClick, this);
  }

  public unmount() {
    EventManager.instance.off(MapEditorEvent.RoomUnlockBindRoomClick, this.onRoomClick, this);
    EventManager.instance.off(MapEditorEvent.RoomUnlockBindPointClick, this.onPointClick, this);
  }

  public cancelPick() {
    if (this._room && cc.isValid(this._room)) {
      this._room.getComponent(MapDrawRoom)?.setUnlockBindHighlight(false);
    }
    this._room = null;
  }

  public onRoomClick(node: cc.Node) {
    if (!this.isEnabled()) return;
    if (!node || !cc.isValid(node)) return;
    const roomCom = node.getComponent(MapDrawRoom);
    if (!roomCom) return;
    if (this._room && cc.isValid(this._room) && this._room !== node) {
      this._room.getComponent(MapDrawRoom)?.setUnlockBindHighlight(false);
    }
    if (this._room === node) {
      roomCom.setUnlockBindHighlight(false);
      this._room = null;
      return;
    }
    this._room = node;
    roomCom.setUnlockBindHighlight(true);
  }

  public onPointClick(node: cc.Node) {
    if (!this.isEnabled()) return;
    if (!node || !cc.isValid(node)) return;
    const pointCom = node.getComponent(MapDrawP);
    if (!pointCom) return;
    if (!this._room || !cc.isValid(this._room)) return;
    const roomCom = this._room.getComponent(MapDrawRoom);
    if (!roomCom) return;
    const prev = roomCom.unLockPoints || [];
    const exists = prev.indexOf(node) >= 0;
    const next = exists ? prev.filter((p) => p !== node) : prev.concat([node]);
    roomCom.setUnLockPoints(next);
    roomCom.refreshDat();
    this.deps.onChanged();
  }
}
