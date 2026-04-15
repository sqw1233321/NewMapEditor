export default class EditorSetting extends cc.Component {
    private static _ins: EditorSetting;

    private _scale: number = 1;
    private _maxScale: number = 1.5;
    private _minScale: number = 0;

    /** 路径点连线模式：开启后点击两点建立/取消无向连接 */
    private _pathPointLinkMode = false;
    private _pathPointLinkStart: cc.Node = null;
    /** 梯子绑定模式：先点 start 再点 end */
    private _ladderBindMode = false;
    private _ladderBindStart: cc.Node = null;
    /** 传送门绑定终点模式：先选传送门，再点一个路径点 */
    private _portalBindMode = false;
    private _portalBindPortal: cc.Node = null;
    /** 房间解锁点绑定模式：先选房间，再点路径点切换解锁点 */
    private _roomUnlockBindMode = false;
    private _roomUnlockBindRoom: cc.Node = null;
    /** 传送门动画点绑定模式：先选传送门，再点路径点添加动画点 */
    private _portalAnimBindMode = false;

    static get Instance(): EditorSetting {
        if (!EditorSetting._ins) {
            EditorSetting._ins = new EditorSetting();
        }
        return EditorSetting._ins;
    }

    public setMinScale(minScale: number) {
        this._minScale = minScale;
    }

    public getMapScale(): number {
        return this._scale;
    }

    public setMapScale(scale: number) {
        this._scale = Math.max(this._minScale, Math.min(this._maxScale, scale));
    }

    public isPathPointLinkMode(): boolean {
        return this._pathPointLinkMode;
    }

    public setPathPointLinkMode(enabled: boolean) {
        this._pathPointLinkMode = enabled;
    }

    public isLadderBindMode(): boolean {
        return this._ladderBindMode;
    }

    public setLadderBindMode(enabled: boolean) {
        this._ladderBindMode = enabled;
    }

    public isPortalBindMode(): boolean {
        return this._portalBindMode;
    }

    public setPortalBindMode(enabled: boolean) {
        this._portalBindMode = enabled;
    }

    public isRoomUnlockBindMode(): boolean {
        return this._roomUnlockBindMode;
    }

    public setRoomUnlockBindMode(enabled: boolean) {
        this._roomUnlockBindMode = enabled;
    }

    public isPortalAnimBindMode(): boolean {
        return this._portalAnimBindMode;
    }

    public setPortalAnimBindMode(enabled: boolean) {
        this._portalAnimBindMode = enabled;
    }
}
