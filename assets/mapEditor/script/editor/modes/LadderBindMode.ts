import MapDrawLadder from "../../item/MapDrawLadder";
import MapDrawP from "../../item/MapDrawP";
import { MapEditorEvent } from "../../event/eventTypes";
import { EventManager } from "../../frameWork/EventManager";
import ModeBase from "./ModeBase";
import { ModeType } from "../../type/types";

type LadderModeDeps = {
  onChanged: () => void;
};

export default class LadderBindMode extends ModeBase {
  private _start: cc.Node = null;
  private _laddderNd: cc.Node;

  constructor(
    deactivateOthers: () => void,
    private readonly deps: LadderModeDeps,
  ) {
    super(deactivateOthers);
    this._modeType = ModeType.LadderBind;
  }

  protected onDisabled(): void {
    this.cancelPick();
  }

  public mount() {
    EventManager.instance.on(MapEditorEvent.LadderBindPointClick, this.onPointClick, this);
  }

  public unmount() {
    EventManager.instance.off(MapEditorEvent.LadderBindPointClick, this.onPointClick, this);
  }

  public cancelPick() {
    if (this._start && cc.isValid(this._start)) {
      this._start.getComponent(MapDrawP)?.setLinkHighlight(false);
    }
    this._start = null;
  }

  public setLadder(ladderNd: cc.Node) {
    this._laddderNd = ladderNd;
  }

  public onPointClick(node: cc.Node) {
    if (!this.isEnabled()) return;
    if (!node || !cc.isValid(node)) return;
    const targetPoint = node.getComponent(MapDrawP);
    if (!targetPoint) return;
    const ladderCom = this._laddderNd?.getComponent(MapDrawLadder);
    if (!ladderCom) return;
    if (!this._start || !cc.isValid(this._start)) {
      this._start = node;
      targetPoint.setLinkHighlight(true);
      return;
    }

    const startPoint = this._start.getComponent(MapDrawP);
    if (!startPoint) {
      this._start = null;
      return;
    }

    if (this._start === node) {
      startPoint.setLinkHighlight(false);
      this._start = null;
      return;
    }

    const startWorld = this._start.convertToWorldSpaceAR(cc.Vec2.ZERO);
    const endWorld = node.convertToWorldSpaceAR(cc.Vec2.ZERO);
    const bindStart = startWorld.y <= endWorld.y ? this._start : node;
    const bindEnd = bindStart === this._start ? node : this._start;
    ladderCom.setBinds([bindStart, bindEnd]);
    startPoint.setLinkHighlight(false);
    this._start = null;
    // this.deps.syncLadderToBindPoints(ladderCom);
    this.deps.onChanged();
  }
}
