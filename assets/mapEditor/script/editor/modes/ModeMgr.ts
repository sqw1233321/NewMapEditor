import { MapEditorEvent } from "../../event/eventTypes";
import { EventManager } from "../../frameWork/EventManager";
import { ModeType } from "../../type/types";
import LadderBindMode from "./LadderBindMode";
import ModeBase from "./ModeBase";
import PathPointLinkMode from "./PathPointLinkMode";
import PortalAnimBindMode from "./PortalAnimBindMode";
import PortalBindMode from "./PortalBindMode";
import RoomUnlockBindMode from "./RoomUnlockBindMode";
import SelectPointMode from "./SelectPointMode";

const { ccclass, property } = cc._decorator;
//模式管理器
@ccclass
export default class ModeMgr {
    //模式
    private _pathPointMode: PathPointLinkMode;
    private _ladderMode: LadderBindMode;
    private _portalMode: PortalBindMode;
    private _portalAnimMode: PortalAnimBindMode;
    private _roomUnlockMode: RoomUnlockBindMode;
    private _selectPointMode: SelectPointMode;

    private _allMode: ModeBase[] = [];
    private _curMode: ModeBase;

    public init() {
        const deactivateOthers = () => {
            this.clear();
        };
        this._pathPointMode = new PathPointLinkMode(deactivateOthers, {
            onChanged: () => { },
        });
        this._ladderMode = new LadderBindMode(deactivateOthers, {
            onChanged: () => { },
        });
        this._portalMode = new PortalBindMode(deactivateOthers, {
            onChanged: () => { },
        });
        this._portalAnimMode = new PortalAnimBindMode(deactivateOthers, {
            onChanged: () => { },
        });
        this._roomUnlockMode = new RoomUnlockBindMode(deactivateOthers, {
            onChanged: () => { },
        });
        this._selectPointMode = new SelectPointMode(deactivateOthers);
        this._allMode = [this._pathPointMode, this._ladderMode, this._portalMode, this._portalAnimMode, this._roomUnlockMode, this._selectPointMode];
        this._allMode.forEach(mode => {
            mode.mount();
        })
        this.initEvents();
    }

    private initEvents() {
        EventManager.instance.on(MapEditorEvent.OpenSelectPointMode, this.onOpenSelectPointMode, this);
    }

    private onOpenSelectPointMode(ismulti, cb, selections) {
        this.enterMode(ModeType.SelectPoint, ismulti, cb, selections);
    }

    //进入模式
    public enterMode(modeType: ModeType, ...param) {
        this.clearAllMode();
        switch (modeType) {
            case ModeType.PathPointLink:
                this._pathPointMode.setEnabled(true);
                break;
            case ModeType.LadderBind:
                this._ladderMode.setEnabled(true);
                const ladderNd = param[0] as cc.Node;
                this._ladderMode.setLadder(ladderNd);
                break;
            case ModeType.PortalBind:
                this._portalMode.setEnabled(true);
                break;
            case ModeType.PortalAnimBind:
                this._portalAnimMode.setEnabled(true);
                break;
            case ModeType.RoomUnlockBind:
                this._roomUnlockMode.setEnabled(true);
                break;
            case ModeType.SelectPoint:
                const isMulti = param[0];
                this._selectPointMode.setEnabled(true);
                this._selectPointMode.setIsMulti(isMulti);
                this._selectPointMode.setChangeCb(param[1]);
                this._selectPointMode.setSelections(param[2]);
                break;
        }
        this._curMode = this._allMode.find(mode => mode.getType() == modeType);
        EventManager.instance.emit(MapEditorEvent.UpdateCurModeDisplay, modeType);
    }

    //关闭所有模式
    public clearAllMode() {
        this._allMode.forEach(mode => {
            mode.setEnabled(false);
        })
    }

    public getCurMode() {
        return this._curMode;
    }

    public getCurModeType() {
        return this._curMode?.getType();
    }

    clear() {
        this._allMode.forEach(mode => {
            mode.setEnabled(false);
        })
        this._curMode = null;
        EventManager.instance.emit(MapEditorEvent.UpdateCurModeDisplay);
    }

    destroy() {
        this._allMode.forEach(mode => {
            mode.unmount();
        })
    }


}
