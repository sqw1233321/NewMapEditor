import ModeBase from "../editor/modes/ModeBase";
import PathPointLinkMode from "../editor/modes/PathPointLinkMode";
import SelectPointMode from "../editor/modes/SelectPointMode";
import { MapEditorEvent } from "../event/eventTypes";
import { ModeType } from "../type/types";
import { AttrMgr } from "./AttrMgr";
import { EventManager } from "./EventManager";
import { Singleton } from "./Singleton";


export class ModeMgr extends Singleton<ModeMgr> {
    //模式
    private _pathPointMode: PathPointLinkMode;
    private _selectPointMode: SelectPointMode;

    private _allMode: ModeBase[] = [];
    private _curMode: ModeBase;

    public static get instance(): ModeMgr {
        return super.instance as ModeMgr;
    }

    protected onInit() {
        const deactivateOthers = () => {
            this.clear();
        };
        this._pathPointMode = new PathPointLinkMode(deactivateOthers, {
            onChanged: () => { AttrMgr.instance.refreshAttrPanel(); },
        });

        this._selectPointMode = new SelectPointMode(deactivateOthers);
        this._allMode = [this._pathPointMode, this._selectPointMode];
        this._allMode.forEach(mode => {
            mode.mount();
        })
        EventManager.instance.on(MapEditorEvent.OpenSelectPointMode, this.onOpenSelectPointMode, this);
    }

    protected onDestroy(): void {
        this._allMode.forEach(mode => {
            mode.unmount();
        })
        EventManager.instance.off(MapEditorEvent.OpenSelectPointMode, this.onOpenSelectPointMode, this);
    }


    private onOpenSelectPointMode(ismulti, cb, selections) {
        this.enterMode(ModeType.SelectPoint, ismulti, cb, selections);
    }

    //进入模式
    public enterMode(modeType: ModeType, ...param) {
        this._allMode.forEach(mode => {
            mode.setEnabled(false);
        })
        switch (modeType) {
            case ModeType.PathPointLink:
                this._pathPointMode.setEnabled(true);
                this._pathPointMode.setCancelCb(param[0]);
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

    public get curMode() {
        return this._curMode;
    }

    public get curModeType() {
        return this._curMode?.getType();
    }

    clear() {
        this._allMode.forEach(mode => {
            mode.setEnabled(false);
        })
        this._curMode = null;
        EventManager.instance.emit(MapEditorEvent.UpdateCurModeDisplay);
    }
}
