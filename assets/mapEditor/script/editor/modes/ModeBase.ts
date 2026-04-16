import { ModeType } from "../../type/types";

export default abstract class ModeBase {
  protected _enabled = false;
  constructor(
    protected readonly deactivateOthers: () => void,
  ) { }

  public isEnabled() {
    return this._enabled;
  }

  protected _modeType: ModeType

  public getType() {
    return this._modeType;
  }

  public setEnabled(enabled: boolean) {
    if (this._enabled === enabled) return;
    if (enabled) {
      this.deactivateOthers();
      this._enabled = true;
      this.onEnabled();
      return;
    }
    this._enabled = false;
    this.onDisabled();
  }

  public toggle() {
    this.setEnabled(!this._enabled);
  }

  public mount() { }
  public unmount() { }

  protected onEnabled() { }
  protected onDisabled() { }
}
