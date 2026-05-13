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
    private _spArr: cc.SpriteFrame[][] = [];
    /**
     * 
     * @param dat { areaNumber: number, oneAreaSize: cc.Vec2, areaOffset: number, sps: cc.SpriteFrame[][] }
     * areaNumber: 区域数量
     * oneAreaSize: 每个区域的大小
     * areaOffset: 区域之间的偏移量
     * sps: 背景图集
     */
    init(dat: { areaNumber: number, oneAreaSize: cc.Vec2, areaOffset: number, sps: cc.SpriteFrame[] }) {
        this._dat = dat;
        //分成二维数组
        const count = this._dat.sps.length / dat.areaNumber;
        this._spArr = Array.from(
            { length: dat.areaNumber },
            (_, i) => dat.sps.slice(i * count, (i + 1) * count)
        );
        this.setUI();
    }

    private setUI() {
        const oneSpSize = this._spArr[0][0]["_originalSize"];
        const row = this._dat.oneAreaSize.y;
        const col = this._dat.oneAreaSize.x;
        const oneAreaSize = new cc.Size(col * oneSpSize.width, row * oneSpSize.height);

        this.areaCont.getComponent(cc.Layout).spacingY = this._dat.areaOffset - oneAreaSize.height;
        NodeUtil.autoRefreshChildrenNum(this.areaCont, this._dat.areaNumber, (nd, index, dat) => {
            const bgCont = this.areaCont.children[index];
            bgCont.setContentSize(oneAreaSize);
            NodeUtil.autoRefreshChildren(bgCont, this._spArr[index], (bgNd, index, bgSprite: cc.SpriteFrame) => {
                const sp = bgNd.getComponent(cc.Sprite);
                sp.spriteFrame = bgSprite;
            });
        });
        //保证区域一的中心在原点
        this.areaCont.setPosition(this.areaCont.position.x, -oneAreaSize.height / 2);

    }

}
