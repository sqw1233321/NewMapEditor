import EditorSetting from "../editor/EditorSetting";
import MapDrawItem from "../editor/mapDrawElement/MapDrawItem";
import { ReflectionMgr } from "../editor/ReflectionMgr";
import { ScriptSystemEvent } from "../event/scriptSystemEvent";
import { EventManager } from "../frameWork/EventManager";
import MapDrawP from "./MapDrawP";
import { MapDrawTool } from "./MapDrawTool";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawLadder extends MapDrawItem {
    private startNd: cc.Node = null;
    private endNd: cc.Node = null;

    //初始化之后执行
    protected onAfterInit() {
        // 设置高度
        const dat = this._canEditdat;
        this.startNd = MapDrawTool.instance.getPathPointById(dat.bindPointIds?.[0] ?? "");
        this.endNd = MapDrawTool.instance.getPathPointById(dat.bindPointIds?.[1] ?? "");
        if (this.endNd && this.startNd) {
            const startCom = this.startNd?.getComponent(MapDrawP);
            const endCom = this.endNd?.getComponent(MapDrawP);
            if (startCom && endCom) {
                const height = endCom.getPos().y - startCom.getPos().y;
                this.node.setContentSize(this.node.width, height);
            }
        }
    }

    //属性变化时
    protected onAttrChange() {
        // 设置高度
        const dat = this._canEditdat;
        this.startNd = MapDrawTool.instance.getPathPointById(dat.bindPointIds?.[0] ?? "");
        this.endNd = MapDrawTool.instance.getPathPointById(dat.bindPointIds?.[1] ?? "");
        if (this.endNd && this.startNd) {
            const startCom = this.startNd?.getComponent(MapDrawP);
            const endCom = this.endNd?.getComponent(MapDrawP);
            if (startCom && endCom) {
                const height = endCom.getPos().y - startCom.getPos().y;
                this.node.setContentSize(this.node.width, height);
            }
        }
    }


    //正在被拖拽
    protected onDragMove() {
        this.syncBindPointsByLadder();
    }

    //拖拽结束后
    protected onDragEnd() {
        this.syncLadderToBindPoints();
    }

    protected onUpdate() {
        this.syncLadderToBindPoints();
    }

    /** 根据梯子位置反推两个绑定点位置 */
    private syncBindPointsByLadder() {
        if (!this.node || !cc.isValid(this.node)) return;
        const h = this.node.height;
        const anchorY = this.node.anchorY ?? 0;
        const bottomLocalY = -anchorY * h;
        const topLocalY = (1 - anchorY) * h;
        const yPos = [bottomLocalY, topLocalY];
        [this.startNd, this.endNd].forEach((nd, index) => {
            if (nd && cc.isValid(nd)) {
                const worldPos = this.node.convertToWorldSpaceAR(cc.v2(0, yPos[index]));
                nd.setPosition(nd.parent.convertToNodeSpaceAR(worldPos));
                EventManager.instance.emit(ScriptSystemEvent.moveUnitToRoomByWorldPos, nd, worldPos);
                this._canEditdat[`bindPointIds`][index] = nd.getComponent(MapDrawP).getId();
            }
        });
    }

    /** 根据两个绑定点反推梯子位置和高度 */
    private syncLadderToBindPoints() {
        if (!this.node || !cc.isValid(this.node)) return;
        if (!this.startNd || !this.endNd || !cc.isValid(this.startNd) || !cc.isValid(this.endNd)) return;

        const w0 = this.startNd.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const w1 = this.endNd.convertToWorldSpaceAR(cc.Vec2.ZERO);

        const mapScale = EditorSetting.Instance.getMapScale();
        const heightWorld = Math.max(1, w1.y - w0.y);
        const heightLocal = Math.max(1, heightWorld / Math.max(0.0001, mapScale));
        const anchorY = this.node.anchorY ?? 0;
        const anchorWorld = cc.v2(w0.x, w0.y + anchorY * heightWorld);

        this.node.setPosition(this.node.parent.convertToNodeSpaceAR(anchorWorld));
        this.node.setContentSize(this.node.width, heightLocal);
    }


}

ReflectionMgr.registerClass('MapDrawLadder', MapDrawLadder);
