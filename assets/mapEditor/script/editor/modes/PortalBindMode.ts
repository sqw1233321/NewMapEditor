import MapDrawP from "../../item/MapDrawP";
import MapDrawPortal from "../../item/MapDrawPortal";
import { MapEditorEvent } from "../../event/eventTypes";
import { EventManager } from "../../frameWork/EventManager";
import ModeBase from "./ModeBase";
import EditorSetting from "../EditorSetting";
import { ModeType } from "../../type/types";

type PortalModeDeps = {
  onChanged: () => void;
};

export default class PortalBindMode extends ModeBase {
  private _portal: cc.Node = null;
  constructor(
    deactivateOthers: () => void,
    private readonly deps: PortalModeDeps,
  ) {
    super(deactivateOthers);
    this._modeType = ModeType.PortalBind;
  }

  protected onDisabled(): void {
    this.cancelPick();
  }

  public mount() {
    EventManager.instance.on(MapEditorEvent.PortalBindPortalClick, this.onPortalClick, this);
    EventManager.instance.on(MapEditorEvent.PortalBindPathPointClick, this.onPointClick, this);
  }

  public unmount() {
    EventManager.instance.off(MapEditorEvent.PortalBindPortalClick, this.onPortalClick, this);
    EventManager.instance.off(MapEditorEvent.PortalBindPathPointClick, this.onPointClick, this);
  }

  public cancelPick() {
    if (this._portal && cc.isValid(this._portal)) {
      this._portal.getComponent(MapDrawPortal)?.setPortalBindHighlight(false);
    }
    this._portal = null;
  }

  public onPortalClick(node: cc.Node) {
    if (!this.isEnabled()) return;
    if (!node || !cc.isValid(node)) return;
    const portalCom = node.getComponent(MapDrawPortal);
    if (!portalCom) return;

    if (this._portal && cc.isValid(this._portal) && this._portal !== node) {
      this._portal.getComponent(MapDrawPortal)?.setPortalBindHighlight(false);
    }
    if (this._portal === node) {
      portalCom.setPortalBindHighlight(false);
      this._portal = null;
      return;
    }
    this._portal = node;
    portalCom.setPortalBindHighlight(true);
  }

  public onPointClick(node: cc.Node) {
    if (!this.isEnabled()) return;
    if (!node || !cc.isValid(node)) return;
    const pointCom = node.getComponent(MapDrawP);
    if (!pointCom) return;
    if (!this._portal || !cc.isValid(this._portal)) return;
    const portalCom = this._portal.getComponent(MapDrawPortal);
    if (!portalCom) return;
    portalCom.setLinkId(pointCom.getId());
    portalCom.setPortalBindHighlight(false);
    this._portal = null;
    this.deps.onChanged();
  }
}
