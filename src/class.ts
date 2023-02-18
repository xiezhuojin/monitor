import { deepCopy } from "@gby/deep-copy";

import type { Airplane, Device, DeviceClickedHandler, Staff, TrackLine, Zone } from "./interface";

import hornUp from "@/assets/icons/horn/up.png"
import hornDown from "@/assets/icons/horn/down.png"
import cameraUp from "@/assets/icons/camera/up.png"
import cameraDown from "@/assets/icons/camera/down.png"
import radarUp from "@/assets/icons/radar/up.png"
import radarDown from "@/assets/icons/radar/down.png"
import unknownUp from "@/assets/icons/unknown/up.png"
import worker from "@/assets/icons/worker/worker.png"

export class TrackLines {
    private map: AMap.Map;
    private threeDLayer: AMap.Object3DLayer;
    private heads: AMap.Object3D.RoundPoints;
    private lines: AMap.Object3D.MeshLine[];

    constructor(map: AMap.Map) {
        this.map = map;
        this.threeDLayer = new AMap.Object3DLayer();
        this.map.add(this.threeDLayer);

        this.heads = new AMap.Object3D.RoundPoints();
        this.heads.geometry.vertexColors.push(1, 0, 0, 0.6);
        this.heads.geometry.pointSizes.push(6);
        this.threeDLayer.add(this.heads);
        this.lines = [];
    }

    show(trackLines: TrackLine[], ids: number[]) {
        this.heads.geometry.vertices.length = 0;
        this.heads.geometry.vertexColors.length = 0;
        this.heads.geometry.pointSizes.length = 0;
        trackLines.forEach((trackLine) => {
            let position = trackLine.positions[trackLine.positions.length - 1];
            let height = trackLine.heights[trackLine.heights.length - 1];
            let coord = (this.map as any).lngLatToGeodeticCoord(position);
            this.heads.geometry.vertices.push(coord.x, coord.y, -height);
            this.heads.geometry.vertexColors.push(1, 0, 0, 0.6);
            this.heads.geometry.pointSizes.push(6);
        });
        this.heads.needUpdate = true;
        this.heads.reDraw();
       
        while (this.lines.length > trackLines.length) {
            this.threeDLayer.remove(this.lines.pop());
        }
        trackLines.forEach((trackLine, i) => {
            if (i < this.lines.length) {
                let line = this.lines[i];
                line.setPath(trackLine.positions);
                line.setHeight(trackLine.heights);
            } else {
                let line = new AMap.Object3D.MeshLine({
                    path: trackLine.positions,
                    height: trackLine.heights,
                    width: 1,
                    color: "#ffff00",
                })
                this.threeDLayer.add(line);
                this.lines.push(line);
            }
        });
    }
}

export class Devices {
    private map: AMap.Map;
    private devices: Map<string, Map<string, AMap.Marker>>;
    private deviceClickHandler: DeviceClickedHandler;

    constructor(map: AMap.Map, deviceClickHandler: DeviceClickedHandler) {
        this.map = map
        this.devices = new Map();

        this.deviceClickHandler = deviceClickHandler;
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
                this.deviceClickHandler(event, device);
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
                visibility ? marker.show() : marker.hide();
            }
        }
    }
}

export class Zones {
    private threeDLayer: AMap.Object3DLayer;
    private zones: Map<string, Map<string, AMap.Object3D.Prism>>;

    constructor(map: AMap.Map) {
        this.threeDLayer = new AMap.Object3DLayer();
        this.zones = new Map();
        map.add(this.threeDLayer)
    }

    addOrUpdate(zone: Zone) {
        if (!this.zones.has(zone.type)) {
            this.zones.set(zone.type, new Map());
        }

        if (!this.zones.get(zone.type)?.has(zone.id)) {
            let block = new AMap.Object3D.Prism({
                path: zone.path,
                height: zone.height,
                color: zone.color,
            });
            this.threeDLayer.add(block);
            this.zones.get(zone.type)?.set(zone.id, block);
        } else {
            let block = this.zones.get(zone.type)?.get(zone.id);
            block.setOptions({
                path: zone.path,
                height: zone.height,
                color: zone.color,
            })
        }
    }

    setVisibilityByType(type: string, visibility: boolean) {
        let blocks = this.zones.get(type);
        if (blocks) {
            for (let block of blocks.values()) {
                if (visibility) {
                    this.threeDLayer.add(block);
                } else {
                    this.threeDLayer.remove(block);
                }
            }
        }
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
                    offset: new AMap.Pixel(0, -5),
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

    toggleVisibility(visibility: boolean) {
        for (let staff of this.staffs.values()) {
            visibility? staff.show(): staff.hide();
        }
    }
}

export class Airplanes {
    private threeDLayer: AMap.Object3DLayer;
    private airplaneModel: any;

    constructor(map: AMap.Map) {
        this.threeDLayer = new AMap.Object3DLayer();
        map.add(this.threeDLayer)
        this.airplaneModel = null;
    }

    setAirplaneModel(airplaneModel: any) {
        this.airplaneModel = airplaneModel;
    }

    show(airplanes: Airplane[]) {
        this.threeDLayer.clear();
        airplanes.forEach((airplane) => {
            let airplaneModel = deepCopy(this.airplaneModel);
            airplaneModel.setOption({
                position: airplane.position,
                height: airplane.height,
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
            this.threeDLayer.add(airplaneModel);
        })
    }
}