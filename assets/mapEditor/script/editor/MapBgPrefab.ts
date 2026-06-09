import { NodeUtil } from "../tool/NodeUtil";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapBgPrefab extends cc.Component {

    @property(cc.Node)
    areaCont: cc.Node;

    private _dat;
    private _spArr: cc.SpriteFrame[][][] = [];
    private _size: { width: number, height: number }

    public setDefault() {
        this._size = { width: 0, height: 0 };
        this._spArr = []
        this.areaCont.children.forEach(child => {
            child.active = false;
        });
    }

    /**
     * 
     * @param dat { areaNumber: number, oneAreaSize: cc.Vec2, areaOffset: number, sps: cc.SpriteFrame[][] }
     * areaNumber: 区域数量
     * oneAreaSize: 每个区域的大小
     * areaOffset: 区域之间的偏移量
     * sps: 背景图集
     */
    init(dat: { areaNumber: number, oneAreaSize: cc.Vec2, areaOffset: number, sps: cc.SpriteFrame[][] }) {
        if (!dat) {
            this.areaCont.children.forEach(child => {
                child.active = false;
            });
            return;
        }
        this._dat = dat;
        //分成三维数组，各个区域_各个图块_各个层级的图片
        const count = this._dat.sps.length / dat.areaNumber;
        this._spArr = Array.from(
            { length: dat.areaNumber },
            (_, i) => dat.sps.slice(i * count, (i + 1) * count)
        );
        this.setSize();
        this.setUI();
    }

    private setSize() {
        const oneSpSize = this._spArr[0][0][0]["_originalSize"];
        const row = this._dat.oneAreaSize.y;
        const col = this._dat.oneAreaSize.x;
        const oneAreaSize = new cc.Size(col * oneSpSize.width, row * oneSpSize.height);
        const sizeWidth = oneAreaSize.width;
        const areaNum = this._spArr.length;
        const sizeHeight = oneAreaSize.height * areaNum + (this._dat.areaOffset - oneAreaSize.height) * (areaNum - 1);
        this._size = {
            width: sizeWidth,
            height: sizeHeight
        }
    }

    //获取size
    public getSize() {
        return this._size;
    }

    private setUI() {
        const oneSpSize = this._spArr[0][0][0]["_originalSize"];
        const row = this._dat.oneAreaSize.y;
        const col = this._dat.oneAreaSize.x;
        const oneAreaSize = new cc.Size(col * oneSpSize.width, row * oneSpSize.height);

        this.areaCont.getComponent(cc.Layout).spacingY = this._dat.areaOffset - oneAreaSize.height;
        NodeUtil.autoRefreshChildrenNum(this.areaCont, this._dat.areaNumber, (nd, index, dat) => {
            const bgCont = this.areaCont.children[index];

            //为了hover信息
            bgCont.name = `mapArea_${index + 1}`;
            bgCont.targetOff(this);
            bgCont.on(cc.Node.EventType.MOUSE_DOWN, () => { }, this);
            bgCont.setContentSize(oneAreaSize);

            const spInfos = this._spArr[index];
            NodeUtil.autoRefreshChildren(bgCont, spInfos, (bgNd, index, spInfo: cc.SpriteFrame[]) => {
                //分层级，第一层级
                const firstSp = spInfo[0];
                const sp = bgNd.getComponent(cc.Sprite);
                sp.spriteFrame = firstSp;
                //之后的层级
                const otherInfos = spInfo.slice(1);
                bgNd.children.forEach((child) => {
                    child.active = false;
                })
                NodeUtil.autoRefreshChildren(bgNd, otherInfos, (childNd, index, spFrame: cc.SpriteFrame) => {
                    const sp = childNd.getComponent(cc.Sprite);
                    sp.spriteFrame = spFrame;
                })
            });
            bgCont.getComponent(cc.Layout).updateLayout();
        });
        this.areaCont.width = this.areaCont.children[0].width;
        this.areaCont.getComponent(cc.Layout).updateLayout();
        //保证区域一的中心在原点
        this.areaCont.setPosition(this.areaCont.position.x, -oneAreaSize.height / 2);
    }

    //获取区域信息
    public getAreaInfo(layerNodeMap: Map<number, cc.Node>): string {
        let areaInfo = "";
        const cont = this.areaCont;
        if (cont.children.length <= 1) return areaInfo;
        cont.children.forEach((areaNd, index) => {
            let start = "_";
            if (!areaInfo) start = "";
            let curLayerMax = 0;
            layerNodeMap.forEach((layerNd, layerNo) => {
                //layerNd是否与areaNd相交
                const layerRect = layerNd.getBoundingBoxToWorld();
                const areaRect = areaNd.getBoundingBoxToWorld();
                if (layerRect.intersects(areaRect)) {
                    curLayerMax = Math.max(layerNo, curLayerMax);
                }
            })
            areaInfo += `${start}${curLayerMax}`;
        })
        return areaInfo;
    }

}
