import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import PopBase from "./PopBase";
import { PopLayerType, PopConfig, PopUid } from "./PopConfigs";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PopManager extends cc.Component {
    @property(cc.Node)
    popLayer: cc.Node = null;

    // 待处理的弹窗队列
    private _pendingQueue: { uid: PopUid, params: any[] }[] = [];

    // 已加载的弹窗缓存
    private _loadedPops: Map<PopUid, cc.Node> = new Map();

    //当前的所有pop
    private _currAllPop: {
        layer: PopLayerType,
        pop: cc.Node[]
    }[] = [];

    protected onLoad(): void {
        EventManager.instance.on(MapEditorEvent.ShowPop, this.showPopUp, this);
        EventManager.instance.on(MapEditorEvent.HidePop, this.hidePopUp, this);
    }

    protected onDestroy(): void {
        EventManager.instance.off(MapEditorEvent.ShowPop, this.showPopUp, this);
        EventManager.instance.off(MapEditorEvent.HidePop, this.hidePopUp, this);
    }

    /**
      * 打开弹窗（加入队列，不会重复打开）
      */
    private showPopUp(uid: PopUid, ...params: any[]) {
        // 已经在队列中或正在显示，直接忽略
        const isInQueue = this._pendingQueue.some(item => item.uid === uid);
        const isInShow = this.IsInCurPop(uid);
        if (isInQueue || isInShow) {
            return;
        }

        // 已经在加载缓存中，直接显示
        if (this._loadedPops.has(uid)) {
            this.showPop(uid, params);
            return;
        }

        // 加入队列等待加载
        this._pendingQueue.push({ uid, params });
    }

    /**
     * 关闭弹窗
     * @param uid 要关闭的弹窗uid，不传则关闭当前弹窗
     * @param destroy 是否销毁弹窗
     */
    public hidePopUp(uid?: PopUid) {
        const config = PopConfig[uid];
        if (!config) {
            console.log("关闭时没有找到弹窗配置", uid);
            return;
        }
        const destroy = config.destroy;
        // 关闭指定弹窗
        const pop = this._loadedPops.get(uid);
        if (pop) {
            pop.active = false;
            //维护当前弹窗
            this.deletePop(uid, pop);
            if (destroy) {
                pop.destroy();
                this._loadedPops.delete(uid);
            }
        }
        // 触发加载下一个
        this.processNextInQueue();
    }

    /**
    * 每帧检查队列，处理待加载的弹窗
    */
    protected update(dt: number): void {
        this.processNextInQueue();
    }

    private processNextInQueue(): void {
        if (this._pendingQueue.length > 0) {
            const item = this._pendingQueue.shift();
            this.loadAndShowPop(item.uid, item.params);
        }
    }

    /**
    * 加载并显示弹窗
    */
    private loadAndShowPop(uid: PopUid, params: any[]): void {
        const config = PopConfig[uid];
        if (!config) {
            console.log("没有找到弹窗配置", uid);
            return;
        }
        // 检查是否已加载
        if (this._loadedPops.has(uid)) {
            this.showPop(uid, params);
            return;
        }

        // 动态加载 prefab
        cc.loader.loadRes(config.prefab, cc.Prefab, (err, prefab) => {
            if (err) {
                console.log("加载弹窗失败", uid, err);
                return;
            }

            const popNode = cc.instantiate(prefab) as cc.Node;
            const parentNd = this.getParent(config.layer);
            popNode.parent = parentNd;
            popNode.active = false;
            popNode.getComponent(PopBase).setPopUid(uid);

            this._loadedPops.set(uid, popNode);
            this.showPop(uid, params);
        });
    }

    /**
     * 显示弹窗
     */
    private showPop(uid: PopUid, params: any[] = []): void {
        const pop = this._loadedPops.get(uid);
        if (!pop) return;

        this.registerPop(uid, pop);
        const currentPop = this.getCurPopByUid(uid);
        //当前层的最新pop
        if (currentPop) {
            const parent = this.getParentByUid(uid);
            //刷新一次层级关系
            // if (parent) {
            //     const curLayerNds = this.getAllPopByUid(uid);
            //     parent.children.forEach((popNd: cc.Node) => {
            //         const uid = popNd.getComponent(PopBase).getPopUid();
            //         const count = curLayerNds.length;
            //         const curIndex = curLayerNds.findIndex(nd => nd.getComponent(PopBase).getPopUid() === uid)
            //         popNd.setSiblingIndex(count - curIndex - 1);
            //     })
            // }
            currentPop.active = true;
            const handler = currentPop.getComponent(PopBase);
            if (handler) {
                handler.showPop(...params);
            }
        }
    }

    private getParentByUid(popUid: PopUid) {
        const cfg = PopConfig[popUid];
        if (!cfg) return;
        return this.getParent(cfg.layer);
    }

    private getParent(layer: PopLayerType) {
        switch (layer) {
            case PopLayerType.Pop:
                return this.popLayer;
            default:
                return this.popLayer;
        }
    }

    //=============维护当前弹窗队列==================
    private registerPop(popUid: PopUid, pop: cc.Node) {
        const cfg = PopConfig[popUid];
        if (!cfg) return;
        const curLayerInfo = this._currAllPop.find(item => item.layer === cfg.layer);
        if (!curLayerInfo) {
            this._currAllPop.push({
                layer: cfg.layer,
                pop: [pop]
            });
        } else {
            curLayerInfo.pop.push(pop);
        }
    }

    private deletePop(popUid: PopUid, pop: cc.Node) {
        const cfg = PopConfig[popUid];
        if (!cfg) return;
        const curLayerInfo = this._currAllPop.find(item => item.layer === cfg.layer);
        if (!curLayerInfo) {
            return;
        }
        curLayerInfo.pop = curLayerInfo.pop.filter(item => item !== pop);
        if (curLayerInfo.pop.length === 0) {
            this._currAllPop = this._currAllPop.filter(item => item.layer !== cfg.layer);
        }

    }

    private getCurPopByUid(uid: PopUid): cc.Node {
        const cfg = PopConfig[uid];
        if (!cfg) return null;
        return this.getCurPopByLayer(cfg.layer);
    }


    private getCurPopByLayer(layer: PopLayerType): cc.Node {
        const curLayerInfo = this._currAllPop.find(item => item.layer === layer);
        if (!curLayerInfo) return null;
        const popCount = curLayerInfo.pop.length;
        if (popCount === 0) return null;
        return curLayerInfo.pop[popCount - 1];
    }

    //当前uid的弹窗是否在当前显示队列中
    private IsInCurPop(uid: PopUid) {
        return this._currAllPop.some(item => item.pop.some(pop => pop.getComponent(PopBase).getPopUid() === uid));
    }

    private getAllPopByUid(uid: PopUid): cc.Node[] {
        const cfg = PopConfig[uid];
        if (!cfg) return [];
        return this.getAllPopByLayer(cfg.layer);
    }

    private getAllPopByLayer(layer: PopLayerType): cc.Node[] {
        const curLayerInfo = this._currAllPop.find(item => item.layer === layer);
        if (!curLayerInfo) return [];
        return curLayerInfo.pop;
    }
}
