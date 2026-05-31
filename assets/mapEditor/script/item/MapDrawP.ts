import MapDrawItem from "../editor/mapDrawElement/MapDrawItem";
import { ReflectionMgr } from "../editor/ReflectionMgr";
import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import { ModeMgr } from "../frameWork/ModeMgr";
import { UnitType } from "../type/mapTypes";
import { ModeType } from "../type/types";


const { ccclass, property } = cc._decorator;
@ccclass
export default class MapDrawP extends MapDrawItem {
    private _nameNd: cc.Node;

    links: cc.Node[] = [];

    protected _type: UnitType.PathPoint;
    private _linkHighlight = false;
    private _savedTint: cc.Color = null;

    public getType() {
        return UnitType.PathPoint;
    }

    protected onUnitLeftMouseDownForLink(_event: cc.Event.EventMouse): boolean {
        if (ModeMgr.instance.curModeType == ModeType.PathPointLink) {
            EventManager.instance.emit(MapEditorEvent.PathPointLinkClick, this.node);
            return true;
        }
        if (ModeMgr.instance.curModeType == ModeType.LadderBind) {
            EventManager.instance.emit(MapEditorEvent.LadderBindPointClick, this.node);
            return true;
        }
        //选点模式
        if (ModeMgr.instance.curModeType == ModeType.SelectPoint) {
            EventManager.instance.emit(MapEditorEvent.SelectPointClick, this.node);
            return true;
        }
        return false;
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

    public init(type: UnitType, dat?) {
        super.init(type, dat);
        this.initUI();
    }

    private initUI() {
        if (!this._nameNd) {
            this._nameNd = new cc.Node();
            this._nameNd.name = "name";
            this.node.addChild(this._nameNd);
            this._nameNd.setPosition(cc.v3(0, 25, 0));
            this._nameNd.addComponentSafe(cc.Label).fontSize = 15;
        }
        const label = this._nameNd.getComponent(cc.Label);
        label.string = `${this._canEditdat["id"]}`;
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
        this._canEditdat["links"] = this.links;
    }

    public getId() {
        return this._canEditdat.id;
    }

    public setId(newId: string) {
        this._canEditdat.id = newId;
        this.node.name = `${newId}`;
        this.initUI();
    }

}

ReflectionMgr.registerClass('MapDrawP', MapDrawP);
