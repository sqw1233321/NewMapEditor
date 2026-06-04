// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import { PopUid } from "./PopConfigs";
import PopManager from "./PopManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PopBase extends cc.Component {
    protected popUid: PopUid;
    protected _isInit: boolean;

    public setPopUid(uid: PopUid) {
        this.popUid = uid;
    }

    public getPopUid(): PopUid {
        return this.popUid;
    }

    // 子类可重写
    public showPop(...params): void {
        this._isInit = true
    }

    //是否初始化过
    public getIsInit() {
        return this._isInit;
    }

    // 子类可重写
    public hidePop(): void {
        EventManager.instance.emit(MapEditorEvent.HidePop, this.popUid);
    }

}
