export default class EditorSetting {
    private static _ins: EditorSetting;

    private _scale: number = 1;
    private _maxScale: number = 1.5;
    private _minScale: number = 0;
    private _autoRename = false;
    private _stageId: number = 0;

    // ===================当前地图数据========================
    private _fileInfo: {
        fileName: string,
        fileJson: string
    }

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

    public setAutoRename(auto: boolean) {
        this._autoRename = auto;
    }

    public getAutoRename() {
        return this._autoRename;
    }

    //设置当前地图数据
    public setFileInfo(fileInfo: {
        fileName: string,
        fileJson: string
    }) {
        this._fileInfo = fileInfo;
    }

    //获取当前房间数据
    public getFileInfo() {
        return this._fileInfo;
    }


    //======================关卡id相关=================
    public setStageId(stageId: number) {
        this._stageId = stageId;
    }

    public getStageId() {
        //测试用
        return 7;
        return this._stageId;
    }

}
