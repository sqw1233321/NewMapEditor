// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import EditorSetting from "../editor/EditorSetting";
import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import { UnitType } from "../type/mapTypes";
import { MapDrawDatPathPoint } from "./MapDrawDat";
import MapDrawUnitBase from "./MapDrawUnitBase";


const { ccclass, property } = cc._decorator;
@ccclass
export default class MapDrawP extends MapDrawUnitBase {
    @property([cc.Node])
    links: cc.Node[] = [];

    protected _type: UnitType.PathPoint;
    private _pid: string = null;
    private _pDat: MapDrawDatPathPoint = null;
    private _linkHighlight = false;
    private _savedTint: cc.Color = null;

    public getType() {
        return UnitType.PathPoint;
    }

    protected onUnitLeftMouseDownForLink(_event: cc.Event.EventMouse): boolean {
        if (!EditorSetting.Instance.isPathPointLinkMode()) return false;
        EventManager.instance.emit(MapEditorEvent.PathPointLinkClick, this.node);
        return true;
    }

    /** 连线模式：高亮当前选中的起点 */
    public setLinkHighlight(on: boolean) {
        if (on === this._linkHighlight) return;
        if (on) {
            const tintNd = this.node.getComponent(cc.Sprite) ? this.node : this.node.getChildByName("bg");
            if (!tintNd) return;
            const sp = tintNd.getComponent(cc.Sprite);
            if (sp) {
                if (this._savedTint == null) this._savedTint = sp.node.color.clone();
                sp.node.color = new cc.Color(80, 255, 160, 255);
            } else {
                if (this._savedTint == null) this._savedTint = tintNd.color.clone();
                tintNd.color = new cc.Color(80, 255, 160, 255);
            }
        } else {
            const tintNd = this.node.getComponent(cc.Sprite) ? this.node : this.node.getChildByName("bg");
            if (tintNd && this._savedTint) {
                const sp = tintNd.getComponent(cc.Sprite);
                if (sp) sp.node.color = this._savedTint;
                else tintNd.color = this._savedTint;
            }
            this._savedTint = null;
        }
        this._linkHighlight = on;
    }

    public addLink(other: cc.Node) {
        if (!other || other === this.node || !cc.isValid(other)) return;
        const next = this.links.slice();
        if (next.indexOf(other) >= 0) return;
        next.push(other);
        this.setLinks(next);
    }

    public removeLink(other: cc.Node) {
        if (!other) return;
        const next = this.links.filter((n) => n !== other);
        this.setLinks(next);
    }

    public hasLinkTo(other: cc.Node): boolean {
        return this.links.indexOf(other) >= 0;
    }

    public init(pData: MapDrawDatPathPoint) {
        this._pDat = pData;
        this._pid = pData.id;
        this._roomId = pData.roomId;
        this.initUI();
    }

    private initUI() {
        const nameNd = this.node.getChildByName("name");
        const label = nameNd.getComponent(cc.Label);
        label.string = `${this._pid}`;
    }

    public setLinks(pointNds: cc.Node[]) {
        const seen = new Set<cc.Node>();
        this.links = (pointNds || []).filter((nd) => {
            if (!nd || !cc.isValid(nd)) return false;
            if (nd === this.node) return false;
            if (seen.has(nd)) return false;
            seen.add(nd);
            return true;
        });
    }


    public getDat(): MapDrawDatPathPoint {
        const dat: MapDrawDatPathPoint = {
            id: this._pid,
            roomId: this._roomId,
            pos: this.getPos(),
            links: this.links.map((link: cc.Node) => link.getComponent(MapDrawP).getId()),
        }
        return dat;
    }

    public getId() {
        return this._pid;
    }

    public setId(newId: string) {
        this._pid = newId;
        this.node.name = `${newId}`;
        this.initUI();
    }


}
