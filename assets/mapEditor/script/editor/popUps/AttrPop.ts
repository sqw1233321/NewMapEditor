// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { NodeUtil } from "../../tool/NodeUtil";
import PopBase from "../PopBase";
import PopManager from "../PopManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrPop extends PopBase {
    @property(cc.Label)
    titleLb: cc.Label;

    @property(cc.Node)
    attrsLayout: cc.Node;

    private _dat;

    public showPop(...params): void {
        super.showPop();
        this._dat = params;
        this.setUI();
    }

    private setUI() {
        const titleStr = this._dat[0] as string;
        //属性格式
        const property = this._dat[1];
        //当前属性值
        const curDat = this._dat[2];
        this.titleLb.string = titleStr;
        NodeUtil.autoRefreshChildren(this.attrsLayout, curDat, (nd, index, dat) => {
            const descLb = nd.children[0].getComponent(cc.Label);
            descLb.string = property[index].Name;
            const editController = nd.children[1].getComponent(cc.EditBox);
            editController.string = dat as string;
        })
    }


    private onClickAddAttr() {

    }

    private onClickDeleteAttr() {

    }

    public getDat(){
        //转化为字符串
        const str = "115_5&120_10&122_2";
        return str;
    }


    //保存数据
    public onClickSave() {
        this.hidePop();
    }
}
