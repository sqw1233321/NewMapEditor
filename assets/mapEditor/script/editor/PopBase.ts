// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { PopUid } from "./PopConfigs";
import PopManager from "./PopManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PopBase extends cc.Component {
    protected popUid: PopUid;

    public setPopUid(uid: PopUid) {
        this.popUid = uid;
    }

    public getPopUid(): PopUid {
        return this.popUid;
    }

    // 子类可重写
    public showPop(...params): void { }

    // 子类可重写
    public hidePop(): void {
        PopManager.ins.hidePopUp(this.popUid);
    }

}
