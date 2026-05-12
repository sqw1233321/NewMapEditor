// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import ChangeBgPop from "./popUps/ChangeBgPop";
import CreateFilePop from "./popUps/CreateFilePop";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PopManager extends cc.Component {

    @property(cc.Prefab)
    createFilePop: cc.Prefab = null;

    @property(cc.Prefab)
    changeBgPop: cc.Prefab = null;

    private _createFilePop: cc.Node = null;
    private _changeBgPop: cc.Node = null;

    static ins: PopManager;

    protected onLoad(): void {
        PopManager.ins = this;
        this._createFilePop = cc.instantiate(this.createFilePop);
        this.node.addChild(this._createFilePop);
        this._createFilePop.active = false;
        this._changeBgPop = cc.instantiate(this.changeBgPop);
        this.node.addChild(this._changeBgPop);
        this._changeBgPop.active = false;
    }

    public showCreateFilePop(dat) {
        this._createFilePop.active = true;
        this._createFilePop.getComponent(CreateFilePop).showPop(dat);
    }

    public hideCreateFilePop() {
        this._createFilePop.active = false;
    }

    public showChangeBgPop(dat) {
        this._changeBgPop.active = true;
        this._changeBgPop.getComponent(ChangeBgPop).showPop(dat);
    }

    public hideChangeBgPop() {
        this._changeBgPop.active = false;
    }
}
