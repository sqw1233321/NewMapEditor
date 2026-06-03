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
    private _id: string;
    links: cc.Node[] = [];

    protected _type: UnitType.PathPoint;
    private _linkHighlight = false;
    private _savedTint: cc.Color = null;

    private _canNotEditKeys = [
        "id"
    ];

    static getUniqueType(dat): number {
        return -1;
    }

    public init(type: UnitType, uniqueType: number = -1, dat?) {
        let canEditDat = dat;
        //筛选可编辑属性
        if (dat) canEditDat = this.filterAttrDats(dat);
        super.init(type, uniqueType, canEditDat);
        this._id = dat?.["id"] ?? "";
        this.initUI();
    }

    //筛选可编辑属性节点
    private filterAttrDats(dat) {
        const keys = Object.keys(dat);
        //不能在属性面板上编辑的属性
        const canEditKeys = keys.filter(key => !this._canNotEditKeys.includes(key));
        const resDat = {};
        canEditKeys.forEach(canEditKey => {
            resDat[canEditKey] = dat[canEditKey];
        })
        return resDat;
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
        label.string = `${this._id}`;
    }

    public getExportDat() {
        const dat = super.getExportDat();
        //查漏补缺
        dat["id"] = this._id;
        return dat;
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
        return this._id;
    }

    public setId(newId: string) {
        this._id = newId;
        this.node.name = `${newId}`;
        this.initUI();
    }

    protected onUnitLeftMouseDownForLink(_event: cc.Event.EventMouse): boolean {
        if (ModeMgr.instance.curModeType == ModeType.PathPointLink) {
            EventManager.instance.emit(MapEditorEvent.PathPointLinkClick, this.node);
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

}

ReflectionMgr.registerClass('MapDrawP', MapDrawP);
