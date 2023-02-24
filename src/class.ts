import type {
    Airplane, CuboidZone, CylinderZone, Device, DeviceClickedHandler, Staff,
    TrackLine,
} from "./interface";

import hornUp from "/icons/horn/up.png"
import hornDown from "/icons/horn/down.png"
import cameraUp from "/icons/camera/up.png"
import cameraDown from "/icons/camera/down.png"
import radarUp from "/icons/radar/up.png"
import radarDown from "/icons/radar/down.png"
import unknownUp from "/icons/unknown/up.png"
import worker from "/icons/worker/worker.png"

import airplaneGltf from "/models/airplane/model.gltf?url";

export class TrackLines {
    private mapProportion: number;

    private map: AMap.Map;
    private labelsLayer: AMap.LabelsLayer;
    private threeDLayer: AMap.Object3DLayer;
    private heads: AMap.Object3D.RoundPoints;
    private lines: AMap.Object3D.MeshLine[];

    constructor(map: AMap.Map, mapProportion: number) {
        this.mapProportion = mapProportion;

        this.map = map;
        this.labelsLayer = new AMap.LabelsLayer({ collision: false });
        this.map.add(this.labelsLayer);
        this.threeDLayer = new AMap.Object3DLayer();
        this.map.add(this.threeDLayer);

        this.heads = new AMap.Object3D.RoundPoints();
        this.heads.geometry.vertexColors.push(1, 0, 0, 0.6);
        this.heads.geometry.pointSizes.push(6);
        this.threeDLayer.add(this.heads);
        this.lines = [];
    }

    show(trackLines: TrackLine[], ids: number[]) {
        this.labelsLayer.clear();
        let markers = trackLines.map((trackLine) => {
            let position = trackLine.positions[trackLine.positions.length - 1];
            let content = `${trackLine.extraInfo.type} ${trackLine.extraInfo.size}`
            let marker = new AMap.LabelMarker({
                position,
                text: {
                    content,
                    style: {
                        strokeColor: "#fff",
                        strokeWidth: 3,
                    }
                }
            })
            return marker;
        });
        this.labelsLayer.add(markers);

        this.heads.geometry.vertices.length = 0;
        this.heads.geometry.vertexColors.length = 0;
        this.heads.geometry.pointSizes.length = 0;
        trackLines.forEach((trackLine) => {
            let position = trackLine.positions[trackLine.positions.length - 1];
            let height = trackLine.heightsInMeter[trackLine.heightsInMeter.length - 1]
                * this.mapProportion;
            let coord = (this.map as any).lngLatToGeodeticCoord(position);
            this.heads.geometry.vertices.push(coord.x, coord.y, -height);
            if (trackLine.extraInfo.type == "bird") {
                this.heads.geometry.vertexColors.push(0, 0, 1, 0.6);
            } else {
                this.heads.geometry.vertexColors.push(1, 0, 0, 0.6);
            }
            this.heads.geometry.pointSizes.push(6);
        });
        this.heads.needUpdate = true;
        this.heads.reDraw();

        while (this.lines.length > trackLines.length) {
            this.threeDLayer.remove(this.lines.pop());
        }
        trackLines.forEach((trackLine, i) => {
            let height = trackLine.heightsInMeter.map((h) => {
                return h * this.mapProportion;
            })
            if (i < this.lines.length) {
                let line = this.lines[i];
                line.setPath(trackLine.positions);
                line.setHeight(height);
            } else {
                let line = new AMap.Object3D.MeshLine({
                    path: trackLine.positions,
                    height,
                    width: 1,
                    color: "#ffff00",
                })
                this.threeDLayer.add(line);
                this.lines.push(line);
            }
        });
    }

    setMarkerVisibility(visibility: boolean) {
        visibility? this.map.add(this.labelsLayer): this.map.remove(this.labelsLayer)
    }
}

export class Devices {
    private map: AMap.Map;
    private devices: Map<string, Map<string, AMap.Marker>>;
    private deviceClickedHandler: DeviceClickedHandler;

    constructor(map: AMap.Map, deviceClickedHandler: DeviceClickedHandler) {
        this.map = map
        this.devices = new Map();

        this.deviceClickedHandler = deviceClickedHandler;
    }

    getDeviceIcon(device: Device) {
        switch (device.type) {
            case "horn":
                return device.extraInfo.functional ? hornUp : hornDown;
            case "camera":
                return device.extraInfo.functional ? cameraUp : cameraDown;
            case "radar":
                return device.extraInfo.functional ? radarUp : radarDown;
            default:
                return unknownUp;
        }
    }

    addOrUpdate(device: Device) {
        if (!this.devices.has(device.type)) {
            this.devices.set(device.type, new Map());
        }

        if (!this.devices.get(device.type)?.has(device.id)) {
            let icon = this.getDeviceIcon(device);
            let marker = new AMap.Marker({
                position: device.position,
                icon,
                label: {
                    content: device.extraInfo.name,
                    direction: "top",
                    offset: new AMap.Pixel(0, -5),
                }
            });
            this.map.add(marker);
            AMap.event.addListener(marker, "click", (event: any) => {
                this.deviceClickedHandler(event, device);
            });
            this.devices.get(device.type)?.set(device.id, marker);
        } else {
            let marker = this.devices.get(device.type)?.get(device.id);
            marker?.setPosition([device.position.lng, device.position.lat]);
            let icon = this.getDeviceIcon(device);
            marker?.setIcon(icon);
            marker?.setLabel({
                content: device.extraInfo.name,
                direction: "top",
                offset: new AMap.Pixel(0, -5),
            })
        }
    }

    setVisibilityByType(type: string, visibility: boolean) {
        let devices = this.devices.get(type);
        if (devices) {
            for (let marker of devices.values()) {
                visibility ? this.map.add(marker) : this.map.remove(marker);
            }
        }
    }
}

export class Zones {
    private mapProportion: number;

    private threeDLayer: AMap.Object3DLayer;
    private map: AMap.Map;
    private zones: Map<string, Map<string, AMap.Object3D.Mesh>>;

    constructor(map: AMap.Map, mapProportion: number) {
        this.mapProportion = mapProportion;

        this.map = map;
        this.threeDLayer = new AMap.Object3DLayer();
        this.map.add(this.threeDLayer);

        this.zones = new Map();
    }

    addCylinder(cylinderZone: CylinderZone, color: [number, number, number, number])
    {
        if (!this.zones.has(cylinderZone.type)) {
            this.zones.set(cylinderZone.type, new Map());
        }
        if (this.zones.get(cylinderZone.type)?.has(cylinderZone.id)) {
            return;
        }

        let segment = 40;
        let center = this.map.lngLatToGeodeticCoord(cylinderZone.position);
        let radius = cylinderZone.radiusInMeter * this.mapProportion;
        let height = cylinderZone.heightInMeter * this.mapProportion;

        let cylinder = new AMap.Object3D.Mesh();
        let geometry = cylinder.geometry;
        let stepAngle = 2 * Math.PI / segment;
        let verticesLength = segment * 2;
        for (let i = 0; i < segment; ++i) {
            let x = center.x + radius * Math.cos(stepAngle * i);
            let y = center.y + radius * Math.sin(stepAngle * i);
            geometry.vertices.push(x, y, 0);
            geometry.vertices.push(x, y, -height);

            let bottomIndex = i * 2;
            let topIndex = bottomIndex + 1;
            let nextBottomIndex = (bottomIndex + 2) % verticesLength;
            let nextTopIndex = (bottomIndex + 3) % verticesLength;

            geometry.faces.push(bottomIndex, topIndex, nextTopIndex);
            geometry.faces.push(bottomIndex, nextTopIndex, nextBottomIndex);
        }
        geometry.vertices.push(center.x, center.y, 0);
        geometry.vertices.push(center.x, center.y, -height);
        for (let i = 0; i < segment; ++i) {
            let bottomIndex = i * 2;
            let topIndex = bottomIndex + 1;
            let nextBottomIndex = (bottomIndex + 2) % verticesLength;
            let nextTopIndex = (bottomIndex + 3) % verticesLength;
            geometry.faces.push(verticesLength + 1, nextTopIndex, topIndex);
            // geometry.faces.push(verticesLength, nextBottomIndex, bottomIndex);
        }
        cylinder.transparent = true;
        for (let i = 0; i < geometry.vertices.length / 3; ++i) {
            geometry.vertexColors.push(...color);
        }
        this.threeDLayer.add(cylinder);

        this.zones.get(cylinderZone.type)?.set(cylinderZone.id, cylinder);
    }

    addCuboid(cuboidZone: CuboidZone, color: [number, number, number, number]) {
        if (!this.zones.has(cuboidZone.type)) {
            this.zones.set(cuboidZone.type, new Map());
        }
        if (this.zones.get(cuboidZone.type)?.has(cuboidZone.id)) {
            return;
        }

        let cuboid = new AMap.Object3D.Mesh();
        let geometry = cuboid.geometry;
        let height = cuboidZone.heightInMeter * this.mapProportion;
        let verticesLength = cuboidZone.positions.length * 2;
        cuboidZone.positions.forEach((position, i) => {
            let coord = (this.map as any).lngLatToGeodeticCoord(position);
            geometry.vertices.push(coord.x, coord.y, 0);
            geometry.vertices.push(coord.x, coord.y, -height);

            let bottomIndex = i * 2;
            let topIndex = bottomIndex + 1;
            let nextBottomIndex = (bottomIndex + 2) % verticesLength;
            let nextTopIndex = (bottomIndex + 3) % verticesLength;

            geometry.faces.push(bottomIndex, topIndex, nextTopIndex);
            geometry.faces.push(bottomIndex, nextTopIndex, nextBottomIndex);
        })
        geometry.faces.push(3, 1, 7);
        geometry.faces.push(5, 3, 7);
        cuboid.transparent = true;
        for (let i = 0; i < geometry.vertices.length / 3; ++i) {
            geometry.vertexColors.push(...color);
        }

        this.threeDLayer.add(cuboid);

        this.zones.get(cuboidZone.type)?.set(cuboidZone.id, cuboid);
    }

    setVisibilityByTypes(type: string, visibility: boolean) {
        let zones = this.zones.get(type);
        zones?.forEach((zone) => {
            visibility? this.threeDLayer.add(zone): this.threeDLayer.remove(zone);
        })
    }
}

export class Staffs {
    private map: AMap.Map;
    private staffs: Map<string, AMap.Marker>;

    constructor(map: AMap.Map) {
        this.map = map;
        this.staffs = new Map();
    }

    addOrUpdate(staff: Staff) {
        if (!this.staffs.has(staff.id)) {
            let icon = worker;
            let marker = new AMap.Marker({
                position: staff.position,
                icon,
                label: {
                    content: staff.extraInfo.name,
                    direction: "top",
                    offset: new AMap.Pixel(0, -20),
                }
            });
            this.map.add(marker);
            this.staffs.set(staff.id, marker);
        } else {
            let marker = this.staffs.get(staff.id);
            marker?.setPosition([staff.position.lng, staff.position.lat])
            marker?.setLabel({
                content: staff.extraInfo.name,
                direction: "top",
                offset: new AMap.Pixel(0, -5),
            })
        }
    }

    setVisibility(visibility: boolean) {
        for (let staff of this.staffs.values()) {
            visibility ? this.map.add(staff): this.map.remove(staff);
        }
    }
}

export class Airplanes {
    private mapProportion: number;
    private threeDLayer: AMap.Object3DLayer;
    private airplanes: Array<any>;

    constructor(map: AMap.Map, mapProportion: number) {
        this.mapProportion = mapProportion;

        this.threeDLayer = new AMap.Object3DLayer();
        this.airplanes = [];
        map.add(this.threeDLayer)
    }

    show(airplanes: Airplane[]) {
        this.threeDLayer.clear();

        while (this.airplanes.length > airplanes.length) {
            this.airplanes.pop()
        }

        let gltfLoader = new AMap.GltfLoader();
        airplanes.forEach((airplane, i) => {
            if (i < this.airplanes.length) {
                let airplaneModel = this.airplanes[i];
                this.threeDLayer.add(airplaneModel);
                airplaneModel.setOption({
                    position: airplane.position,
                    height: airplane.heightInMeter * this.mapProportion,
                    scale: airplane.scale,
                });
                if (airplane.rotateX) {
                    airplaneModel.rotateX(airplane.rotateX);
                }
                if (airplane.rotateY) {
                    airplaneModel.rotateY(airplane.rotateY);
                }
                if (airplane.rotateZ) {
                    airplaneModel.rotateZ(airplane.rotateZ);
                }
            } else {
                gltfLoader.load(airplaneGltf, (airplaneModel: any) => {
                    this.airplanes.push(airplaneModel);
                    this.threeDLayer.add(airplaneModel);
                    airplaneModel.setOption({
                        position: airplane.position,
                        height: airplane.heightInMeter * this.mapProportion,
                        scale: airplane.scale,
                    });
                    if (airplane.rotateX) {
                        airplaneModel.rotateX(airplane.rotateX);
                    }
                    if (airplane.rotateY) {
                        airplaneModel.rotateY(airplane.rotateY);
                    }
                    if (airplane.rotateZ) {
                        airplaneModel.rotateZ(airplane.rotateZ);
                    }
                });
            }
        })
    }
}
