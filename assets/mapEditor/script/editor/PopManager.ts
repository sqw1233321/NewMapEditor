// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import PopBase from "./PopBase";
import { PopLayerType, PopConfig, PopUid } from "./PopConfigs";
import ChangeBgPop from "./popUps/ChangeBgPop";
import CreateFilePop from "./popUps/CreateFilePop";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PopManager extends cc.Component {
    @property(cc.Node)
    popLayer: cc.Node = null;

    static ins: PopManager;

    // 待处理的弹窗队列
    private _pendingQueue: { uid: PopUid, params: any[] }[] = [];

    // 已加载的弹窗缓存
    private _loadedPops: Map<PopUid, cc.Node> = new Map();

    // 当前正在显示的弹窗
    private _currentPop: cc.Node = null;

    protected onLoad(): void {
        PopManager.ins = this;
    }

    /**
      * 打开弹窗（加入队列，不会重复打开）
      */
    public showPopUp(uid: PopUid, ...params: any[]) {
        // 已经在队列中或正在显示，直接忽略
        if (this._pendingQueue.some(item => item.uid === uid) ||
            (this._currentPop && this._loadedPops.get(uid) === this._currentPop)) {
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
            if (destroy) {
                pop.destroy();
                this._loadedPops.delete(uid);
            }
            //维护当前弹窗字段
            const curUid = this._currentPop.getComponent(PopBase).getPopUid();
            if (curUid === uid) {
                this._currentPop = null;
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

        this._currentPop = pop;
        this._currentPop.active = true;

        // 调用弹窗的 showPop 方法
        const popComponent = this._currentPop.getComponent("BasePop");
        if (popComponent && typeof popComponent.showPop === "function") {
            popComponent.showPop(...params);
        }
    }

    private getParent(layer: PopLayerType) {
        switch (layer) {
            case PopLayerType.Pop:
                return this.popLayer;
            default:
                return this.popLayer;
        }
    }
}
