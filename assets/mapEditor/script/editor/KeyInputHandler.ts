import { ModeMgr } from "../frameWork/ModeMgr";

/**
 * 键盘输入处理器
 * 负责：键盘事件监听、组合键检测
 */
export default class KeyInputHandler {
  // ==================== 回调接口 ====================

  public onShiftDown?: () => void;
  public onShiftUp?: () => void;
  public onCtrlS?: () => void;
  public onCtrlZ?: () => void;
  public onEscape?: () => void;

  // ==================== 生命周期 ====================

  /** 开始监听键盘事件 */
  public startListen() {
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
  }

  /** 停止监听键盘事件 */
  public stopListen() {
    cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
  }

  // ==================== 事件处理 ====================

  private onKeyDown(event: cc.Event.EventKeyboard) {
    const keyCode = event.keyCode;

    // Shift 键
    if (this.isShiftKey(keyCode)) {
      this._isShiftDown = true;
      this.onShiftDown?.();
      return;
    }

    // Ctrl + S 保存
    if (this.isCtrlKey(keyCode) && keyCode === cc.macro.KEY.s) {
      this.onCtrlS?.();
      return;
    }

    // Ctrl + Z 撤销
    if (this.isCtrlKey(keyCode) && keyCode === cc.macro.KEY.z) {
      this.onCtrlZ?.();
      return;
    }

    // Escape 退出当前模式
    if (keyCode === cc.macro.KEY.escape) {
      ModeMgr.instance.clear();
      this.onEscape?.();
      return;
    }
  }

  private onKeyUp(event: cc.Event.EventKeyboard) {
    if (this.isShiftKey(event.keyCode)) {
      this._isShiftDown = false;
      this.onShiftUp?.();
    }
  }

  // ==================== 辅助方法 ====================

  private _isShiftDown: boolean = false;

  /** 当前 Shift 键是否按下 */
  public get isShiftDown(): boolean {
    return this._isShiftDown;
  }

  /** 判断是否是 Shift 键 */
  private isShiftKey(keyCode: number): boolean {
    return (
      keyCode === cc.macro.KEY.shift ||
      keyCode === (cc.macro.KEY as any).left_shift ||
      keyCode === (cc.macro.KEY as any).right_shift ||
      keyCode === 16
    );
  }

  /** 判断是否是 Ctrl 键 */
  private isCtrlKey(keyCode: number): boolean {
    return (
      keyCode === cc.macro.KEY.ctrl ||
      keyCode === (cc.macro.KEY as any).left_ctrl ||
      keyCode === (cc.macro.KEY as any).right_ctrl ||
      keyCode === 17
    );
  }

  // ==================== 扩展辅助 ====================

  /** 判断是否是指定键（可扩展） */
  public isKey(keyCode: number, ...compareCodes: number[]): boolean {
    return compareCodes.includes(keyCode);
  }

  /** 判断 Ctrl/Cmd + 键 */
  public isCtrlOrCmd(keyCode: number): boolean {
    return (
      keyCode === cc.macro.KEY.ctrl ||
      keyCode === 17 ||
      keyCode === 91 ||
      keyCode === 93
    );
  }
}
