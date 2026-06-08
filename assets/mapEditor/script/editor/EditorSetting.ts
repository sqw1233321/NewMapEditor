import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";

export default class EditorSetting {
    private static _ins: EditorSetting;

    private _scale: number = 1;
    private _maxScale: number = 1.5;
    private _minScale: number = 0;
    private _autoRename = false;
    private _stageId: number = 0;

    private _isSnapY: boolean = false;

    //内部json相对路径
    static get EditorJsonPath() {
        return "jsonAsstes/editorJsonAssets/";
    }

    //外部json相对路径
    static get OuterJsonPath() {
        return "jsonAsstes/outerJsonAssets/";
    }

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

    //==============地图缩放================

    public setMinScale(minScale: number) {
        this._minScale = minScale;
    }

    public getMapScale(): number {
        return this._scale;
    }

    public setMapScale(scale: number) {
        this._scale = Math.max(this._minScale, Math.min(this._maxScale, scale));
    }

    //==============自动命名================
    public setAutoRename(auto: boolean) {
        this._autoRename = auto;
        EventManager.instance.emit(MapEditorEvent.UpdateAutoRename, auto);
    }

    public getAutoRename() {
        return this._autoRename;
    }


    //===================地图数据相关=================
    public setFileInfo(fileInfo: {
        fileName: string,
        fileJson: string
    }) {
        this._fileInfo = fileInfo;
    }

    public getFileInfo() {
        return this._fileInfo;
    }


    //======================关卡id相关=================
    public setStageId(stageId: number) {
        this._stageId = stageId;
        EventManager.instance.emit(MapEditorEvent.ChangeStage, this._stageId);
    }

    public getStageId() {
        //测试
        return 3;
        return this._stageId;
    }

    //======================是否开启Y轴吸附=================
    public setIsSnapY(isSnapY: boolean) {
        this._isSnapY = isSnapY;
    }

    public getIsSnapY() {
        return this._isSnapY;
    }

}
