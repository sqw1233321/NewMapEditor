// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { NodeUtil } from "../tool/NodeUtil";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapBgPrefab extends cc.Component {

    @property(cc.Node)
    areaCont: cc.Node;

    private _dat;

    /**
     * 
     * @param dat { areaNumber: number, oneAreaSize: cc.Vec2, areaOffset: number, sps: cc.SpriteFrame[][] }
     * areaNumber: 区域数量
     * oneAreaSize: 每个区域的大小
     * areaOffset: 区域之间的偏移量
     * sps: 背景图集
     */
    init(dat: { areaNumber: number, oneAreaSize: cc.Vec2, areaOffset: number, sps: cc.SpriteFrame[][] }) {
        this._dat = dat;
        this.setUI();
    }

    private setUI() {
        this.areaCont.getComponent(cc.Layout).spacingY = this._dat.areaOffset - this._dat.oneAreaSize.y;
        NodeUtil.autoRefreshChildrenNum(this.areaCont, this._dat.areaNumber, (nd, index, dat) => {
            const bgCont = this.areaCont.children[index];
            bgCont.setContentSize(this._dat.oneAreaSize.x, this._dat.oneAreaSize.y);
            NodeUtil.autoRefreshChildren(bgCont, this._dat.sps[index], (bgNd, index, bgSprite: cc.SpriteFrame) => {
                const sp = bgNd.getComponent(cc.Sprite);
                sp.spriteFrame = bgSprite;
            });
        });
        //保证区域一的中心在原点
        this.areaCont.setPosition(this.areaCont.position.x, -this._dat.oneAreaSize.y / 2);

    }

}
