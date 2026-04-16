import MapDrawP from "../../item/MapDrawP";
import { MapEditorEvent } from "../../event/eventTypes";
import { EventManager } from "../../frameWork/EventManager";
import ModeBase from "./ModeBase";
import EditorSetting from "../EditorSetting";
import { ModeType } from "../../type/types";

type PathPointModeDeps = {
  onChanged: () => void;
};

export default class PathPointLinkMode extends ModeBase {
  private _start: cc.Node = null;
  constructor(
    deactivateOthers: () => void,
    private readonly deps: PathPointModeDeps,
  ) {
    super(deactivateOthers); 
    this._modeType = ModeType.PathPointLink;
  }

  public mount() {
    EventManager.instance.on(MapEditorEvent.PathPointLinkClick, this.onPointClick, this);
  }

  public unmount() {
    EventManager.instance.off(MapEditorEvent.PathPointLinkClick, this.onPointClick, this);
  }

  protected onDisabled(): void {
    this.clearStart();
  }

  private clearStart() {
    if (this._start && cc.isValid(this._start)) {
      this._start.getComponent(MapDrawP)?.setLinkHighlight(false);
    }
    this._start = null;
  }

  public cancelPick() {
    this.clearStart();
  }

  public onPointClick(node: cc.Node, onChanged?: () => void) {
    if (!this.isEnabled()) return;
    if (!node || !cc.isValid(node)) return;
    const target = node.getComponent(MapDrawP);
    if (!target) return;

    if (!this._start || !cc.isValid(this._start)) {
      this._start = node;
      target.setLinkHighlight(true);
      return;
    }

    const startCom = this._start.getComponent(MapDrawP);
    if (!startCom) {
      this._start = null;
      return;
    }

    if (this._start === node) {
      startCom.setLinkHighlight(false);
      this._start = null;
      return;
    }

    if (startCom.hasLinkTo(node)) {
      startCom.removeLink(node);
      target.removeLink(this._start);
    } else {
      startCom.addLink(node);
      target.addLink(this._start);
    }
    startCom.setLinkHighlight(false);
    this._start = null;
    onChanged?.();
    this.deps.onChanged();
  }
}
