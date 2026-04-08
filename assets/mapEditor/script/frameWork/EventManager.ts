// 转换自 assets/_script/EventManager.js
export class EventManager {
  private static _instance: cc.EventTarget | null = null;

  static get instance(): cc.EventTarget {
    if (!this._instance) {
      this._instance = new cc.EventTarget();
    }
    return this._instance;
  }

  static clear(): void {
    const target: any = this.instance as any;
    if (target.removeAllListeners) {
      target.removeAllListeners();
    } else if (target.removeAll) {
      target.removeAll();
    } else if (target._callbacks) {
      target._callbacks = {};
    }
  }
}

