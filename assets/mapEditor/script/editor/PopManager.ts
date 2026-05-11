// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import CreateFilePop from "./popUps/CreateFilePop";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PopManager extends cc.Component {

   @property(cc.Prefab)
    createFilePop: cc.Prefab = null;

    private _createFilePop: cc.Node = null;

    static ins:PopManager;

    protected onLoad(): void {
        PopManager.ins = this;
        this._createFilePop = cc.instantiate(this.createFilePop);
        this.node.addChild(this._createFilePop);
        this._createFilePop.active = false;
    }
    
    public showCreateFilePop(dat) {
        this._createFilePop.active = true;
        this._createFilePop.getComponent(CreateFilePop).showPop(dat);
    }

    public hideCreateFilePop() {
        this._createFilePop.active = false;
    }

}
