import { MapEditor_Ladder, MapEditor_PathPoint, MapEditorMapData } from "./LevelMapDat";
import MapEditorItem from "./MapEditorItem";
import MapEditorPathPoint from "./MapEditorPathPoint";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawer extends cc.Component {

    @property(cc.Node)
    mapRoot: cc.Node;

    @property(cc.Node)
    pathPointLayer: cc.Node;

    @property(cc.SpriteFrame)
    pathPointIcon: cc.SpriteFrame = null;

    @property(cc.Prefab)
    pathPointItemPrefab: cc.Prefab = null;

    @property(cc.SpriteFrame)
    searchPointIcon: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    ladderIcon: cc.SpriteFrame = null;

    @property(cc.Node)
    ladderNd: cc.Node = null;

    @property(cc.Graphics)
    pivotGraphic: cc.Graphics = null;

    private _mapData: MapEditorMapData = null!;

    static ins: MapDrawer = null!;

    protected onLoad(): void {
        MapDrawer.ins = this;
    }

    init(mapData: MapEditorMapData) {
        this._mapData = mapData;
        if (!this._mapData) {
            console.error("MapDrawer init error: mapData is null");
            return;
        }
        // this.drawPivot();
        // this.showPointNds();
        // this.drawRoom();
        // this.drawSearchPoint();
    }



    showPointNds() {
        const pathPoints = this._mapData.getPathPoints();
        pathPoints.forEach((dat) => {
            const itemDat: MapEditorItemData = {
                itemType: MapEditorItemType.PathPoint,
                localPos: cc.v3(dat.pos),
                size: cc.size(100, 100),
                name: dat.id,
            }
            this.addItem(itemDat);
        })
    }

    drawPivot() {
        const graphics = this.pivotGraphic;

        const mapWidth = this._mapData.getSize().width;
        const mapHeight = this._mapData.getSize().height;
        const gridSize = 100;

        const origin = cc.v3(mapWidth / 2, mapHeight / 2);

        // 绘制 X 轴
        graphics.moveTo(0, origin.y);
        graphics.lineTo(mapWidth, origin.y);

        // 绘制 Y 轴
        graphics.moveTo(origin.x, 0);
        graphics.lineTo(origin.x, mapHeight);

        // 绘制箭头
        graphics.moveTo(mapWidth - 10, origin.y + 5);
        graphics.lineTo(mapWidth, origin.y);
        graphics.lineTo(mapWidth - 10, origin.y - 5);

        graphics.moveTo(origin.x - 5, mapHeight - 10);
        graphics.lineTo(origin.x, mapHeight);
        graphics.lineTo(origin.x + 5, mapHeight - 10);

        // 绘制网格（以原点为中心）
        for (let x = origin.x + gridSize; x < mapWidth; x += gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, mapHeight);
        }
        for (let x = origin.x - gridSize; x > 0; x -= gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, mapHeight);
        }
        for (let y = origin.y + gridSize; y < mapHeight; y += gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(mapWidth, y);
        }
        for (let y = origin.y - gridSize; y > 0; y -= gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(mapWidth, y);
        }
        graphics.stroke();
    }

    drawRoom() {
        // if (!this.graphics) {
        //     this.graphics = this._mapNd.addComponent(cc.Graphics);
        // }
        // const rooms = this._mapData.getRooms();
        // this.graphics.clear();
        // rooms.forEach((room: any) => {
        //     const size: { width: number, height: number } = room.size;  // 正方形的边长
        //     const x = room.pos.x;  // 正方形左下角的 x 坐标
        //     const y = room.pos.y;  // 正方形左下角的 y 坐标

        //     this.graphics.strokeColor = new cc.Color(0, 255, 0);  // 设置描边颜色（绿色）
        //     this.graphics.fillColor = new cc.Color(0, 0, 255);  // 设置填充颜色（蓝色）

        //     this.graphics.moveTo(x, y);  // 移动到正方形的起始点

        //     // 绘制正方形
        //     this.graphics.lineTo(x + size.width, y);
        //     this.graphics.lineTo(x + size.width, y + size.height);
        //     this.graphics.lineTo(x, y + size.height);
        //     this.graphics.lineTo(x, y);

        //     this.graphics.close();
        //     this.graphics.stroke();

        // })
    }

    drawSearchPoint() {
        // const searchItemDatas = this._mapData.getSearchItemDatas();
        // searchItemDatas.forEach((dat: MapEditor_SearchItemData) => {
        //     const point = cc.instantiate(this.searchPointNd);
        //     point.setParent(this._mapNd);
        //     point.setPosition(dat.pos.x, dat.pos.y);
        // })
    }

    drawLadder() {
        const ladderDatas = this._mapData.getLadderDatas();
        ladderDatas.forEach((dat: MapEditor_Ladder) => {
            const point = cc.instantiate(this.ladderNd);
            point.setParent(this.mapRoot);
            point.setPosition(dat.pos.x, dat.pos.y);
        })
    }

    /**
     * 向地图上加一个item
     * @param data 
     */
    public addItem(data: MapEditorItemData) {
        let prefab: cc.Prefab;
        let parent: cc.Node;
        switch (data.itemType) {
            case MapEditorItemType.PathPoint:
                prefab = this.pathPointItemPrefab;
                parent = this.pathPointLayer;
                break;
            case MapEditorItemType.SearchPoint:
                break;
        }
        const item = cc.instantiate(prefab);
        item.setParent(parent);
        item.getComponent(MapEditorItem).setDat(data);
        if (data.itemType === MapEditorItemType.PathPoint) {
            item.getComponent(MapEditorPathPoint).setName(data.name);
        }
    }


    public getPathPoints() {
        const dats: MapEditor_PathPoint[] = this._mapData.getPathPoints();
        this.pathPointLayer.children.forEach((child) => {
            const pathPoint = child.getComponent(MapEditorPathPoint);
            const dat = dats.find((dat) => {
                return dat.id === pathPoint.getDat().name;
            })
            if (dat) dat.pos = cc.v2(pathPoint.getDat().localPos.x, pathPoint.getDat().localPos.y);
        });
    }


    //TODO:后续修改获取sp方法
    static getIconSp(itemType: MapEditorItemType) {
        let res: cc.SpriteFrame;
        switch (itemType) {
            case MapEditorItemType.PathPoint:
                res = MapDrawer.ins.pathPointIcon;
                break;
            case MapEditorItemType.SearchPoint:
                res = MapDrawer.ins.searchPointIcon;
                break;
        }
        return res;
    }

}
