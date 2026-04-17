export default class EditorSetting {
    private static _ins: EditorSetting;

    private _scale: number = 1;
    private _maxScale: number = 1.5;
    private _minScale: number = 0;

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
}
