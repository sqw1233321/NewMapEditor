import { MapDrawDatPathPoint } from "../item/MapDrawDat";
import MapEditorItem from "./MapEditorItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapEditorPathPoint extends MapEditorItem {

    @property(cc.Label)
    searchPointName: cc.Label = null;

    init(pointDat: MapDrawDatPathPoint) {
        this.setName(point.name);
    }



    public setName(nameLb: string) {
        this.searchPointName.string = nameLb;
    }



}
