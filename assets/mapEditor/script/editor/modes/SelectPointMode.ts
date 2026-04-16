import MapDrawP from "../../item/MapDrawP";
import { MapEditorEvent } from "../../event/eventTypes";
import { EventManager } from "../../frameWork/EventManager";
import ModeBase from "./ModeBase";
import EditorSetting from "../EditorSetting";
import { ModeType } from "../../type/types";

export type SelectPointCallback = (selectedNodes: cc.Node[]) => void;

/** 单选/多选路径点的通用回调模式 */
export default class SelectPointMode extends ModeBase {
  private _selections: cc.Node[] = [];
  /** true = 多选，false = 单选 */
  private _multiSelect: boolean;
  constructor(
    deactivateOthers: () => void,
    private readonly deps: {
      /** 选择变化时回调，传入当前选中的节点列表 */
      onSelectionChanged: SelectPointCallback;
    },
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

  public getSelections(): cc.Node[] {
    return this._selections.filter((n) => cc.isValid(n));
  }

  private clearAll() {
    this._selections.forEach((n) => {
      if (cc.isValid(n)) n.getComponent(MapDrawP)?.setLinkHighlight(false);
    });
    this._selections = [];
  }

  private onPointClick(node: cc.Node) {
    if (!this.isEnabled()) return;
    if (!node || !cc.isValid(node)) return;
    const target = node.getComponent(MapDrawP);
    if (!target) return;

    if (!this._multiSelect) {
      if (this._selections.length > 0 && this._selections[0] !== node) {
        this._selections[0].getComponent(MapDrawP)?.setLinkHighlight(false);
      }
      if (this._selections.length > 0 && this._selections[0] === node) {
        this._selections = [];
        this.deps.onSelectionChanged([]);
        return;
      }
      this._selections = [node];
      target.setLinkHighlight(true);
      this.deps.onSelectionChanged([node]);
      return;
    }

    const idx = this._selections.indexOf(node);
    if (idx >= 0) {
      this._selections.splice(idx, 1);
      target.setLinkHighlight(false);
    } else {
      this._selections.push(node);
      target.setLinkHighlight(true);
    }
    this.deps.onSelectionChanged([...this._selections]);
  }
}
