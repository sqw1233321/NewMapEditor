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
        if (!enabled) {
            this._pathPointLinkStart = null;
        }
    }

    public getPathPointLinkStart(): cc.Node | null {
        return this._pathPointLinkStart;
    }

    public setPathPointLinkStart(node: cc.Node | null) {
        this._pathPointLinkStart = node;
    }

    public isLadderBindMode(): boolean {
        return this._ladderBindMode;
    }

    public setLadderBindMode(enabled: boolean) {
        this._ladderBindMode = enabled;
        if (!enabled) {
            this._ladderBindStart = null;
        }
    }

    public getLadderBindStart(): cc.Node | null {
        return this._ladderBindStart;
    }

    public setLadderBindStart(node: cc.Node | null) {
        this._ladderBindStart = node;
    }

    public isPortalBindMode(): boolean {
        return this._ladderBindMode;
    }

    public setPortalBindMode(enabled: boolean) {
        this._ladderBindMode = enabled;
        if (!enabled) {
            this._ladderBindStart = null;
        }
    }

}
