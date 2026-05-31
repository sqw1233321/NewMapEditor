import MapDrawP from "../../item/MapDrawP";
import { MapEditorEvent } from "../../event/eventTypes";
import { EventManager } from "../../frameWork/EventManager";
import ModeBase from "./ModeBase";
import { ModeType } from "../../type/types";
import { MapDrawTool } from "../../item/MapDrawTool";


/** 单选/多选路径点的通用回调模式 */
export default class SelectPointMode extends ModeBase {
  private _selections: string[] = [];
  /** true = 多选，false = 单选 */
  private _multiSelect: boolean;

  private _cb;

  constructor(
    deactivateOthers: () => void,
  ) {
    super(deactivateOthers);
    this._modeType = ModeType.SelectPoint;
  }

  public mount() {
    EventManager.instance.on(MapEditorEvent.SelectPointClick, this.onPointClick, this);
  }

  public unmount() {
    EventManager.instance.off(MapEditorEvent.SelectPointClick, this.onPointClick, this);
  }

  protected onDisabled(): void {
    this.clearAll();
  }

  public cancelPick() {
    this.clearAll();
  }

  public setIsMulti(isMulti: boolean) {
    this._multiSelect = isMulti;
  }

  public setChangeCb(cb) {
    this._cb = cb;
  }

  public setSelections(selections: string[]) {
    this._selections = selections;
    this._selections.forEach(n => {
      MapDrawTool.instance.getPathPointById(n);
      const pointNd = MapDrawTool.instance.getPathPointById(n);
      if (cc.isValid(pointNd)) pointNd.getComponent(MapDrawP)?.setLinkHighlight(true);
    })
  }

  public getSelections(): cc.Node[] {
    const pointNds = this._selections.map(n => MapDrawTool.instance.getPathPointById(n));
    return pointNds.filter((n) => cc.isValid(n));
  }

  private clearAll() {
    this._selections.forEach((n) => {
      const pointNd = MapDrawTool.instance.getPathPointById(n);
      if (cc.isValid(pointNd)) pointNd.getComponent(MapDrawP)?.setLinkHighlight(false);
    });
    this._selections = [];
  }

  private onPointClick(node: cc.Node) {
    if (!this.isEnabled()) return;
    if (!node || !cc.isValid(node)) return;
    const target = node.getComponent(MapDrawP);
    if (!target) return;

    if (!this._multiSelect) {
      const select = MapDrawTool.instance.getPathPointById(this._selections[0]);
      if (this._selections.length > 0 && select !== node) {
        select.getComponent(MapDrawP)?.setLinkHighlight(false);
      }
      if (this._selections.length > 0 && select === node) {
        this._selections = [];
        this._cb?.([]);
        target.setLinkHighlight(false);
        return;
      }
      this._selections = [node.getComponent(MapDrawP).getId()];
      target.setLinkHighlight(true);
      this._cb?.(this._selections);
      return;
    }
    const idx = this._selections.indexOf(node.getComponent(MapDrawP).getId());
    if (idx >= 0) {
      this._selections.splice(idx, 1);
      target.setLinkHighlight(false);
    } else {
      this._selections.push(node.getComponent(MapDrawP).getId());
      target.setLinkHighlight(true);
    }
    this._cb?.(this._selections);
  }
}
