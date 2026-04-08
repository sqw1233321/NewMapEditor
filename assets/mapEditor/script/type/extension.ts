cc.Node.prototype.addComponentSafe = function <T extends cc.Component>(ctor: { new(): T }): T {
    let comp = this.getComponent(ctor);
    if (!comp) {
        comp = this.addComponent(ctor);
    }
    return comp;
};